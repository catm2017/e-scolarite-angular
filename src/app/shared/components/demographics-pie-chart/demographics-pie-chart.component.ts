import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  NgApexchartsModule,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexLegend,
  ApexDataLabels,
  ApexTooltip,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demographics-pie-chart',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    NgApexchartsModule
],
  templateUrl: './demographics-pie-chart.component.html',
  styleUrl: './demographics-pie-chart.component.scss',
})
export class DemographicsPieChartComponent {
  public chartOptions!: Partial<ChartOptions>;

  constructor() {
    this.initChart();
  }

  private initChart(): void {
    this.chartOptions = {
      series: [45, 35, 15, 5],
      chart: {
        height: 330,
        type: 'pie',
        foreColor: '#9aa0ac',
      },
      labels: ['Local Students', 'Out of State', 'International', 'Exchange Program'],
      colors: ['#4F86F8', '#3EBE77', '#FDA24C', '#E25A66'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(0)}%`,
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      tooltip: {
        theme: 'dark',
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    };
  }
}
