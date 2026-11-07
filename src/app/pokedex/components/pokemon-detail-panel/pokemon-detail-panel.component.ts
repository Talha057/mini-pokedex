import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { LoggerService } from '../../../core/logger.service';
import { Pokemon, PokemonAbility } from '../../models/pokemon.model';
import { PokemonApiService } from '../../services/pokemon-api.service';
import { StatRadarChartComponent } from '../stat-radar-chart/stat-radar-chart.component';

type AbilitiesStatus = 'loading' | 'success' | 'empty' | 'error';

interface AbilitiesState {
  status: AbilitiesStatus;
  abilities: PokemonAbility[];
}

const LOADING: AbilitiesState = { status: 'loading', abilities: [] };
const FAILED: AbilitiesState = { status: 'error', abilities: [] };

@Component({
  selector: 'app-pokemon-detail-panel',
  standalone: true,
  imports: [ErrorStateComponent, SkeletonComponent, StatRadarChartComponent, TypeBadgeComponent],
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class PokemonDetailPanelComponent {
  readonly pokemon = input.required<Pokemon>();
  readonly closed = output<void>();

  private readonly api = inject(PokemonApiService);
  private readonly logger = inject(LoggerService);
  private readonly retryCount = signal(0);

  private readonly abilitiesRequest = computed(() => ({
    id: this.pokemon().id,
    attempt: this.retryCount(),
  }));

  readonly abilitiesState = toSignal(
    toObservable(this.abilitiesRequest).pipe(
      switchMap(({ id }) =>
        this.api.getAbilities$(id).pipe(
          map((abilities): AbilitiesState => ({
            status: abilities.length ? 'success' : 'empty',
            abilities,
          })),
          startWith(LOADING),
          catchError((error: unknown) => {
            this.logger.error('loading abilities failed', { error, id });
            return of(FAILED);
          }),
        ),
      ),
    ),
    { initialValue: LOADING },
  );

  readonly heightMeters = computed(() => this.pokemon().height / 10);
  readonly weightKg = computed(() => this.pokemon().weight / 10);

  retryAbilities(): void {
    this.retryCount.update((count) => count + 1);
  }
}