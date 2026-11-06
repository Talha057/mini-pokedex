import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { API_REQUEST_TIMEOUT_MS } from '../../common/constant';
import { GraphqlResponse, unwrapGraphql } from '../../common/utils/graphql.util';
import { retryWithDelay } from '../../common/utils/retry-with-delay.util';
import { POKEAPI_GRAPHQL_URL, SPRITE_BASE_URL, STAT_NAMES } from '../constants/pokedex.constants';
import { Pokemon, PokemonAbility, StatName } from '../models/pokemon.model';

interface PokemonDto {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemontypes: { type: { name: string } }[];
  pokemonstats: { base_stat: number; stat: { name: string } }[];
  pokemonsprites: { sprites: unknown }[];
}

interface AbilityDto {
  is_hidden: boolean;
  ability: {
    name: string;
    abilityeffecttexts: { short_effect: string }[];
  };
}

const POKEMON_FIELDS = `
  id name height weight
  pokemontypes { type { name } }
  pokemonstats { base_stat stat { name } }
  pokemonsprites { sprites }
`;

const GET_POKEMON = `
  query GetPokemon($limit: Int, $offset: Int) {
    pokemon(limit: $limit, offset: $offset, order_by: { id: asc }, where: { is_default: { _eq: true } }) {
      ${POKEMON_FIELDS}
    }
  }`;

const GET_POKEMON_BY_ID = `
  query GetPokemonById($id: Int) {
    pokemon(where: { id: { _eq: $id } }) { ${POKEMON_FIELDS} }
  }`;

const GET_ABILITIES = `
  query GetAbilities($pokemonId: Int) {
    pokemonability(where: { pokemon_id: { _eq: $pokemonId } }) {
      is_hidden
      ability {
        name
        abilityeffecttexts(where: { language_id: { _eq: 9 } }) { short_effect }
      }
    }
  }`;

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly http = inject(HttpClient);

  getPokemonPage$(limit: number, offset: number): Observable<Pokemon[]> {
    return this.query$<{ pokemon: PokemonDto[] }>(GET_POKEMON, { limit, offset }).pipe(
      map((data) => data.pokemon.map(toPokemon)),
    );
  }

  getPokemonById$(id: number): Observable<Pokemon | null> {
    return this.query$<{ pokemon: PokemonDto[] }>(GET_POKEMON_BY_ID, { id }).pipe(
      map((data) => (data.pokemon[0] ? toPokemon(data.pokemon[0]) : null)),
    );
  }

  getAbilities$(pokemonId: number): Observable<PokemonAbility[]> {
    return this.query$<{ pokemonability: AbilityDto[] }>(GET_ABILITIES, { pokemonId }).pipe(
      map((data) =>
        data.pokemonability.map((row) => ({
          name: row.ability.name,
          effect: row.ability.abilityeffecttexts[0]?.short_effect ?? '',
          isHidden: row.is_hidden,
        })),
      ),
    );
  }

  private query$<T>(query: string, variables: Record<string, unknown>): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(POKEAPI_GRAPHQL_URL, { query, variables })
      .pipe(
        timeout<GraphqlResponse<T>>(API_REQUEST_TIMEOUT_MS),
        unwrapGraphql<T>(),
        retryWithDelay<T>(),
      );
  }
}

function toPokemon(dto: PokemonDto): Pokemon {
  const stats = Object.fromEntries(
    dto.pokemonstats.map((s) => [s.stat.name, s.base_stat]),
  ) as Record<StatName, number>;
  return {
    id: dto.id,
    name: dto.name,
    height: dto.height,
    weight: dto.weight,
    types: dto.pokemontypes.map((t) => t.type.name),
    stats,
    total: STAT_NAMES.reduce((sum, name) => sum + (stats[name] ?? 0), 0),
    spriteUrl: resolveSpriteUrl(dto.id, dto.pokemonsprites[0]?.sprites),
  };
}

function resolveSpriteUrl(id: number, raw: unknown): string {
  return readFrontDefault(raw) ?? `${SPRITE_BASE_URL}/${id}.png`;
}

function readFrontDefault(raw: unknown): string | null {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return (parsed as { front_default?: string } | null)?.front_default ?? null;
  } catch {
    return null;
  }
}