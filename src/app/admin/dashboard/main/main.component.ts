import { Component, OnInit, ChangeDetectionStrategy, viewChild } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexYAxis,
  ApexPlotOptions,
  ApexStroke,
  ApexLegend,
  ApexMarkers,
  ApexGrid,
  ApexTitleSubtitle,
  ApexFill,
  ApexResponsive,
  ApexTheme,
  ApexNonAxisChartSeries,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { NgScrollbar } from 'ngx-scrollbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { StatisticCard2Component } from '@shared/components/statistic-card2/statistic-card2.component';
import { MatCardModule } from '@angular/material/card';
import { AttendanceChartComponent } from '@shared/components/attendance-chart/attendance-chart.component';
import { ChartCard4Component } from '@shared/components/chart-card4/chart-card4.component';
import { EventCardComponent } from '@shared/components/event-card/event-card.component';
import { ScheduleCardComponent } from '@shared/components/schedule-card/schedule-card.component';
import { TableCardComponent } from '@shared/components/table-card/table-card.component';
import { EmpStatusComponent } from '@shared/components/emp-status/emp-status.component';
import { ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { ChartCard1Component } from '@shared/components/chart-card1/chart-card1.component';
import { FeePaymentOverviewComponent } from '@shared/components/fee-payment-overview/fee-payment-overview.component';
import { TeacherActivityTrackerComponent } from '@shared/components/teacher-activity-tracker/teacher-activity-tracker.component';
import { AppointmentCardComponent } from '@shared/components/appointment-card/appointment-card.component';
import { AcademicPerformanceComponent } from '@shared/components/academic-performance/academic-performance.component';
import { FeeCollectionSummaryComponent } from '@shared/components/fee-collection-summary/fee-collection-summary.component';
import { SchoolTransportComponent } from '@shared/components/school-transport/school-transport.component';
import { HostelMessComponent } from '@shared/components/hostel-mess/hostel-mess.component';
import { LibraryCirculationComponent } from '@shared/components/library-circulation/library-circulation.component';
import { UpcomingPtaMeetingsComponent } from '@shared/components/upcoming-pta-meetings/upcoming-pta-meetings.component';

export type chartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  legend: ApexLegend;
  markers: ApexMarkers;
  grid: ApexGrid;
  title: ApexTitleSubtitle;
  colors: string[];
  responsive: ApexResponsive[];
  labels: string[];
  theme: ApexTheme;
  series2: ApexNonAxisChartSeries;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatButtonModule,
    MatMenuModule,
    MatCardModule,
    MatIconModule,
    NgApexchartsModule,
    NgScrollbar,
    StatisticCard2Component,
    AttendanceChartComponent,
    ChartCard4Component,
    EventCardComponent,
    ScheduleCardComponent,
    TableCardComponent,
    EmpStatusComponent,
    ChartCard1Component,
    FeePaymentOverviewComponent,
    TeacherActivityTrackerComponent,
    AppointmentCardComponent,
    AcademicPerformanceComponent,
    FeeCollectionSummaryComponent,
    SchoolTransportComponent,
    HostelMessComponent,
    LibraryCirculationComponent,
    UpcomingPtaMeetingsComponent,
  ],
})
export class MainComponent implements OnInit {
  readonly chart = viewChild.required<ChartComponent>('chart');
  public performanceRateChartOptions!: Partial<chartOptions>;

  title2 = 'Admission chart';
  subtitle2 = 'New admission in the last 5 years in the school';

  breadscrums = [
    {
      title: 'Dashboad',
      items: [],
      active: 'Dashboard 1',
    },
  ];
  constructor() {
    //constructor
  }

  ngOnInit() {
    this.chart3();
  }

  // Events
  events = [
    {
      day: 'Tuesday',
      date: 4,
      month: 'Jan',
      title: 'Science Fair',
      timeStart: '11:00 AM',
      timeEnd: '12:30 PM',
      status: 'Today',
    },
    {
      day: 'Friday',
      date: 12,
      month: 'Jan',
      title: 'Guest Speaker',
      timeStart: '11:00 AM',
      timeEnd: '12:30 PM',
      status: 'In 8 days',
    },
    {
      day: 'Sunday',
      date: 18,
      month: 'Jan',
      title: 'Art Exhibition Opening',
      timeStart: '01:00 PM',
      timeEnd: '02:30 PM',
      status: 'In 11 days',
    },
  ];

