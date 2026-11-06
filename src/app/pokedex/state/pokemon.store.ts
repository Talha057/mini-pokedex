import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject, EMPTY, Observable, Subject, catchError, debounceTime, defer,
  distinctUntilChanged, exhaustMap, expand, map, tap,
} from 'rxjs';
import { SEARCH_DEBOUNCE_MS } from '../../common/constant';
import { LoggerService } from '../../core/logger.service';
import {
  DEFAULT_PAGE_SIZE, LOAD_ERROR_MESSAGE, POKEMON_CHUNK_SIZE,
} from '../constants/pokedex.constants';
import { PageSize, PokemonState, SortField } from '../models/pokemon-state.model';
import { Pokemon } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';

const INITIAL_STATE: PokemonState = {
  entities: [],
  status: 'idle',
  errorMessage: null,
  searchTerm: '',
  typeFilter: null,
  sortField: 'id',
  sortDirection: 'asc',
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);
  private readonly logger = inject(LoggerService);

  private readonly stateSubject = new BehaviorSubject<PokemonState>(INITIAL_STATE);
  private readonly loadRequests$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  readonly state$ = this.stateSubject.asObservable();

  constructor() {
    this.loadRequests$
      .pipe(exhaustMap(() => this.loadAll$()), takeUntilDestroyed())
      .subscribe();

    this.searchInput$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        map((term) => term.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((searchTerm) => this.patch({ searchTerm, pageIndex: 0 }));
  }

  get snapshot(): PokemonState {
    return this.stateSubject.value;
  }

 
  load(): void {
    if (this.snapshot.status === 'success') return;
    this.loadRequests$.next();
  }

  setSearchTerm(term: string): void {
    this.searchInput$.next(term);
  }

  setTypeFilter(type: string | null): void {
    this.patch({ typeFilter: type, pageIndex: 0 });
  }

  
  setSort(field: SortField): void {
    const { sortField, sortDirection } = this.snapshot;
    if (field === sortField) {
      this.patch({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc', pageIndex: 0 });
      return;
    }
    const direction = field === 'id' || field === 'name' ? 'asc' : 'desc';
    this.patch({ sortField: field, sortDirection: direction, pageIndex: 0 });
  }

  setPageSize(pageSize: PageSize): void {
    this.patch({ pageSize, pageIndex: 0 });
  }

  setPageIndex(pageIndex: number): void {
    this.patch({ pageIndex });
  }

  private loadAll$(): Observable<Pokemon[]> {
    this.patch({ status: 'loading', errorMessage: null });
    return this.fetchChunks$(this.snapshot.entities.length).pipe(
      tap({
        next: (chunk) => this.patch({ entities: [...this.snapshot.entities, ...chunk] }),
        complete: () => this.patch({ status: 'success' }),
      }),
      catchError((error: unknown) => {
        this.logger.error('loading pokemon failed', { error });
        this.patch({ status: 'error', errorMessage: LOAD_ERROR_MESSAGE });
        return EMPTY;
      }),
    );
  }

  private fetchChunks$(startOffset: number): Observable<Pokemon[]> {
    return defer(() => {
      let offset = startOffset;
      const nextChunk$ = (): Observable<Pokemon[]> =>
        this.api
          .getPokemonPage$(POKEMON_CHUNK_SIZE, offset)
          .pipe(tap(() => (offset += POKEMON_CHUNK_SIZE)));

      return nextChunk$().pipe(
        expand((chunk) => (chunk.length === POKEMON_CHUNK_SIZE ? nextChunk$() : EMPTY)),
      );
    });
  }

  private patch(partial: Partial<PokemonState>): void {
    this.stateSubject.next({ ...this.snapshot, ...partial });
  }
}