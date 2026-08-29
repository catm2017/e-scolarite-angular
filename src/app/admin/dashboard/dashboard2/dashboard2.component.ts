import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexResponsive,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTooltip,
  ApexLegend,
  NgApexchartsModule,
  ApexPlotOptions,
  ApexFill,
} from 'ng-apexcharts';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { NgScrollbar } from 'ngx-scrollbar';
import { TableCardComponent } from '@shared/components/table-card/table-card.component';
import { ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { EmpScheduleComponent } from '@shared/components/emp-schedule/emp-schedule.component';
import { TopPerformerComponent } from '@shared/components/top-performer/top-performer.component';
import { StudentAttendanceWidgetComponent } from '@shared/components/student-attendance-widget/student-attendance-widget.component';
import { NoticeboardAnnouncementsComponent } from '@shared/components/noticeboard-announcements/noticeboard-announcements.component';
import { CourseEnrollmentChartComponent } from '@shared/components/course-enrollment-chart/course-enrollment-chart.component';
import { DemographicsPieChartComponent } from '@shared/components/demographics-pie-chart/demographics-pie-chart.component';
import { HostelOccupancyDonutComponent } from '@shared/components/hostel-occupancy-donut/hostel-occupancy-donut.component';
import { DisciplinaryIncidentsTableComponent } from '@shared/components/disciplinary-incidents-table/disciplinary-incidents-table.component';
import { AlumniNetworkCardsComponent } from '@shared/components/alumni-network-cards/alumni-network-cards.component';
export type ChartOptions = {
  series: ApexAxisChartSeries;
  series2: ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  fill: ApexFill;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  labels: string[];
  responsive: ApexResponsive[];
};
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard2',
  templateUrl: './dashboard2.component.html',
  styleUrls: ['./dashboard2.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    NgScrollbar,
    NgApexchartsModule,
    TableCardComponent,
    EmpScheduleComponent,
    TopPerformerComponent,
    NgClass,
    CommonModule,
    StudentAttendanceWidgetComponent,
    NoticeboardAnnouncementsComponent,
    CourseEnrollmentChartComponent,
    DemographicsPieChartComponent,
    HostelOccupancyDonutComponent,
    DisciplinaryIncidentsTableComponent,
    AlumniNetworkCardsComponent,
  ],
})
export class Dashboard2Component implements OnInit {
  public barChartOptions!: Partial<ChartOptions>;
  public staffPerformanceChart!: Partial<ChartOptions>;
  breadscrums = [
    {
      title: 'Dashboad',
      items: [],
      active: 'Dashboard 2',
    },
  ];

  // Budget Overview Data
  budgetOverview = {
    totalBudget: 1500000,
    remainingBudget: 650000,
    usedPercentage: 57,
    allocation: [
      {
        category: 'Staff Salaries',
        amount: 750000,
        percentage: 50,
        colorClass: 'bg-primary',
      },
      {
        category: 'Infrastructure',
        amount: 300000,
        percentage: 20,
        colorClass: 'bg-success',
      },
      {
        category: 'Learning Materials',
        amount: 225000,
        percentage: 15,
        colorClass: 'bg-info',
      },
      {
        category: 'Technology',
        amount: 150000,
        percentage: 10,
        colorClass: 'bg-warning',
      },
      {
        category: 'Miscellaneous',
        amount: 75000,
        percentage: 5,
        colorClass: 'bg-danger',
      },
    ],
  };

