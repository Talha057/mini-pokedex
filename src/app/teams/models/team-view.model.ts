import { Pokemon } from '../../pokedex/models/pokemon.model';
import { Team } from './team.model';

export interface TeamView {
  team: Team;
  members: Pokemon[];
  pending: boolean;
}