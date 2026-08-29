import { Component, OnInit, input, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend,
  ApexTooltip,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  title: ApexTitleSubtitle;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-progress-chart',
  templateUrl: './student-progress-chart.component.html',
  styleUrls: ['./student-progress-chart.component.scss'],
  standalone: true,
  imports: [MatCardModule, MatButtonModule, NgApexchartsModule, MatIconModule],
})
export class StudentProgressChartComponent implements OnInit {
  readonly chart = viewChild.required<ChartComponent>('chart');
  public chartOptions!: Partial<ChartOptions>;

  readonly title = input('Student Progress');
  readonly subtitle = input('Average performance by subject');
  readonly chartData = input<any>(null);

  constructor() {}

  ngOnInit(): void {
    this.initChart();
  }

  private initChart(): void {
    // Use provided data or default data
    const data = this.chartData() || this.getDefaultData();

    this.chartOptions = {
      series: data.series,
      chart: {
        height: 375,
        type: 'line',
        foreColor: '#9aa0ac',
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2,
        },
        toolbar: {
          show: false,
        },
        fontFamily: 'Roboto, sans-serif',
      },
      colors: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      markers: {
        size: 4,
      },
      xaxis: {
        categories: data.categories,
        title: {
          text: 'Month',
        },
      },
      yaxis: {
        title: {
          text: 'Score (0-100)',
        },
        min: 0,
        max: 100,
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'right',
        floating: true,
        offsetY: 30,
        offsetX: 0,
      },
      tooltip: {
        theme: 'dark',
      },
    };
  }

  private getDefaultData() {
    return {
      series: [
        {
          name: 'Mathematics',
          data: [70, 75, 72, 78, 82, 85],
        },
        {
          name: 'Science',
          data: [65, 68, 75, 74, 80, 82],
        },
        {
          name: 'English',
          data: [78, 80, 76, 79, 82, 85],
        },
        {
          name: 'History',
          data: [72, 74, 78, 76, 79, 81],
        },
        {
          name: 'Art',
          data: [85, 82, 86, 88, 90, 92],
        },
      ],
      categories: ['January', 'February', 'March', 'April', 'May', 'June'],
    };
  }
}
