import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject, EMPTY, Observable, Subject, catchError, defer, distinctUntilChanged,
  exhaustMap, map, shareReplay, tap, throwError,
} from 'rxjs';
import { LoggerService } from '../../core/logger.service';
import {
  CREATE_TEAM_ERROR_MESSAGE, DEFAULT_TRAINER_ID, DELETE_TEAM_ERROR_MESSAGE,
  TEAMS_LOAD_ERROR_MESSAGE, TEMP_ID_PREFIX,
} from '../constants/team.constants';
import { NewTeam, Team } from '../models/team.model';
import { TeamState } from '../models/team-state.model';
import { TeamApiService } from '../services/team-api.service';

const INITIAL_STATE: TeamState = {
  teams: [],
  status: 'idle',
  errorMessage: null,
  mutationError: null,
};

@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly logger = inject(LoggerService);

  private readonly stateSubject = new BehaviorSubject<TeamState>(INITIAL_STATE);
  private readonly loadRequests$ = new Subject<void>();
  private tempCounter = 0;

  readonly state$ = this.stateSubject.asObservable();
  readonly status$ = this.select((state) => state.status);
  readonly errorMessage$ = this.select((state) => state.errorMessage);
  readonly mutationError$ = this.select((state) => state.mutationError);

  readonly teams$ = this.select((state) => state.teams).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    this.loadRequests$
      .pipe(exhaustMap(() => this.fetchTeams$()), takeUntilDestroyed())
      .subscribe();
  }

  get snapshot(): TeamState {
    return this.stateSubject.value;
  }

  load(): void {
    if (this.snapshot.status === 'success') return;
    this.loadRequests$.next();
  }


  createTeam(draft: NewTeam): Observable<Team> {
    return defer(() => {
      const tempId = `${TEMP_ID_PREFIX}${++this.tempCounter}`;
      const optimistic: Team = {
        id: tempId,
        trainerId: DEFAULT_TRAINER_ID,
        name: draft.name,
        pokemonIds: draft.pokemonIds,
        createdAt: new Date().toISOString(),
      };
      this.patch({ teams: [optimistic, ...this.snapshot.teams], mutationError: null });

      return this.api.createTeam$(draft).pipe(
        tap((created) =>
          this.patch({
            teams: this.snapshot.teams.map((team) => (team.id === tempId ? created : team)),
          }),
        ),
        catchError((error: unknown) => {
          this.logger.error('creating team failed', { error });
          this.patch({
            teams: this.snapshot.teams.filter((team) => team.id !== tempId),
            mutationError: CREATE_TEAM_ERROR_MESSAGE,
          });
          return throwError(() => error);
        }),
      );
    });
  }


  deleteTeam(id: string): Observable<void> {
    return defer(() => {
      const index = this.snapshot.teams.findIndex((team) => team.id === id);
      const removed = this.snapshot.teams[index];
      if (!removed || this.isPending(removed)) return EMPTY;

      this.patch({
        teams: this.snapshot.teams.filter((team) => team.id !== id),
        mutationError: null,
      });

      return this.api.deleteTeam$(id).pipe(
        catchError((error: unknown) => {
          this.logger.error('deleting team failed', { error, id });
          const teams = [...this.snapshot.teams];
          teams.splice(Math.min(index, teams.length), 0, removed);
          this.patch({ teams, mutationError: DELETE_TEAM_ERROR_MESSAGE });
          return throwError(() => error);
        }),
      );
    });
  }

  isNameTaken(name: string): boolean {
    const needle = name.trim().toLowerCase();
    return this.snapshot.teams.some((team) => team.name.trim().toLowerCase() === needle);
  }

  isPending(team: Team): boolean {
    return team.id.startsWith(TEMP_ID_PREFIX);
  }

  clearMutationError(): void {
    this.patch({ mutationError: null });
  }

  private fetchTeams$(): Observable<Team[]> {
    this.patch({ status: 'loading', errorMessage: null });
    return this.api.getTeams$().pipe(
      tap((teams) => this.patch({ teams, status: 'success' })),
      catchError((error: unknown) => {
        this.logger.error('loading teams failed', { error });
        this.patch({ status: 'error', errorMessage: TEAMS_LOAD_ERROR_MESSAGE });
        return EMPTY;
      }),
    );
  }

  private select<T>(project: (state: TeamState) => T): Observable<T> {
    return this.state$.pipe(map(project), distinctUntilChanged());
  }

  private patch(partial: Partial<TeamState>): void {
    this.stateSubject.next({ ...this.snapshot, ...partial });
  }
}