  // Library Statistics Data
  libraryStats = {
    totalBooks: 12500,
    borrowedBooks: 3245,
    overdueBooks: 187,
    newBooks: 350,
    popularBooks: [
      {
        title: 'The Mathematics of Life',
        author: 'Ian Stewart',
        borrowCount: 145,
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        borrowCount: 132,
      },
      {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        borrowCount: 128,
      },
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        borrowCount: 120,
      },
    ],
  };

  // Staff Performance Metrics
  staffMetrics = {
    topPerformer: 'Sarah Johnson',
    topScore: 96,
    averageScore: 87,
    trend: '↑ 3% from last month',
    departmentCount: 8,
    staffCount: 65,
  };

  // Transportation Management Data
  transportStats = {
    totalBuses: 25,
    totalRoutes: 18,
    totalStudents: 850,
    totalDrivers: 22,
    busStatus: [
      {
        busNumber: '101',
        route: 'North Route',
        driver: 'John Davis',
        status: 'On Route',
        statusClass: 'badge-solid-green',
      },
      {
        busNumber: '102',
        route: 'South Route',
        driver: 'Michael Clark',
        status: 'At School',
        statusClass: 'badge-solid-blue',
      },
      {
        busNumber: '103',
        route: 'East Route',
        driver: 'Robert Lewis',
        status: 'Maintenance',
        statusClass: 'badge-solid-orange',
      },
      {
        busNumber: '104',
        route: 'West Route',
        driver: 'William Moore',
        status: 'On Route',
        statusClass: 'badge-solid-green',
      },
    ],
  };

  // Upcoming Events Table Data
  upcomingEvents = [
    {
      id: 1,
      eventName: 'Annual Sports Day',
      date: '06-20-2023',
      time: '09:00 AM',
      location: 'School Ground',
      organizer: 'Sports Department',
    },
    {
      id: 2,
      eventName: 'Parent-Teacher Meeting',
      date: '06-25-2023',
      time: '10:00 AM',
      location: 'School Auditorium',
      organizer: 'Administration',
    },
    {
      id: 3,
      eventName: 'Science Exhibition',
      date: '05-07-2023',
      time: '11:00 AM',
      location: 'Science Block',
      organizer: 'Science Department',
    },
    {
      id: 4,
      eventName: 'Math Olympiad',
      date: '10-07-2023',
      time: '09:30 AM',
      location: 'Math Lab',
      organizer: 'Math Department',
    },
    {
      id: 5,
      eventName: 'Annual Day Celebration',
      date: '07-15-2023',
      time: '05:00 PM',
      location: 'School Auditorium',
      organizer: 'Cultural Committee',
    },
  ];

  // Events Column Definitions
  eventsColumnDefinitions: ColumnDefinition[] = [
    { def: 'eventName', label: 'Event Name', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    { def: 'time', label: 'Time', type: 'text', visible: true },
    { def: 'location', label: 'Location', type: 'text', visible: true },
    { def: 'organizer', label: 'Organizer', type: 'text', visible: true },
  ];

  // Recent Admissions Table Data
  recentAdmissions = [
    {
      id: 1,
      admissionId: 'ADM-2023-001',
      studentName: 'Emily Johnson',
      grade: 'Grade 9',
      admissionDate: '01-06-2023',
      parentName: 'Robert Johnson',
      status: 'Confirmed',
    },
    {
      id: 2,
      admissionId: 'ADM-2023-002',
      studentName: 'Michael Smith',
      grade: 'Grade 5',
      admissionDate: '03-06-2023',
      parentName: 'David Smith',
      status: 'Pending',
    },
    {
      id: 3,
      admissionId: 'ADM-2023-003',
      studentName: 'Sophia Williams',
      grade: 'Grade 7',
      admissionDate: '05-06-2023',
      parentName: 'James Williams',
      status: 'Confirmed',
    },
    {
      id: 4,
      admissionId: 'ADM-2023-004',
      studentName: 'Daniel Brown',
      grade: 'Grade 10',
      admissionDate: '08-06-2023',
      parentName: 'Thomas Brown',
      status: 'Confirmed',
    },
    {
      id: 5,
      admissionId: 'ADM-2023-005',
      studentName: 'Olivia Davis',
      grade: 'Grade 3',
      admissionDate: '10-06-2023',
      parentName: 'Richard Davis',
      status: 'Pending',
    },
  ];

  // Admissions Column Definitions
  admissionsColumnDefinitions: ColumnDefinition[] = [
    { def: 'admissionId', label: 'Admission ID', type: 'text', visible: true },
    { def: 'studentName', label: 'Student Name', type: 'text', visible: true },
    { def: 'grade', label: 'Grade', type: 'text', visible: true },
    { def: 'admissionDate', label: 'Date', type: 'date', visible: true },
    { def: 'status', label: 'Status', type: 'text', visible: true },
  ];
  constructor() {
    //constructor
  }

  ngOnInit() {
    this.chart3();
    this.initStaffPerformanceChart();
  }

  private chart3() {
    this.barChartOptions = {
      series: [
        {
          name: 'percent',
          data: [5, 8, 10, 14, 9, 7, 11, 5, 9, 16, 7, 5],
        },
      ],
      chart: {
        height: 320,
        type: 'bar',
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: 'top', // top, center, bottom
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val + '%';
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ['#9aa0ac'],
        },
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
        position: 'bottom',
        labels: {
          offsetY: 0,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          fill: {
            type: 'gradient',
            gradient: {
              colorFrom: '#D8E3F0',
              colorTo: '#BED1E6',
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5,
            },
          },
        },
        tooltip: {
          enabled: true,
          offsetY: -35,
        },
      },
      fill: {
        type: 'gradient',
        colors: ['#4F86F8', '#4F86F8'],
        gradient: {
          shade: 'light',
          type: 'horizontal',
          shadeIntensity: 0.25,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
        },
      },
      yaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: false,
          formatter: function (val) {
            return val + '%';
          },
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

  // Student Fee status start

  feesData = [
    {
      stdId: '4KJGY5',
      name: 'John Deo',
      feeType: 'Exam Fee',
      amount: '$800',
      status: 'Not Paid',
      date: '12-08-2019',
      img: 'assets/images/user/user1.jpg',
    },
    {
      stdId: '5FGT3',
      name: 'Jens Brincker',
      feeType: 'Library Fee',
      amount: '$150',
      status: 'Paid',
      date: '18-09-2019',
      img: 'assets/images/user/user2.jpg',
    },
    {
      stdId: '8JUY4',
      name: 'Mark Hay',
      feeType: 'Tuition Fee',
      amount: '$1200',
      status: 'Not Paid',
      date: '05-08-2019',
      img: 'assets/images/user/user3.jpg',
    },
    {
      stdId: '9FGE2',
      name: 'Anthony Davie',
      feeType: 'Lab Fee',
      amount: '$200',
      status: 'Paid',
      date: '22-07-2019',
      img: 'assets/images/user/user4.jpg',
    },
    {
      stdId: '2MNY6',
      name: 'Alan Gilchrist',
      feeType: 'Sports Fee',
      amount: '$100',
      status: 'Not Paid',
      date: '20-09-2019',
      img: 'assets/images/user/user5.jpg',
    },
    {
      stdId: '6DKE4',
      name: 'Sue Woodger',
      feeType: 'Hostel Fee',
      amount: '$500',
      status: 'Paid',
      date: '17-10-2019',
      img: 'assets/images/user/user6.jpg',
    },
    {
      stdId: '5DHZ2',
      name: 'David Perry',
      feeType: 'Activity Fee',
      amount: '$250',
      status: 'Not Paid',
      date: '04-11-2019',
      img: 'assets/images/user/user7.jpg',
    },
    {
      stdId: '7KOD5',
      name: 'Sneha Pandit',
      feeType: 'Miscellaneous Fee',
      amount: '$300',
      status: 'Paid',
      date: '11-01-2019',
      img: 'assets/images/user/user8.jpg',
    },
  ];

  feesColumnDefinitions: ColumnDefinition[] = [
    { def: 'stdId', label: 'Std ID', type: 'text', visible: true },
    { def: 'name', label: 'Student Name', type: 'text', visible: true },
    { def: 'feeType', label: 'Fee Type', type: 'text', visible: true },
    { def: 'amount', label: 'Amount', type: 'text', visible: true },
    { def: 'status', label: 'Status', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  // Student Fee status end

  // Upcomming Class list start

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

  // Upcomming Class list end

  // Professors data start

  professorsData = [
    {
      id: 1,
      name: 'Jens Brincker',
      department: 'Computer',
      gender: 'Male',
      degree: 'M.Sc., PHD.',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '02/25/2018',
      img: 'assets/images/user/user1.jpg',
    },
    {
      id: 2,
      name: 'Mark Hay',
      department: 'Mechanical',
      gender: 'Female',
      degree: 'M.Sc.',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '02/21/2018',
      img: 'assets/images/user/user2.jpg',
    },
    {
      id: 3,
      name: 'Airi Satou',
      department: 'Mathematics',
      gender: 'Female',
      degree: 'M.Sc., P.H.D.',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '03/11/2018',
      img: 'assets/images/user/user2.jpg',
    },
    {
      id: 4,
      name: 'Ashton Cox',
      department: 'Music',
      gender: 'Male',
      degree: 'B.A.',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '05/21/2018',
      img: 'assets/images/user/user4.jpg',
    },
    {
      id: 5,
      name: 'Cara Stevens',
      department: 'Civil',
      gender: 'Female',
      degree: 'B.E., M.E.',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '04/03/2018',
      img: 'assets/images/user/user5.jpg',
    },
    {
      id: 6,
      name: 'Angelica Ramos',
      department: 'Sport',
      gender: 'Male',
      degree: 'CP.Ed.',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '04/23/2018',
      img: 'assets/images/user/user6.jpg',
    },
    {
      id: 7,
      name: 'Sarah Smith',
      department: 'Administrator',
      gender: 'Female',
      degree: 'M.E., P.H.D.',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '07/12/2018',
      img: 'assets/images/user/user7.jpg',
    },
    {
      id: 8,
      name: 'John Doe',
      department: 'Agriculture',
      gender: 'Female',
      degree: 'B.E. Agree',
      email: 'prof@example.com',
      mobile: '1234567890',
      joiningDate: '04/12/2018',
      img: 'assets/images/user/user8.jpg',
    },
  ];

  professorsColumnDefinitions: ColumnDefinition[] = [
    { def: 'name', label: 'Name', type: 'text', visible: true },
    { def: 'department', label: 'Department', type: 'text', visible: true },
    { def: 'gender', label: 'Gender', type: 'text', visible: true },
    { def: 'degree', label: 'Degree', type: 'text', visible: true },
    { def: 'email', label: 'Email', type: 'email', visible: true },
    { def: 'mobile', label: 'Mobile', type: 'phone', visible: true },
    { def: 'joiningDate', label: 'Joining Date', type: 'date', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  // Professors data end

  // Student Performance Chart

  private initStaffPerformanceChart(): void {
    this.staffPerformanceChart = {
      series2: [76, 67, 61, 90, 82],
      chart: {
        height: 340,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: 0,
          endAngle: 270,
          hollow: {
            margin: 5,
            size: '30%',
            background: 'transparent',
            image: undefined,
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: false,
            },
          },
        },
      },
      colors: ['#5fcddeff', '#fba44dff', '#7facfaff', '#e25a66ff', '#3ebe77ff'],
      labels: ['English', 'Mathematics', 'Science', 'Arts', 'Sports'],
      legend: {
        show: true,
        floating: true,
        fontSize: '12px',
        position: 'left',
        offsetX: 10,
        offsetY: 10,
        labels: {
          useSeriesColors: true,
        },
        formatter: function (seriesName: string, opts: any) {
          return (
            seriesName + ':  ' + opts.w.globals.series[opts.seriesIndex] + '%'
          );
        },
        itemMargin: {
          horizontal: 3,
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              show: false,
            },
          },
        },
      ],
    };
  }
}
