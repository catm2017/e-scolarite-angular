import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexGrid,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-course-enrollment-chart',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    NgApexchartsModule
],
  templateUrl: './course-enrollment-chart.component.html',
  styleUrl: './course-enrollment-chart.component.scss',
})
export class CourseEnrollmentChartComponent {
  public chartOptions!: Partial<ChartOptions>;

  constructor() {
    this.initChart();
  }

  private initChart(): void {
    this.chartOptions = {
      series: [
        { name: 'STEM/Science', data: [310, 400, 280, 510, 420, 600] },
        { name: 'Commerce & Law', data: [110, 320, 450, 320, 340, 520] },
        { name: 'Humanities & Arts', data: [70, 90, 80, 150, 140, 210] },
      ],
      chart: {
        height: 330,
        type: 'area',
        toolbar: { show: false },
        foreColor: '#9aa0ac',
      },
      colors: ['#4F86F8', '#3EBE77', '#FDA24C'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      grid: {
        borderColor: 'rgba(154, 160, 172, 0.15)',
        strokeDashArray: 4,
      },
      xaxis: {
        type: 'category',
        categories: ['2021', '2022', '2023', '2024', '2025', '2026'],
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: {
          text: 'Enrolled Students',
          style: { color: '#9aa0ac', fontWeight: 500 },
        },
        labels: {
          formatter: (value) => `${value}`,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetY: -10,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      tooltip: {
        theme: 'dark',
        x: { format: 'dd/MM/yy HH:mm' },
      },
    };
  }
}
