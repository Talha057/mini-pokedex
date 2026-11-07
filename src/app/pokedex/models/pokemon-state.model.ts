import { PAGE_SIZE_OPTIONS } from '../constants/pokedex.constants';
import { Pokemon, StatName } from './pokemon.model';
import { LoadStatus } from '../../common/models/load-status.model';

export type SortField = 'id' | 'name' | 'total' | StatName;
export type SortDirection = 'asc' | 'desc';
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export interface PokemonState {
  entities: Pokemon[];
  status: LoadStatus;
  errorMessage: string | null;
  searchTerm: string;
  typeFilter: string | null;
  sortField: SortField;
  sortDirection: SortDirection;
  pageIndex: number;
  pageSize: PageSize;
}