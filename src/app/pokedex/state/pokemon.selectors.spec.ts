import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { PokemonSelectors } from './pokemon.selectors';
import { PokemonStore } from './pokemon.store';

function makePokemon(id: number, name: string, types: string[], speed: number): Pokemon {
  return {
    id,
    name,
    height: 10,
    weight: 10,
    types,
    stats: { hp: 50, attack: 50, defense: 50, 'special-attack': 50, 'special-defense': 50, speed },
    total: 250 + speed,
    spriteUrl: '',
  };
}

const FIXTURES = [
  makePokemon(1, 'bulbasaur', ['grass'], 45),
  makePokemon(4, 'charmander', ['fire'], 65),
  makePokemon(6, 'charizard', ['fire'], 100),
  makePokemon(7, 'squirtle', ['water'], 43),
];

describe('PokemonSelectors', () => {
  let store: PokemonStore;
  let selectors: PokemonSelectors;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: PokemonApiService, useValue: { getPokemonPage$: () => of(FIXTURES) } }],
    });
    store = TestBed.inject(PokemonStore);
    selectors = TestBed.inject(PokemonSelectors);
    store.load();
  });

  afterEach(() => vi.useRealTimers());

  it('filters by type and sorts by a stat, highest first', async () => {
    store.setTypeFilter('fire');
    store.setSort('speed');

    const rows = await firstValueFrom(selectors.paged$);

    expect(rows.map((p) => p.name)).toEqual(['charizard', 'charmander']);
  });

  it('applies the name search only after the debounce window', async () => {
    store.setSearchTerm('squi');
    vi.advanceTimersByTime(299);
    expect(await firstValueFrom(selectors.totalCount$)).toBe(4);

    vi.advanceTimersByTime(1);
    expect(await firstValueFrom(selectors.totalCount$)).toBe(1);
  });
});