import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from '../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../common/components/error-state/error-state.component';
import { PokedexTableComponent } from '../../common/components/pokedex-table/pokedex-table.component';
import { LOAD_ERROR_MESSAGE, PAGE_SIZE_OPTIONS } from '../constants/pokedex.constants';
import { SortField } from '../models/pokemon-state.model';
import { Pokemon } from '../models/pokemon.model';
import { PokemonSelectors } from '../state/pokemon.selectors';
import { PokemonStore } from '../state/pokemon.store';

@Component({
  selector: 'app-pokedex-list-page',
  standalone: true,
  imports: [PokedexTableComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './pokedex-list.component.html',
  styleUrl: './pokedex-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexListPage implements OnInit {
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly fallbackError = LOAD_ERROR_MESSAGE;

  private readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);

  // Store selectors bridged into signals for the template
  readonly status = toSignal(this.selectors.status$, { initialValue: 'idle' as const });
  readonly errorMessage = toSignal(this.selectors.errorMessage$, { initialValue: null });
  readonly rows = toSignal(this.selectors.paged$, { initialValue: [] as Pokemon[] });
  readonly typeOptions = toSignal(this.selectors.typeOptions$, { initialValue: [] as string[] });
  readonly typeFilter = toSignal(this.selectors.typeFilter$, { initialValue: null });
  readonly sortField = toSignal(this.selectors.sortField$, { initialValue: 'id' as const });
  readonly sortDirection = toSignal(this.selectors.sortDirection$, { initialValue: 'asc' as const });
  readonly pageIndex = toSignal(this.selectors.pageIndex$, { initialValue: 0 });
  readonly pageSize = toSignal(this.selectors.pageSize$, { initialValue: 10 as const });
  readonly pageCount = toSignal(this.selectors.pageCount$, { initialValue: 1 });
  readonly totalCount = toSignal(this.selectors.totalCount$, { initialValue: 0 });

  // Derived UI state
  readonly isReady = computed(() => this.status() === 'success');
  readonly canGoPrevious = computed(() => this.pageIndex() > 0);
  readonly canGoNext = computed(() => this.pageIndex() < this.pageCount() - 1);

  ngOnInit(): void {
    this.store.load();
  }

  onSearch(term: string): void {
    this.store.setSearchTerm(term);
  }

  onTypeChange(type: string): void {
    this.store.setTypeFilter(type || null);
  }

  onSort(field: SortField): void {
    this.store.setSort(field);
  }

  onPageSizeChange(value: string): void {
    const size = PAGE_SIZE_OPTIONS.find((option) => option === Number(value));
    if (size) this.store.setPageSize(size);
  }

  previousPage(): void {
    this.store.setPageIndex(this.pageIndex() - 1);
  }

  nextPage(): void {
    this.store.setPageIndex(this.pageIndex() + 1);
  }

  retry(): void {
    this.store.load();
  }
}