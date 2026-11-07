import { Routes } from '@angular/router';

export const teamsRoutes: Routes = [
     {
    path: 'new',
    loadComponent: () => import('./team-form/team-form.component').then((m) => m.TeamFormPage),
  },
  {
    path: '',
    loadComponent: () => import('./team-list/team-list.component').then((m) => m.TeamListPage),
  },
];