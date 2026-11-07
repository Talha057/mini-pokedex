import { Routes } from '@angular/router';
import { RadarChart } from 'echarts/charts';
import { RadarComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { provideEchartsCore } from 'ngx-echarts';

echarts.use([RadarChart, RadarComponent, TooltipComponent, CanvasRenderer]);

export const pokedexRoutes: Routes = [
  {
    path: '',
    providers: [provideEchartsCore({ echarts })],
    loadComponent: () =>
      import('./pokedex-list/pokedex-list.component').then((m) => m.PokedexListPage),
  },
];