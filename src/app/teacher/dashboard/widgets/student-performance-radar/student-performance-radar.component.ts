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
  ApexMarkers,
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
  markers: ApexMarkers;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-performance-radar',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgApexchartsModule
],
  templateUrl: './student-performance-radar.component.html',
  styleUrls: ['./student-performance-radar.component.scss'],
})
export class StudentPerformanceRadarComponent {
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Class A',
          data: [80, 90, 70, 85, 95],
        },
        {
          name: 'Class B',
          data: [75, 80, 85, 75, 80],
        },
      ],
      chart: {
        height: 280,
        type: 'radar',
        toolbar: {
          show: false,
        },
        dropShadow: {
          enabled: true,
          blur: 1,
          left: 1,
          top: 1,
        },
      },
      colors: ['#00E396', '#008FFB'],
      stroke: {
        width: 2,
      },
      fill: {
        opacity: 0.2,
      },
      markers: {
        size: 4,
      },
      xaxis: {
        categories: [
          'Attendance',
          'Assignments',
          'Exams',
          'Participation',
          'Projects',
        ],
      },
      dataLabels: {
        enabled: true,
        background: {
          enabled: true,
          borderRadius: 2,
        },
      },
      tooltip: {
        theme: 'dark',
      },
    };
  }
}
