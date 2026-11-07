import { LoadStatus } from '../../common/models/load-status.model';
import { Team } from './team.model';

export interface TeamState {
  teams: Team[];
  status: LoadStatus;
  errorMessage: string | null;
  mutationError: string | null;
}