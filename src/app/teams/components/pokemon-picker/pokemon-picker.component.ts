import {
  ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, inject, input, output,
  signal, viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Observable, Subject, combineLatest, debounceTime, distinctUntilChanged, map, of, switchMap,
} from 'rxjs';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { SEARCH_DEBOUNCE_MS } from '../../../common/constant';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonSelectors } from '../../../pokedex/state/pokemon.selectors';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { PICKER_MAX_SUGGESTIONS } from '../../constants/team.constants';

type SearchStatus = 'idle' | 'loading' | 'error' | 'ready';

interface SearchState {
  status: SearchStatus;
  items: Pokemon[];
  term: string;
}

const IDLE: SearchState = { status: 'idle', items: [], term: '' };

@Component({
  selector: 'app-pokemon-picker',
  standalone: true,
  imports: [ErrorStateComponent, SkeletonComponent],
  templateUrl: './pokemon-picker.component.html',
  styleUrl: './pokemon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonPickerComponent implements OnInit {
  readonly selected = input.required<Pokemon[]>();
  readonly maxItems = input(6);

  readonly pokemonAdd = output<Pokemon>();
  readonly pokemonRemove = output<number>();
  readonly pickerTouched = output<void>();

  readonly skeletonRows = [0, 1, 2];

  private readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly term$ = new Subject<string>();

  readonly searchText = signal('');

  readonly search = toSignal(
    this.term$.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      map((term) => term.trim().toLowerCase()),
      distinctUntilChanged(),
      switchMap((term) => this.search$(term)),
    ),
    { initialValue: IDLE },
  );

  readonly isFull = computed(() => this.selected().length >= this.maxItems());
  readonly suggestions = computed(() => {
    const taken = new Set(this.selected().map((pokemon) => pokemon.id));
    return this.search()
      .items.filter((pokemon) => !taken.has(pokemon.id))
      .slice(0, PICKER_MAX_SUGGESTIONS);
  });
  readonly isOpen = computed(
    () => this.searchText().trim().length > 0 && this.search().status !== 'idle' && !this.isFull(),
  );

  ngOnInit(): void {
    this.store.load();
  }

  onInput(value: string): void {
    this.searchText.set(value);
    this.term$.next(value);
  }

  onEnter(event: Event): void {
    event.preventDefault(); 
    const first = this.suggestions()[0];
    if (first) this.choose(first);
  }

  choose(pokemon: Pokemon): void {
    this.pokemonAdd.emit(pokemon);
    this.clear();
  }

  clear(): void {
    this.searchInput().nativeElement.value = '';
    this.searchText.set('');
    this.term$.next('');
  }

  retry(): void {
    this.store.load();
  }

  private search$(term: string): Observable<SearchState> {
    if (!term) return of(IDLE);
    return combineLatest([this.selectors.status$, this.selectors.entities$]).pipe(
      map(([status, entities]): SearchState => {
        if (status === 'error') return { status: 'error', items: [], term };
        if (status !== 'success') return { status: 'loading', items: [], term };
        return { status: 'ready', items: entities.filter((p) => p.name.includes(term)), term };
      }),
    );
  }
}