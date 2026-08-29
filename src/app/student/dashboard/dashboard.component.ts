import { Component, OnInit, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexTooltip,
  ApexDataLabels,
  ApexPlotOptions,
  ApexResponsive,
  ApexGrid,
  ApexLegend,
  ApexFill,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MatButtonModule } from '@angular/material/button';
import { NgScrollbar } from 'ngx-scrollbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BaseChartDirective } from 'ng2-charts';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import {
  ProgressTableComponent,
  SubjectProgress,
} from '@shared/components/progress-table/progress-table.component';
import { EmpScheduleComponent } from '@shared/components/emp-schedule/emp-schedule.component';
import { TableCardComponent } from '@shared/components/table-card/table-card.component';
import { ColumnDefinition } from '@shared/components/master-table/master-table.component';
// Import new components
import { RecentGradesComponent } from '@shared/components/recent-grades/recent-grades.component';
import { UpcomingAssignmentsComponent } from '@shared/components/upcoming-assignments/upcoming-assignments.component';
import { CourseProgressComponent } from '@shared/components/course-progress/course-progress.component';
import { DailyTimetableComponent } from '@shared/components/daily-timetable/daily-timetable.component';

export type barChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  xaxis: ApexXAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  fill: ApexFill;
};

export type areaChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    BreadcrumbComponent,
    BaseChartDirective,
    MatProgressBarModule,
    MatCardModule,
    NgApexchartsModule,
    NgScrollbar,
    MatButtonModule,
    ProgressTableComponent,
    EmpScheduleComponent,
    TableCardComponent,
    RecentGradesComponent,
    UpcomingAssignmentsComponent,
    CourseProgressComponent,
    DailyTimetableComponent,
    MatIconModule
  ],
})
export class DashboardComponent implements OnInit {
  readonly chart = viewChild.required<ChartComponent>('chart');
  public barChartOptions!: Partial<barChartOptions>;
  public areaChartOptions!: Partial<areaChartOptions>;

  breadscrums = [
    {
      title: 'Dashboard',
      items: ['Student'],
      active: 'Dashboard',
    },
  ];
  constructor() {
    //constructor
  }

