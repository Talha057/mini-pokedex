import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { LoadStatus } from '../../../common/models/load-status.model';
import { formatDateTime, parseISODateTime } from '../../../common/utils/datetime.util';
import { SPRITE_BASE_URL } from '../../../pokedex/constants/pokedex.constants';
import { TeamView } from '../../models/team-view.model';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [SkeletonComponent, TypeBadgeComponent],
  templateUrl: './team-card.component.html',
  styleUrl: './team-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCardComponent {
  readonly view = input.required<TeamView>();
  readonly selected = input(false);
  readonly statsStatus = input<LoadStatus>('idle');

  readonly teamSelect = output<string>();
  readonly teamDelete = output<string>();
  readonly statsRetry = output<void>();

  readonly createdLabel = computed(() => {
    const date = parseISODateTime(this.view().team.createdAt);
    return date ? formatDateTime(date) : '';
  });

  readonly totalBaseStats = computed(() =>
    this.view().members.reduce((sum, pokemon) => sum + pokemon.total, 0),
  );

  readonly typeDistribution = computed(() => {
    const counts = new Map<string, number>();
    for (const pokemon of this.view().members) {
      for (const type of pokemon.types) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
    }
    return [...counts]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
  });

  readonly missingCount = computed(
    () => this.view().team.pokemonIds.length - this.view().members.length,
  );

  spriteUrl(id: number): string {
    return `${SPRITE_BASE_URL}/${id}.png`;
  }
}