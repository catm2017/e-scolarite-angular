import { Component, input, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import {
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type AttendanceChartOptions = {
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
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  fill: ApexFill;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-attendance-widget',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    MatBadgeModule,
    NgApexchartsModule,
  ],
  templateUrl: './student-attendance-widget.component.html',
  styleUrls: ['./student-attendance-widget.component.scss'],
})
export class StudentAttendanceWidgetComponent {
  readonly selectedClass = input<string>('All Classes');

  public attendanceChartOptions!: Partial<AttendanceChartOptions>;

  // Daily summary data
  dailySummary = {
    present: 342,
    absent: 18,
    late: 24,
    total: 384,
  };

  // Class options for filter
  classes = [
    { value: 'All Classes', viewValue: 'All Classes' },
    { value: 'Class 1', viewValue: 'Class 1' },
    { value: 'Class 2', viewValue: 'Class 2' },
    { value: 'Class 3', viewValue: 'Class 3' },
    { value: 'Class 4', viewValue: 'Class 4' },
    { value: 'Class 5', viewValue: 'Class 5' },
  ];

  // Weekly attendance data
  weeklyData = {
    'All Classes': [
      { name: 'Present', data: [320, 332, 301, 334, 340, 315, 342] },
      { name: 'Absent', data: [40, 32, 45, 32, 34, 52, 18] },
      { name: 'Late', data: [24, 20, 38, 18, 10, 17, 24] },
    ],
    'Class 1': [
      { name: 'Present', data: [58, 62, 55, 65, 60, 57, 65] },
      { name: 'Absent', data: [7, 3, 10, 5, 5, 8, 2] },
      { name: 'Late', data: [5, 5, 5, 0, 5, 5, 3] },
    ],
    'Class 2': [
      { name: 'Present', data: [60, 58, 60, 60, 64, 55, 63] },
      { name: 'Absent', data: [8, 10, 8, 8, 4, 13, 5] },
      { name: 'Late', data: [2, 2, 2, 2, 2, 2, 2] },
    ],
    'Class 3': [
      { name: 'Present', data: [65, 68, 66, 69, 70, 65, 72] },
      { name: 'Absent', data: [5, 2, 4, 1, 0, 5, 0] },
      { name: 'Late', data: [0, 0, 0, 0, 0, 0, 0] },
    ],
    'Class 4': [
      { name: 'Present', data: [68, 72, 60, 70, 75, 68, 70] },
      { name: 'Absent', data: [10, 6, 18, 8, 3, 10, 5] },
      { name: 'Late', data: [2, 2, 2, 2, 2, 2, 5] },
    ],
    'Class 5': [
      { name: 'Present', data: [69, 72, 60, 70, 71, 70, 72] },
      { name: 'Absent', data: [10, 7, 5, 10, 9, 10, 6] },
      { name: 'Late', data: [15, 11, 29, 8, 0, 0, 14] },
    ],
  };

  constructor() {
    this.initChart();
  }

  initChart() {
    this.attendanceChartOptions = {
      series: this.weeklyData['All Classes'],
      chart: {
        height: 330,
        type: 'line',
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
        foreColor: '#9aa0ac',
      },
      colors: ['#4CAF50', '#F44336', '#FF9800'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      grid: {
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5,
        },
        borderColor: '#9aa0ac',
      },
      markers: {
        size: 4,
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
        title: {
          text: 'Last 7 Days',
        },
      },
      yaxis: {
        title: {
          text: 'Number of Students',
        },
        min: 0,
        max: 400,
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        floating: true,
        offsetY: 40,
        offsetX: -5,
      },
      tooltip: {
        theme: 'dark',
        marker: {
          show: true,
        },
        x: {
          show: true,
        },
      },
    };
  }

  updateClass(className: string) {
    // Update chart data based on selected class
    this.attendanceChartOptions.series =
      this.weeklyData[className as keyof typeof this.weeklyData];

    // Update daily summary based on selected class
    if (className === 'All Classes') {
      this.dailySummary = {
        present: 342,
        absent: 18,
        late: 24,
        total: 384,
      };
    } else if (className === 'Class 1') {
      this.dailySummary = {
        present: 65,
        absent: 2,
        late: 3,
        total: 70,
      };
    } else if (className === 'Class 2') {
      this.dailySummary = {
        present: 63,
        absent: 5,
        late: 2,
        total: 70,
      };
    } else if (className === 'Class 3') {
      this.dailySummary = {
        present: 72,
        absent: 0,
        late: 0,
        total: 72,
      };
    } else if (className === 'Class 4') {
      this.dailySummary = {
        present: 70,
        absent: 5,
        late: 5,
        total: 80,
      };
    } else if (className === 'Class 5') {
      this.dailySummary = {
        present: 72,
        absent: 6,
        late: 14,
        total: 92,
      };
    }
  }

  // Calculate percentage for attendance metrics
  getPercentage(value: number): number {
    return Math.round((value / this.dailySummary.total) * 100);
  }
}
