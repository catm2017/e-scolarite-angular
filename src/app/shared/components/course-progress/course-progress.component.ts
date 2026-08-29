import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { NgScrollbar } from 'ngx-scrollbar';
import {
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type CourseChartOptions = {
  series: any[];
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  fill: ApexFill;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  colors: string[];
};

interface Course {
  id: number;
  name: string;
  instructor: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  grade: string;
  lastAccessed: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-course-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    NgScrollbar,
    NgApexchartsModule,
  ],
  templateUrl: './course-progress.component.html',
  styleUrls: ['./course-progress.component.scss'],
})
export class CourseProgressComponent {
  public chartOptions!: Partial<CourseChartOptions>;

  courses: Course[] = [
    {
      id: 1,
      name: 'Advanced Mathematics',
      instructor: 'Dr. Robert Smith',
      progress: 75,
      totalModules: 12,
      completedModules: 9,
      grade: 'A-',
      lastAccessed: '2023-10-15',
    },
    {
      id: 2,
      name: 'Introduction to Physics',
      instructor: 'Prof. Maria Johnson',
      progress: 60,
      totalModules: 10,
      completedModules: 6,
      grade: 'B+',
      lastAccessed: '2023-10-14',
    },
    {
      id: 3,
      name: 'World Literature',
      instructor: 'Dr. James Wilson',
      progress: 90,
      totalModules: 8,
      completedModules: 7,
      grade: 'A',
      lastAccessed: '2023-10-16',
    },
    {
      id: 4,
      name: 'Computer Science Fundamentals',
      instructor: 'Prof. Emily Chen',
      progress: 45,
      totalModules: 15,
      completedModules: 7,
      grade: 'B',
      lastAccessed: '2023-10-12',
    },
    {
      id: 5,
      name: 'Environmental Studies',
      instructor: 'Dr. Michael Brown',
      progress: 30,
      totalModules: 10,
      completedModules: 3,
      grade: 'C+',
      lastAccessed: '2023-10-10',
    },
  ];

  constructor() {
    this.initChart();
  }

  initChart(): void {
    this.chartOptions = {
      series: [
        {
          name: 'Course Completion',
          data: this.courses.map((course) => course.progress),
        },
      ],
      chart: {
        type: 'radar',
        height: 330,
        toolbar: {
          show: false,
        },
      },
      xaxis: {
        categories: this.courses.map((course) => course.name),
      },
      yaxis: {
        show: false,
        max: 100,
      },
      fill: {
        opacity: 0.4,
        colors: ['#3f51b5'],
      },
      stroke: {
        width: 2,
        colors: ['#3f51b5'],
      },
      dataLabels: {
        enabled: true,
        background: {
          enabled: true,
          borderRadius: 2,
        },
      },
      plotOptions: {
        radar: {
          size: 140,
          polygons: {
            strokeColors: '#e9e9e9',
            fill: {
              colors: ['#f8f8f8', '#fff'],
            },
          },
        },
      },
      colors: ['#3f51b5'],
      tooltip: {
        y: {
          formatter: (val) => `${val}%`,
        },
      },
    };
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'primary';
    if (progress >= 50) return 'accent';
    return 'warn';
  }
}
