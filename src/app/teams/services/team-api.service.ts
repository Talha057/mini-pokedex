import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { API_REQUEST_TIMEOUT_MS } from '../../common/constant';
import { GraphqlResponse, unwrapGraphql } from '../../common/utils/graphql.util';
import { retryWithDelay } from '../../common/utils/retry-with-delay.util';
import { DEFAULT_TRAINER_ID, TEAMS_GRAPHQL_URL } from '../constants/team.constants';
import { NewTeam, Team } from '../models/team.model';

interface TeamDto {
  id: string;
  trainer_id: string;
  name: string;
  pokemon_ids: number[];
  created_at: string;
}

const TEAM_FIELDS = 'id trainer_id name pokemon_ids created_at';

const GET_TEAMS = `query GetTeams { allTeams { ${TEAM_FIELDS} } }`;

const CREATE_TEAM = `
  mutation CreateTeam($trainerId: ID!, $name: String!, $pokemonIds: [Int!]!, $createdAt: String!) {
    createTeam(trainer_id: $trainerId, name: $name, pokemon_ids: $pokemonIds, created_at: $createdAt) {
      ${TEAM_FIELDS}
    }
  }`;

const REMOVE_TEAM = `mutation RemoveTeam($id: ID!) { removeTeam(id: $id) { id } }`;

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly http = inject(HttpClient);

  getTeams$(): Observable<Team[]> {
    return this.request$<{ allTeams: TeamDto[] }>(GET_TEAMS).pipe(
      retryWithDelay<{ allTeams: TeamDto[] }>(),
      map((data) => data.allTeams.map(toTeam)),
    );
  }

 
  createTeam$(team: NewTeam): Observable<Team> {
    return this.request$<{ createTeam: TeamDto }>(CREATE_TEAM, {
      trainerId: DEFAULT_TRAINER_ID,
      name: team.name,
      pokemonIds: team.pokemonIds,
      createdAt: new Date().toISOString(),
    }).pipe(map((data) => toTeam(data.createTeam)));
  }

  deleteTeam$(id: string): Observable<void> {
    return this.request$<{ removeTeam: { id: string } | null }>(REMOVE_TEAM, { id }).pipe(
      map(() => undefined),
    );
  }

  private request$<T>(query: string, variables: Record<string, unknown> = {}): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(TEAMS_GRAPHQL_URL, { query, variables })
      .pipe(timeout<GraphqlResponse<T>>(API_REQUEST_TIMEOUT_MS), unwrapGraphql<T>());
  }
}

function toTeam(dto: TeamDto): Team {
  return {
    id: dto.id,
    trainerId: Number(dto.trainer_id),
    name: dto.name,
    pokemonIds: dto.pokemon_ids,
    createdAt: dto.created_at,
  };
}