  // Doughnut chart start

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };
  public doughnutChartLabels: string[] = [
    'Development',
    'Java Classes',
    'Painting ',
    'Geography Class',
  ];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [32, 25, 20, 23],
        backgroundColor: ['#5A5FAF', '#F7BF31', '#EA6E6C', '#28BDB8'],
      },
    ],
  };
  public doughnutChartType: ChartType = 'doughnut';

  // Doughnut chart end

  ngOnInit() {
    this.chart1();
    this.chart2();
  }

  private chart1() {
    this.areaChartOptions = {
      series: [
        {
          name: 'Mathes',
          data: [31, 40, 28, 51, 42, 85, 77],
        },
        {
          name: 'Science',
          data: [11, 32, 45, 32, 34, 52, 41],
        },
      ],
      chart: {
        height: 350,
        type: 'area',
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      colors: ['#F77A9A', '#A054F7'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
      },
      xaxis: {
        categories: [
          'test 1',
          'test 2',
          'test 3',
          'test 4',
          'test 5',
          'test 6',
          'test 7',
        ],
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center',
        offsetX: 0,
        offsetY: 0,
      },
    };
  }

  private chart2() {
    this.barChartOptions = {
      series: [
        {
          name: 'Physics',
          data: [44, 55, 41, 67, 22, 43],
        },
        {
          name: 'Computer',
          data: [13, 23, 20, 8, 13, 27],
        },
        {
          name: 'Management',
          data: [11, 17, 15, 15, 21, 14],
        },
        {
          name: 'Mathes',
          data: [21, 7, 25, 13, 22, 8],
        },
      ],
      chart: {
        type: 'bar',
        height: 345,
        foreColor: '#9aa0ac',
        stacked: true,
        toolbar: {
          show: false,
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: 'bottom',
              offsetX: -10,
              offsetY: 0,
            },
          },
        },
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '20%',
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        type: 'category',
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      },
      legend: {
        show: false,
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      fill: {
        opacity: 1,
        colors: ['#25B9C1', '#4B4BCB', '#EA9022', '#9E9E9E'],
      },
    };
  }

  // Progress table data

  subjects: SubjectProgress[] = [
    { subject: 'Chemistry', progress: 30, duration: '2 Months' },
    { subject: 'Mathematics', progress: 55, duration: '3 Months' },
    { subject: 'Painting', progress: 67, duration: '1 Month' },
    { subject: 'Business Studies', progress: 70, duration: '2 Months' },
    { subject: 'Biology', progress: 24, duration: '3 Months' },
    { subject: 'Computer Studies', progress: 77, duration: '4 Months' },
    { subject: 'Geography', progress: 41, duration: '2 Months' },
  ];

  // schedule

  scheduleList = [
    {
      name: 'Cara Stevens',
      degree: 'Mathematics',
      date: "12 June '20",
      time: '09:00-10:00',
      imageUrl: 'assets/images/user/user1.jpg',
    },
    {
      name: 'Airi Satou',
      degree: 'Computer Studies',
      date: "13 June '20",
      time: '11:00-12:00',
      imageUrl: 'assets/images/user/user2.jpg',
    },
    {
      name: 'Jens Brincker',
      degree: 'Geography',
      date: "15 June '20",
      time: '09:30-10:30',
      imageUrl: 'assets/images/user/user3.jpg',
    },
    {
      name: 'Angelica Ramos',
      degree: 'Chemistry',
      date: "16 June '20",
      time: '14:00-15:00',
      imageUrl: 'assets/images/user/user4.jpg',
    },
    {
      name: 'Cara Stevens',
      degree: 'Painting',
      date: "18 June '20",
      time: '11:00-12:30',
      imageUrl: 'assets/images/user/user5.jpg',
    },
    {
      name: 'Jacob Ryan',
      degree: 'Business Studies',
      date: "22 June '20",
      time: '13:00-14:15',
      imageUrl: 'assets/images/user/user6.jpg',
    },
  ];

  // document list

  documentList = [
    {
      title: 'Java Programming',
      type: '.doc',
      size: 4.3,
      icon: 'far fa-file-word',
      iconClass: 'primary-rgba text-primary',
      textClass: '',
    },
    {
      title: 'Angular Theory',
      type: '.xls',
      size: 2.5,
      icon: 'far fa-file-excel',
      iconClass: 'success-rgba text-success',
      textClass: '',
    },
    {
      title: 'Maths Sums Solution',
      type: '.pdf',
      size: 10.5,
      icon: 'far fa-file-pdf',
      iconClass: 'danger-rgba text-danger',
      textClass: '',
    },
    {
      title: 'Submit Science Journal',
      type: '.zip',
      size: 53.2,
      icon: 'far fa-file-archive',
      iconClass: 'info-rgba text-info',
      textClass: '',
    },
    {
      title: 'Marketing Instructions',
      type: '.doc',
      size: 5.3,
      icon: 'far fa-file-word',
      iconClass: 'primary-rgba text-primary',
      textClass: '',
    },
  ];

  // Library Book data start
  libraryColumnDefinitions: ColumnDefinition[] = [
    { def: 'bookId', label: 'Book ID', type: 'text', visible: true },
    { def: 'bookTitle', label: 'Book Title', type: 'text', visible: true },
    { def: 'author', label: 'Author', type: 'text', visible: true },
    { def: 'issueDate', label: 'Issue Date', type: 'date', visible: true },
    { def: 'status', label: 'Status', type: 'text', visible: true },
    { def: 'returnDate', label: 'Return Date', type: 'date', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  booksData = [
    {
      bookId: 'AI99876',
      bookTitle: 'Computer Programming',
      author: 'John Deo',
      issueDate: '10/03/2019',
      status: 'Issue',
      returnDate: '03/23/2019',
    },
    {
      bookId: 'BT67657',
      bookTitle: 'Design Pattern In Java',
      author: 'Airi Satou',
      issueDate: '04/14/2019',
      status: 'Return',
      returnDate: '04/28/2019',
    },
    {
      bookId: 'RT67013',
      bookTitle: 'The Mathematics Principles',
      author: 'Angelica Ramos',
      issueDate: '04/17/2019',
      status: 'Issue',
      returnDate: '04/24/2019',
    },
    {
      bookId: 'PS2398',
      bookTitle: 'Angular 10 Advance',
      author: 'Jens Brincker',
      issueDate: '04/21/2019',
      status: 'Issue',
      returnDate: '04/29/2019',
    },
    {
      bookId: 'MO4987',
      bookTitle: 'SEO Optimization',
      author: 'Cara Stevens',
      issueDate: '05/11/2019',
      status: 'Return',
      returnDate: '05/18/2019',
    },
    {
      bookId: 'BE2876',
      bookTitle: 'Android Basic Concept',
      author: 'Jacob Ryan',
      issueDate: '05/15/2019',
      status: 'Issue',
      returnDate: '05/21/2019',
    },
    {
      bookId: 'JS46789',
      bookTitle: 'Introduction to Machine Learning',
      author: 'Liam Brown',
      issueDate: '05/20/2019',
      status: 'Issue',
      returnDate: '06/10/2019',
    },
    {
      bookId: 'PH38476',
      bookTitle: 'Physics Fundamentals',
      author: 'Emma White',
      issueDate: '06/01/2019',
      status: 'Return',
      returnDate: '06/15/2019',
    },
    {
      bookId: 'DA56432',
      bookTitle: 'Data Structures and Algorithms',
      author: 'Olivia Green',
      issueDate: '06/05/2019',
      status: 'Issue',
      returnDate: '06/22/2019',
    },
  ];
}
