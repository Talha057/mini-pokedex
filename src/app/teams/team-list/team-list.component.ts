import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, catchError } from 'rxjs';
import { EmptyStateComponent } from '../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../common/components/skeleton/skeleton.component';
import { LoadStatus } from '../../common/models/load-status.model';
import { CacheService } from '../../common/services/cache.service';
import { Pokemon } from '../../pokedex/models/pokemon.model';
import { PokemonStore } from '../../pokedex/state/pokemon.store';
import { TeamCardComponent } from '../components/team-card/team-card.component';
import { SELECTED_TEAM_CACHE_KEY, TEAMS_LOAD_ERROR_MESSAGE } from '../constants/team.constants';
import { Team } from '../models/team.model';
import { TeamView } from '../models/team-view.model';
import { TeamStore } from '../state/team.store';
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-team-list-page',
  standalone: true,
  imports: [EmptyStateComponent, ErrorStateComponent, SkeletonComponent, TeamCardComponent,RouterLink],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListPage implements OnInit {
  readonly skeletonItems = [0, 1, 2];
  readonly fallbackError = TEAMS_LOAD_ERROR_MESSAGE;

  private readonly teamStore = inject(TeamStore);
  private readonly pokemonStore = inject(PokemonStore);
  private readonly cache = inject(CacheService);
  private readonly destroyRef = inject(DestroyRef);

  // Store streams bridged into signals for the template
  readonly status = toSignal(this.teamStore.status$, { initialValue: 'idle' as LoadStatus });
  readonly errorMessage = toSignal(this.teamStore.errorMessage$, { initialValue: null });
  readonly mutationError = toSignal(this.teamStore.mutationError$, { initialValue: null });
  readonly teams = toSignal(this.teamStore.teams$, { initialValue: [] as Team[] });
  readonly pokemonState = toSignal(this.pokemonStore.state$, { requireSync: true });

  // UI state: restored from storage, written back by the effect below
  readonly selectedTeamId = signal<string | null>(
    this.cache.get<string>(SELECTED_TEAM_CACHE_KEY),
  );

  // Derived state
  readonly statsStatus = computed(() => this.pokemonState().status);
  private readonly pokemonById = computed(
    () => new Map(this.pokemonState().entities.map((pokemon) => [pokemon.id, pokemon])),
  );
  readonly views = computed<TeamView[]>(() =>
    this.teams().map((team) => ({
      team,
      pending: this.teamStore.isPending(team),
      members: team.pokemonIds
        .map((id) => this.pokemonById().get(id))
        .filter((pokemon): pokemon is Pokemon => pokemon !== undefined),
    })),
  );

  constructor() {
    // Persist the selected team so it survives a reload
    effect(() => {
      const id = this.selectedTeamId();
      if (id) {
        this.cache.set(SELECTED_TEAM_CACHE_KEY, id);
      } else {
        this.cache.remove(SELECTED_TEAM_CACHE_KEY);
      }
    });
  }

  ngOnInit(): void {
    this.teamStore.load();
    this.pokemonStore.load();
  }

  onSelect(id: string): void {
    this.selectedTeamId.set(id === this.selectedTeamId() ? null : id);
  }

  onDelete(id: string): void {
    // The store has already rolled back and set the error message on failure
    this.teamStore
      .deleteTeam(id)
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  retryTeams(): void {
    this.teamStore.load();
  }

  retryStats(): void {
    this.pokemonStore.load();
  }

  dismissError(): void {
    this.teamStore.clearMutationError();
  }
}