import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexResponsive,
  ApexStroke,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

export type PerformanceChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  legend: ApexLegend;
  markers: ApexMarkers;
  grid: ApexGrid;
  title: ApexTitleSubtitle;
  colors: string[];
  responsive: ApexResponsive[];
};

interface Subject {
  id: string;
  name: string;
}

interface TimeRange {
  id: string;
  name: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-performance-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    FormsModule,
    NgApexchartsModule,
  ],
  templateUrl: './student-performance-summary.component.html',
  styleUrls: ['./student-performance-summary.component.scss'],
})
export class StudentPerformanceSummaryComponent implements OnInit {
  public performanceChartOptions!: Partial<PerformanceChartOptions>;

  // Filter options
  selectedSubject: string = 'all';
  selectedTimeRange: string = 'term';

  // Available subjects
  subjects: Subject[] = [
    { id: 'all', name: 'All Subjects' },
    { id: 'math', name: 'Mathematics' },
    { id: 'science', name: 'Science' },
    { id: 'english', name: 'English' },
    { id: 'history', name: 'History' },
    { id: 'art', name: 'Art' },
  ];

  // Available time ranges
  timeRanges: TimeRange[] = [
    { id: 'week', name: 'Last Week' },
    { id: 'month', name: 'Last Month' },
    { id: 'term', name: 'Current Term' },
    { id: 'year', name: 'Academic Year' },
  ];

  // Performance metrics
  performanceMetrics = {
    currentAverage: 78,
    previousAverage: 72,
    highestScore: 95,
    lowestScore: 62,
    improvement: 8.3,
  };

  // Performance data for different subjects
  performanceData = {
    all: {
      week: [
        { x: 'Mon', y: 75 },
        { x: 'Tue', y: 80 },
        { x: 'Wed', y: 72 },
        { x: 'Thu', y: 78 },
        { x: 'Fri', y: 82 },
      ],
      month: [
        { x: 'Week 1', y: 72 },
        { x: 'Week 2', y: 75 },
        { x: 'Week 3', y: 78 },
        { x: 'Week 4', y: 80 },
      ],
      term: [
        { x: 'Sep', y: 70 },
        { x: 'Oct', y: 72 },
        { x: 'Nov', y: 75 },
        { x: 'Dec', y: 78 },
        { x: 'Jan', y: 80 },
      ],
      year: [
        { x: 'Term 1', y: 72 },
        { x: 'Term 2', y: 78 },
        { x: 'Term 3', y: 82 },
      ],
    },
    math: {
      week: [
        { x: 'Mon', y: 80 },
        { x: 'Tue', y: 85 },
        { x: 'Wed', y: 78 },
        { x: 'Thu', y: 82 },
        { x: 'Fri', y: 88 },
      ],
      month: [
        { x: 'Week 1', y: 78 },
        { x: 'Week 2', y: 80 },
        { x: 'Week 3', y: 82 },
        { x: 'Week 4', y: 85 },
      ],
      term: [
        { x: 'Sep', y: 75 },
        { x: 'Oct', y: 78 },
        { x: 'Nov', y: 80 },
        { x: 'Dec', y: 82 },
        { x: 'Jan', y: 85 },
      ],
      year: [
        { x: 'Term 1', y: 75 },
        { x: 'Term 2', y: 82 },
        { x: 'Term 3', y: 88 },
      ],
    },
    science: {
      week: [
        { x: 'Mon', y: 78 },
        { x: 'Tue', y: 82 },
        { x: 'Wed', y: 75 },
        { x: 'Thu', y: 80 },
        { x: 'Fri', y: 85 },
      ],
      month: [
        { x: 'Week 1', y: 75 },
        { x: 'Week 2', y: 78 },
        { x: 'Week 3', y: 80 },
        { x: 'Week 4', y: 82 },
      ],
      term: [
        { x: 'Sep', y: 72 },
        { x: 'Oct', y: 75 },
        { x: 'Nov', y: 78 },
        { x: 'Dec', y: 80 },
        { x: 'Jan', y: 82 },
      ],
      year: [
        { x: 'Term 1', y: 72 },
        { x: 'Term 2', y: 80 },
        { x: 'Term 3', y: 85 },
      ],
    },
    english: {
      week: [
        { x: 'Mon', y: 72 },
        { x: 'Tue', y: 75 },
        { x: 'Wed', y: 70 },
        { x: 'Thu', y: 78 },
        { x: 'Fri', y: 80 },
      ],
      month: [
        { x: 'Week 1', y: 70 },
        { x: 'Week 2', y: 72 },
        { x: 'Week 3', y: 75 },
        { x: 'Week 4', y: 78 },
      ],
      term: [
        { x: 'Sep', y: 68 },
        { x: 'Oct', y: 70 },
        { x: 'Nov', y: 72 },
        { x: 'Dec', y: 75 },
        { x: 'Jan', y: 78 },
      ],
      year: [
        { x: 'Term 1', y: 68 },
        { x: 'Term 2', y: 75 },
        { x: 'Term 3', y: 80 },
      ],
    },
    history: {
      week: [
        { x: 'Mon', y: 70 },
        { x: 'Tue', y: 75 },
        { x: 'Wed', y: 68 },
        { x: 'Thu', y: 72 },
        { x: 'Fri', y: 78 },
      ],
      month: [
        { x: 'Week 1', y: 68 },
        { x: 'Week 2', y: 70 },
        { x: 'Week 3', y: 72 },
        { x: 'Week 4', y: 75 },
      ],
      term: [
        { x: 'Sep', y: 65 },
        { x: 'Oct', y: 68 },
        { x: 'Nov', y: 70 },
        { x: 'Dec', y: 72 },
        { x: 'Jan', y: 75 },
      ],
      year: [
        { x: 'Term 1', y: 65 },
        { x: 'Term 2', y: 72 },
        { x: 'Term 3', y: 78 },
      ],
    },
    art: {
      week: [
        { x: 'Mon', y: 85 },
        { x: 'Tue', y: 88 },
        { x: 'Wed', y: 82 },
        { x: 'Thu', y: 85 },
        { x: 'Fri', y: 90 },
      ],
      month: [
        { x: 'Week 1', y: 82 },
        { x: 'Week 2', y: 85 },
        { x: 'Week 3', y: 88 },
        { x: 'Week 4', y: 90 },
      ],
      term: [
        { x: 'Sep', y: 80 },
        { x: 'Oct', y: 82 },
        { x: 'Nov', y: 85 },
        { x: 'Dec', y: 88 },
        { x: 'Jan', y: 90 },
      ],
      year: [
        { x: 'Term 1', y: 80 },
        { x: 'Term 2', y: 88 },
        { x: 'Term 3', y: 92 },
      ],
    },
  };

