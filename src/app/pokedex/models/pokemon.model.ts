import { STAT_NAMES } from '../constants/pokedex.constants';

export type StatName = (typeof STAT_NAMES)[number];

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: Record<StatName, number>;
  total: number;
  spriteUrl: string;
}

export interface PokemonAbility {
  name: string;
  effect: string;
  isHidden: boolean;
}