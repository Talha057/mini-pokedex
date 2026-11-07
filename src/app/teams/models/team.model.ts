export interface Team {
  id: string;
  trainerId: number;
  name: string;
  pokemonIds: number[];
  createdAt: string;
}

export interface NewTeam {
  name: string;
  pokemonIds: number[];
}