import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { SortDirection, SortField } from '../../../pokedex/models/pokemon-state.model';
import { Pokemon, StatName } from '../../../pokedex/models/pokemon.model';

type ColumnField = StatName | 'total';

interface StatColumn {
  field: ColumnField;
  label: string;
}

const STAT_COLUMNS: StatColumn[] = [
  { field: 'hp', label: 'HP' },
  { field: 'attack', label: 'Attack' },
  { field: 'defense', label: 'Defense' },
  { field: 'special-attack', label: 'Sp. Atk' },
  { field: 'special-defense', label: 'Sp. Def' },
  { field: 'speed', label: 'Speed' },
  { field: 'total', label: 'Total' },
];

@Component({
  selector: 'app-pokedex-table',
  standalone: true,
  imports: [SkeletonComponent, TypeBadgeComponent],
  templateUrl: './pokedex-table.component.html',
  styleUrl: './pokedex-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexTableComponent {
  readonly rows = input.required<Pokemon[]>();
  readonly loading = input(false);
  readonly sortField = input.required<SortField>();
  readonly sortDirection = input.required<SortDirection>();
  readonly skeletonRowCount = input(10);
  readonly sortChange = output<SortField>();

  readonly statColumns = STAT_COLUMNS;
  readonly skeletonRows = computed(() =>
    Array.from({ length: this.skeletonRowCount() }, (_, index) => index),
  );
  readonly selectedId = input<number | null>(null);
readonly rowSelect = output<Pokemon>();

  statValue(row: Pokemon, field: ColumnField): number {
    return field === 'total' ? row.total : row.stats[field];
  }

  ariaSort(field: ColumnField): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== field) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }
}