import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { STAT_LABELS, STAT_MAX, STAT_NAMES } from '../../constants/pokedex.constants';
import { StatName } from '../../models/pokemon.model';

const CHART_COLOR = '#007acc';
const GRID_COLOR = 'rgba(255, 255, 255, 0.15)';

@Component({
  selector: 'app-stat-radar-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './stat-radar-chart.component.html',
  styleUrl: './stat-radar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRadarChartComponent {
  readonly stats = input.required<Record<StatName, number>>();
  readonly label = input('');


  readonly baseOptions: EChartsCoreOption = {
    animationDuration: 700,
    animationDurationUpdate: 700,
    animationEasingUpdate: 'cubicOut',
    tooltip: {},
    radar: {
      radius: '62%',
      indicator: STAT_NAMES.map((name) => ({ name: STAT_LABELS[name], max: STAT_MAX })),
      axisName: { color: 'rgba(255, 255, 255, 0.85)' },
      axisLine: { lineStyle: { color: GRID_COLOR } },
      splitLine: { lineStyle: { color: GRID_COLOR } },
      splitArea: { show: false },
    },
    series: [
      {
        type: 'radar',
        data: [{ value: STAT_NAMES.map(() => 0) }],
        lineStyle: { color: CHART_COLOR, width: 2 },
        itemStyle: { color: CHART_COLOR },
        areaStyle: { color: CHART_COLOR, opacity: 0.35 },
      },
    ],
  };


  readonly dataOptions = computed<EChartsCoreOption>(() => ({
    series: [
      {
        data: [
          {
            name: this.label(),
            value: STAT_NAMES.map((name) => this.stats()[name]),
          },
        ],
      },
    ],
  }));
}