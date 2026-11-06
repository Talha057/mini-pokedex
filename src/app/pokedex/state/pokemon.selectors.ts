import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { PokemonState, SortDirection, SortField } from '../models/pokemon-state.model';
import { Pokemon } from '../models/pokemon.model';
import { PokemonStore } from './pokemon.store';

export function filterPokemon(list: Pokemon[], term: string, type: string | null): Pokemon[] {
  const needle = term.toLowerCase();
  return list.filter(
    (pokemon) =>
      (!needle || pokemon.name.includes(needle)) && (!type || pokemon.types.includes(type)),
  );
}

export function sortPokemon(list: Pokemon[], field: SortField, direction: SortDirection): Pokemon[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...list].sort(
    (a, b) => factor * compare(sortValue(a, field), sortValue(b, field)) || a.id - b.id,
  );
}

function sortValue(pokemon: Pokemon, field: SortField): string | number {
  if (field === 'name') return pokemon.name;
  if (field === 'id' || field === 'total') return pokemon[field];
  return pokemon.stats[field];
}

function compare(a: string | number, b: string | number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

@Injectable({ providedIn: 'root' })
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);

  readonly status$ = this.select((s) => s.status);
  readonly errorMessage$ = this.select((s) => s.errorMessage);
  readonly entities$ = this.select((s) => s.entities);
  readonly searchTerm$ = this.select((s) => s.searchTerm);
  readonly typeFilter$ = this.select((s) => s.typeFilter);
  readonly sortField$ = this.select((s) => s.sortField);
  readonly sortDirection$ = this.select((s) => s.sortDirection);
  readonly pageIndex$ = this.select((s) => s.pageIndex);
  readonly pageSize$ = this.select((s) => s.pageSize);

  readonly typeOptions$ = this.entities$.pipe(
    map((list) => [...new Set(list.flatMap((pokemon) => pokemon.types))].sort()),
  );

  readonly filtered$ = combineLatest([this.entities$, this.searchTerm$, this.typeFilter$]).pipe(
    map(([entities, term, type]) => filterPokemon(entities, term, type)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly sorted$ = combineLatest([this.filtered$, this.sortField$, this.sortDirection$]).pipe(
    map(([list, field, direction]) => sortPokemon(list, field, direction)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly totalCount$ = this.filtered$.pipe(
    map((list) => list.length),
    distinctUntilChanged(),
  );

  readonly pageCount$ = combineLatest([this.totalCount$, this.pageSize$]).pipe(
    map(([total, size]) => Math.max(1, Math.ceil(total / size))),
    distinctUntilChanged(),
  );

  readonly paged$ = combineLatest([this.sorted$, this.pageIndex$, this.pageSize$]).pipe(
    map(([list, index, size]) => list.slice(index * size, (index + 1) * size)),
  );

  private select<T>(project: (state: PokemonState) => T): Observable<T> {
    return this.store.state$.pipe(map(project), distinctUntilChanged());
  }
}