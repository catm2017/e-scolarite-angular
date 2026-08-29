import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  NgApexchartsModule,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexFill,
  ApexStroke,
  ApexDataLabels,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: any;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  colors: string[];
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-course-progress-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule],
  templateUrl: './course-progress-chart.component.html',
  styleUrls: ['./course-progress-chart.component.scss'],
})
export class CourseProgressChartComponent {
  public subjects = [
    {
      name: 'Mathematics',
      percentage: 75,
      completedChapters: 15,
      totalChapters: 20,
      status: 'On Track',
      statusClass: 'on-track',
      color: '#6366f1',
      icon: 'calculate',
    },
    {
      name: 'Physics',
      percentage: 60,
      completedChapters: 9,
      totalChapters: 15,
      status: 'Needs Focus',
      statusClass: 'needs-focus',
      color: '#06b6d4',
      icon: 'analytics',
    },
    {
      name: 'Chemistry',
      percentage: 85,
      completedChapters: 17,
      totalChapters: 20,
      status: 'Ahead',
      statusClass: 'ahead',
      color: '#f59e0b',
      icon: 'science',
    },
  ];

  public chartOptions: Partial<ChartOptions>;

  constructor() {
    const series = this.subjects.map((s) => s.percentage);
    const labels = this.subjects.map((s) => s.name);
    const colors = this.subjects.map((s) => s.color);
    const avg = Math.round(series.reduce((a, b) => a + b, 0) / series.length);

    this.chartOptions = {
      series: series,
      chart: {
        height: 200,
        type: 'radialBar',
        sparkline: {
          enabled: true,
        },
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '50%',
          },
          track: {
            background: 'rgba(0, 0, 0, 0.05)',
            strokeWidth: '97%',
            margin: 6,
          },
          dataLabels: {
            name: {
              show: true,
              fontSize: '12px',
              fontWeight: 600,
              offsetY: -8,
            },
            value: {
              show: true,
              fontSize: '18px',
              fontWeight: 700,
              offsetY: 2,
              formatter: function (val) {
                return val + '%';
              },
            },
            total: {
              show: true,
              label: 'Average',
              fontSize: '11px',
              fontWeight: 500,
              formatter: function (w) {
                return avg + '%';
              },
            },
          },
        },
      },
      labels: labels,
      colors: colors,
    };
  }
}
