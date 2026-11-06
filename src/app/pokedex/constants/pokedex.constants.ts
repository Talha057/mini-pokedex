export const POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';
export const SPRITE_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
export const POKEMON_CHUNK_SIZE = 200;
export const STAT_NAMES = [
  'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed',
] as const;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
export const LOAD_ERROR_MESSAGE = 'Could not load Pokémon. Check your connection and try again.';