  // Class average data for comparison
  classAverageData = {
    week: [
      { x: 'Mon', y: 72 },
      { x: 'Tue', y: 75 },
      { x: 'Wed', y: 70 },
      { x: 'Thu', y: 73 },
      { x: 'Fri', y: 76 },
    ],
    month: [
      { x: 'Week 1', y: 70 },
      { x: 'Week 2', y: 72 },
      { x: 'Week 3', y: 73 },
      { x: 'Week 4', y: 75 },
    ],
    term: [
      { x: 'Sep', y: 68 },
      { x: 'Oct', y: 70 },
      { x: 'Nov', y: 72 },
      { x: 'Dec', y: 73 },
      { x: 'Jan', y: 75 },
    ],
    year: [
      { x: 'Term 1', y: 68 },
      { x: 'Term 2', y: 73 },
      { x: 'Term 3', y: 78 },
    ],
  };

  constructor() {}

  ngOnInit(): void {
    this.initChart();
  }

  // Initialize chart with default options
  initChart(): void {
    this.performanceChartOptions = {
      series: [
        {
          name: 'Student Performance',
          data: this.getPerformanceData(),
        },
        {
          name: 'Class Average',
          data: this.getClassAverageData(),
        },
      ],
      chart: {
        height: 350,
        type: 'line',
        toolbar: {
          show: false,
        },
        fontFamily: 'Roboto, sans-serif',
      },
      colors: ['#4CAF50', '#2196F3'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      grid: {
        borderColor: '#e0e0e0',
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5,
        },
      },
      markers: {
        size: 4,
      },
      xaxis: {
        categories: this.getCategories(),
        labels: {
          style: {
            colors: [],
            fontSize: '12px',
            fontFamily: 'Roboto, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Score',
          style: {
            fontSize: '14px',
            fontFamily: 'Roboto, sans-serif',
          },
        },
        min: 50,
        max: 100,
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        floating: true,
        offsetY: -25,
        offsetX: -5,
      },
      tooltip: {
        theme: 'light',
        marker: {
          show: true,
        },
        x: {
          show: true,
        },
      },
    };
  }

  // Update chart when filters change
  updateChart(): void {
    this.performanceChartOptions.series = [
      {
        name: 'Student Performance',
        data: this.getPerformanceData(),
      },
      {
        name: 'Class Average',
        data: this.getClassAverageData(),
      },
    ];

    this.performanceChartOptions.xaxis = {
      categories: this.getCategories(),
    };
  }

  // Get performance data based on selected filters
  getPerformanceData(): any[] {
    if (
      this.performanceData[
        this.selectedSubject as keyof typeof this.performanceData
      ]
    ) {
      return this.performanceData[
        this.selectedSubject as keyof typeof this.performanceData
      ][this.selectedTimeRange as keyof typeof this.performanceData.all];
    }
    return this.performanceData.all[
      this.selectedTimeRange as keyof typeof this.performanceData.all
    ];
  }

  // Get class average data based on selected time range
  getClassAverageData(): any[] {
    return this.classAverageData[
      this.selectedTimeRange as keyof typeof this.classAverageData
    ];
  }

  // Get x-axis categories based on selected time range
  getCategories(): string[] {
    const data = this.getPerformanceData();
    return data.map((item) => item.x);
  }

  // Handle subject filter change
  onSubjectChange(): void {
    this.updateChart();
  }

  // Handle time range filter change
  onTimeRangeChange(): void {
    this.updateChart();
  }

  // Calculate performance trend (positive or negative)
  getPerformanceTrend(): 'positive' | 'negative' | 'neutral' {
    const data = this.getPerformanceData();
    if (data.length < 2) return 'neutral';

    const firstValue = data[0].y;
    const lastValue = data[data.length - 1].y;

    if (lastValue > firstValue) return 'positive';
    if (lastValue < firstValue) return 'negative';
    return 'neutral';
  }

  // Get trend icon based on performance trend
  getTrendIcon(): string {
    const trend = this.getPerformanceTrend();
    if (trend === 'positive') return 'trending_up';
    if (trend === 'negative') return 'trending_down';
    return 'trending_flat';
  }

  // Get trend color based on performance trend
  getTrendColor(): string {
    const trend = this.getPerformanceTrend();
    if (trend === 'positive') return 'trend-positive';
    if (trend === 'negative') return 'trend-negative';
    return 'trend-neutral';
  }

  getSelectedSubjectName(): string {
    const subject = this.subjects.find((s) => s.id === this.selectedSubject);
    return subject ? subject.name : '';
  }
}
