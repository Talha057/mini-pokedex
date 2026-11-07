import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerService } from '../../core/logger.service';
import { CREATE_TEAM_ERROR_MESSAGE, DELETE_TEAM_ERROR_MESSAGE } from '../constants/team.constants';
import { NewTeam, Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';
import { TeamStore } from './team.store';

const EXISTING: Team[] = [
  { id: '1', trainerId: 1, name: 'Kanto Starters', pokemonIds: [25, 6], createdAt: '2024-01-15T10:00:00Z' },
  { id: '2', trainerId: 1, name: 'Johto Squad', pokemonIds: [157], createdAt: '2024-03-20T14:30:00Z' },
];
const DRAFT: NewTeam = { name: 'Elite Four', pokemonIds: [1, 4] };
const CREATED: Team = {
  id: '4', trainerId: 1, name: 'Elite Four', pokemonIds: [1, 4], createdAt: '2026-11-07T10:00:00Z',
};

describe('TeamStore', () => {
  let store: TeamStore;
  let create$: Subject<Team>;
  let delete$: Subject<void>;

  beforeEach(() => {
    create$ = new Subject<Team>();
    delete$ = new Subject<void>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TeamApiService,
          useValue: {
            getTeams$: () => of(EXISTING),
            createTeam$: () => create$,
            deleteTeam$: () => delete$,
          },
        },
        { provide: LoggerService, useValue: { error: vi.fn() } },
      ],
    });
    store = TestBed.inject(TeamStore);
    store.load();
  });

  it('shows a created team immediately and swaps in the server copy on success', () => {
    store.createTeam(DRAFT).subscribe();

    expect(store.snapshot.teams).toHaveLength(3);
    expect(store.snapshot.teams[0].name).toBe('Elite Four');
    expect(store.isPending(store.snapshot.teams[0])).toBe(true);

    create$.next(CREATED);
    create$.complete();

    expect(store.snapshot.teams[0]).toEqual(CREATED);
    expect(store.snapshot.teams).toHaveLength(3);
  });

  it('rolls back the optimistic team and reports an error when creating fails', () => {
    const errors: unknown[] = [];
    store.createTeam(DRAFT).subscribe({ error: (error) => errors.push(error) });
    expect(store.snapshot.teams).toHaveLength(3);

    create$.error(new Error('network down'));

    expect(store.snapshot.teams).toEqual(EXISTING);
    expect(store.snapshot.mutationError).toBe(CREATE_TEAM_ERROR_MESSAGE);
    expect(errors).toHaveLength(1);
  });

  it('puts a deleted team back at its old position when the delete fails', () => {
    store.deleteTeam('1').subscribe({ error: () => undefined });
    expect(store.snapshot.teams.map((team) => team.id)).toEqual(['2']);

    delete$.error(new Error('network down'));

    expect(store.snapshot.teams).toEqual(EXISTING);
    expect(store.snapshot.mutationError).toBe(DELETE_TEAM_ERROR_MESSAGE);
  });
});