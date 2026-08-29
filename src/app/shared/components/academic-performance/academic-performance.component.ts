import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexGrid,
  ApexTooltip,
  ApexLegend,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-academic-performance',
  standalone: true,
  imports: [
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    NgApexchartsModule
],
  templateUrl: './academic-performance.component.html',
  styleUrls: ['./academic-performance.component.scss'],
})
export class AcademicPerformanceComponent implements OnInit {
  public chartOptions!: Partial<ChartOptions>;
  selectedClass = 'Grade 10';

  classes = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  performanceData: Record<string, { subject: string; score: number }[]> = {
    'Grade 9': [
      { subject: 'Math', score: 78 },
      { subject: 'Science', score: 82 },
      { subject: 'English', score: 85 },
      { subject: 'History', score: 74 },
      { subject: 'Arts', score: 90 },
      { subject: 'Computer', score: 88 },
    ],
    'Grade 10': [
      { subject: 'Math', score: 84 },
      { subject: 'Science', score: 89 },
      { subject: 'English', score: 81 },
      { subject: 'History', score: 79 },
      { subject: 'Arts', score: 92 },
      { subject: 'Computer', score: 94 },
    ],
    'Grade 11': [
      { subject: 'Math', score: 72 },
      { subject: 'Science', score: 76 },
      { subject: 'English', score: 88 },
      { subject: 'History', score: 82 },
      { subject: 'Arts', score: 85 },
      { subject: 'Computer', score: 80 },
    ],
    'Grade 12': [
      { subject: 'Math', score: 91 },
      { subject: 'Science', score: 93 },
      { subject: 'English', score: 89 },
      { subject: 'History', score: 87 },
      { subject: 'Arts', score: 95 },
      { subject: 'Computer', score: 98 },
    ],
  };

  ngOnInit() {
    this.initChart();
  }

  initChart() {
    const currentData = this.performanceData[this.selectedClass];
    const categories = currentData.map((d) => d.subject);
    const seriesData = currentData.map((d) => d.score);

    this.chartOptions = {
      series: [
        {
          name: 'Average Score (%)',
          data: seriesData,
        },
      ],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        foreColor: '#9aa0ac',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 6,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}%`,
        style: {
          colors: ['#fff'],
        },
      },
      xaxis: {
        categories: categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: {
          formatter: (val) => `${val}%`,
        },
      },
      grid: {
        borderColor: 'rgba(154, 160, 172, 0.15)',
        strokeDashArray: 4,
      },
      colors: ['#5c67f2'],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val) => `${val}%`,
        },
      },
    };
  }

  onClassChange(className: string) {
    this.selectedClass = className;
    const currentData = this.performanceData[className];
    this.chartOptions.series = [
      {
        name: 'Average Score (%)',
        data: currentData.map((d) => d.score),
      },
    ];
  }
}
