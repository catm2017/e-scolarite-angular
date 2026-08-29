import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexXAxis,
  ApexDataLabels,
  ApexFill,
  ApexStroke,
  ApexGrid,
  ApexYAxis,
  ApexTooltip,
  ApexLegend,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: any;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  colors: string[];
  fill: ApexFill;
  stroke: ApexStroke;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-class-average-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule],
  templateUrl: './class-average-chart.component.html',
  styleUrls: ['./class-average-chart.component.scss'],
})
export class ClassAverageChartComponent {
  public grades = [
    {
      name: 'Grade 10A',
      score: 78,
      trend: 'up',
      change: '+3%',
      color: '#6366f1',
    },
    {
      name: 'Grade 10B',
      score: 85,
      trend: 'up',
      change: '+5%',
      color: '#06b6d4',
    },
    {
      name: 'Grade 11A',
      score: 65,
      trend: 'down',
      change: '-2%',
      color: '#f59e0b',
    },
    {
      name: 'Grade 11B',
      score: 72,
      trend: 'up',
      change: '+1%',
      color: '#10b981',
    },
    {
      name: 'Grade 12A',
      score: 92,
      trend: 'up',
      change: '+4%',
      color: '#8b5cf6',
    },
  ];

  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [
        { name: 'Average Score', data: this.grades.map((g) => g.score) },
      ],
      chart: {
        type: 'bar',
        height: 150,
        toolbar: { show: false },
        sparkline: { enabled: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          horizontal: false,
          columnWidth: '55%',
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val + '%';
        },
        style: {
          fontSize: '11px',
          fontWeight: 700,
          colors: ['#fff'],
        },
        dropShadow: {
          enabled: false,
        },
      },
      xaxis: {
        categories: this.grades.map((g) => g.name),
        labels: {
          show: false,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
      grid: {
        show: false,
        padding: {
          top: -15,
          bottom: -10,
        },
      },
      colors: this.grades.map((g) => g.color),
      fill: {
        opacity: 1,
      },
      stroke: {
        show: false,
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + '%';
          },
        },
      },
      legend: {
        show: false,
      },
    };
  }
}