  private chart3() {
    this.performanceRateChartOptions = {
      series: [
        {
          name: 'Students',
          data: [113, 120, 130, 120, 125, 119],
        },
      ],
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
        foreColor: '#9aa0ac',
        toolbar: {
          show: false,
        },
      },
      colors: ['#51E298'],
      dataLabels: {
        enabled: true,
      },
      stroke: {
        curve: 'smooth',
      },
      markers: {
        size: 1,
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        title: {
          text: 'Weekday',
        },
      },
      yaxis: {
        title: {
          text: 'Students',
        },
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

  examList = [
    {
      title: 'Standard 1',
      dateRange: '23-03-2022 | 28-03-2022',
      statusClass: 'colorStyle1',
    },
    {
      title: 'Standard 2',
      dateRange: '10-03-2022 | 15-03-2022',
      statusClass: 'colorStyle2',
    },
    {
      title: 'Standard 3',
      dateRange: '03-04-2022 | 10-04-2022',
      statusClass: 'colorStyle3',
    },
    {
      title: 'Standard 4',
      dateRange: '11-05-2022 | 15-05-2022',
      statusClass: 'colorStyle4',
    },
    {
      title: 'Standard 5',
      dateRange: '17-05-2022 | 21-05-2022',
      statusClass: 'colorStyle1',
    },
    {
      title: 'Standard 6',
      dateRange: '23-05-2022 | 28-05-2022',
      statusClass: 'colorStyle2',
    },
    {
      title: 'Standard 7',
      dateRange: '11-06-2022 | 15-06-2022',
      statusClass: 'colorStyle3',
    },
  ];

  // Sport Achievements start
  sportData = [
    {
      id: 1,
      name: 'John Doe',
      assignedCoach: 'Jacob Ryan',
      email: 'test@gmail.com',
      date: '12/05/2016',
      sportName: 'Cricket',
      img: 'assets/images/user/user1.jpg',
    },
    {
      id: 2,
      name: 'Sarah Smith',
      assignedCoach: 'Rajesh',
      email: 'test@gmail.com',
      date: '12/05/2016',
      sportName: 'Boxing',
      img: 'assets/images/user/user2.jpg',
    },
    {
      id: 3,
      name: 'Airi Satou',
      assignedCoach: 'Jay Soni',
      email: 'test@gmail.com',
      date: '12/05/2016',
      sportName: 'Tennis',
      img: 'assets/images/user/user3.jpg',
    },
    {
      id: 4,
      name: 'Angelica Ramos',
      assignedCoach: 'John Deo',
      email: 'test@gmail.com',
      date: '12/05/2016',
      sportName: 'Hockey',
      img: 'assets/images/user/user4.jpg',
    },
    {
      id: 5,
      name: 'Ashton Cox',
      assignedCoach: 'Megha Trivedi',
      email: 'test@gmail.com',
      date: '12/05/2016',
      sportName: 'Yoga',
      img: 'assets/images/user/user5.jpg',
    },
    {
      id: 6,
      name: 'Cara Stevens',
      assignedCoach: 'Sarah Smith',
      email: 'test@gmail.com',
      date: '12/05/2016',
      sportName: 'Gymnastics',
      img: 'assets/images/user/user8.jpg',
    },
    // Add more items as needed
  ];

  sportColumnDefinitions: ColumnDefinition[] = [
    { def: 'name', label: 'Patient Name', type: 'text', visible: true },
    {
      def: 'assignedCoach',
      label: 'Assigned Coach',
      type: 'text',
      visible: true,
    },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    { def: 'sportName', label: 'Sport Name', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  // Sport Achievements end

  // New Student List start

  studentData = [
    {
      id: 1,
      name: 'John Deo',
      phone: '(123)123456',
      address: '9946 Baker Rd. Marysville',
      branch: 'Mechanical',
      dateOfAdmission: '12-08-2019',
      img: 'assets/images/user/user8.jpg',
      feesReceipt: 'download link',
    },
    {
      id: 2,
      name: 'Jens Brincker',
      phone: '(123)123456',
      address: '193 S. Harrison Drive',
      branch: 'Science',
      dateOfAdmission: '10-08-2019',
      img: 'assets/images/user/user2.jpg',
      feesReceipt: 'download link',
    },
    {
      id: 3,
      name: 'Mark Hay',
      phone: '(123)123456',
      address: '8949 Golf St. Palm Coast',
      branch: 'Commerce',
      dateOfAdmission: '05-08-2019',
      img: 'assets/images/user/user3.jpg',
      feesReceipt: 'download link',
    },
    {
      id: 4,
      name: 'Anthony Davie',
      phone: '(123)123456',
      address: '23 Ohio Court Alexandria',
      branch: 'M.B.A.',
      dateOfAdmission: '05-11-2019',
      img: 'assets/images/user/user4.jpg',
      feesReceipt: 'download link',
    },
    {
      id: 5,
      name: 'Alan Gilchrist',
      phone: '(123)123456',
      address: '338 North Cleveland Rd',
      branch: 'Civil',
      dateOfAdmission: '07-09-2019',
      img: 'assets/images/user/user6.jpg',
      feesReceipt: 'download link',
    },
    {
      id: 6,
      name: 'Sue Woodger',
      phone: '(123)123456',
      address: '753 Forest Lane',
      branch: 'M.C.A.',
      dateOfAdmission: '12-10-2019',
      img: 'assets/images/user/user7.jpg',
      feesReceipt: 'download link',
    },
    {
      id: 7,
      name: 'David Perry',
      phone: '(123)123456',
      address: '7909 W. Sunnyslope St.',
      branch: 'Computer',
      dateOfAdmission: '04-11-2019',
      img: 'assets/images/user/user8.jpg',
      feesReceipt: 'download link',
    },
    {
      id: 8,
      name: 'Sneha Pandit',
      phone: '(123)123456',
      address: '7361 Dunbar Street',
      branch: 'Mechanical',
      dateOfAdmission: '11-01-2019',
      img: 'assets/images/user/user9.jpg',
      feesReceipt: 'download link',
    },
  ];

  studentColumnDefinitions: ColumnDefinition[] = [
    { def: 'name', label: 'Student Name', type: 'text', visible: true },
    { def: 'phone', label: 'Phone', type: 'phone', visible: true },
    { def: 'address', label: 'Address', type: 'address', visible: true },
    { def: 'branch', label: 'Branch', type: 'text', visible: true },
    {
      def: 'dateOfAdmission',
      label: 'Date Of Admission',
      type: 'date',
      visible: true,
    },
    { def: 'feesReceipt', label: 'Fees Receipt', type: 'file', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  // New Student List start
}
