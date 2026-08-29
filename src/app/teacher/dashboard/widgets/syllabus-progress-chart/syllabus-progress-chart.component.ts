import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexStroke,
  ApexFill,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  stroke: ApexStroke;
  fill: ApexFill;
  colors: string[];
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-syllabus-progress-chart',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgApexchartsModule
],
  templateUrl: './syllabus-progress-chart.component.html',
  styleUrls: ['./syllabus-progress-chart.component.scss'],
})
export class SyllabusProgressChartComponent {
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [76, 67, 85, 40],
      chart: {
        height: 250,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: 0,
          endAngle: 270,
          hollow: {
            margin: 5,
            size: '30%',
            background: 'transparent',
            image: undefined,
          },
          track: {
            background: 'rgba(0, 0, 0, 0.05)',
            margin: 5,
          },
          dataLabels: {
            name: {
              show: true,
              fontSize: '13px',
              fontFamily: 'Poppins, sans-serif',
              offsetY: -5,
            },
            value: {
              show: true,
              fontSize: '18px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              offsetY: 2,
            },
          },
        },
      },
      colors: ['#1ab7ea', '#0084ff', '#39539E', '#0077B5'],
      labels: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
      stroke: {
        lineCap: 'round',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#00d2ff', '#3a7bd5', '#4a00e0', '#8e2de2'],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
    };
  }
}
