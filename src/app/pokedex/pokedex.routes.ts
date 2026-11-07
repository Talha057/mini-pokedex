import { Routes } from '@angular/router';

export const pokedexRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pokedex-list/pokedex-list.component').then((m) => m.PokedexListPage),
  },
];