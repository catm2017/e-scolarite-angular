import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexFill,
  ApexTooltip,
  ApexYAxis,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  tooltip: ApexTooltip;
  colors: string[];
  yaxis: ApexYAxis;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-teaching-hours-chart',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgApexchartsModule
],
  templateUrl: './teaching-hours-chart.component.html',
  styleUrls: ['./teaching-hours-chart.component.scss'],
})
export class TeachingHoursChartComponent {
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Teaching Hours',
          data: [4, 6, 5, 7, 3, 5],
        },
        {
          name: 'Prep Hours',
          data: [2, 3, 2, 4, 1, 3],
        },
      ],
      chart: {
        height: 310,
        type: 'area',
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      colors: ['#6366f1', '#10b981'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        min: 0,
        max: 8,
      },
      tooltip: {
        theme: 'dark',
      },
    };
  }
}
