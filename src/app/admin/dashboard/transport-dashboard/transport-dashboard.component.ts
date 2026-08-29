import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TransportOverviewComponent } from '@shared/components/transport-overview/transport-overview.component';
import { NgApexchartsModule } from 'ng-apexcharts';

import { NgScrollbar } from 'ngx-scrollbar';
import { ChartComponent } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexYAxis,
  ApexPlotOptions,
  ApexStroke,
  ApexLegend,
  ApexFill,
  ApexNonAxisChartSeries,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  markers: any;
  grid: any;
  fill: ApexFill;
  plotOptions: ApexPlotOptions;
};

export type RadialBarChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
};

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transport-dashboard',
  imports: [
    CommonModule,
    BreadcrumbComponent,
    TransportOverviewComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    NgApexchartsModule,
    NgScrollbar
],
  templateUrl: './transport-dashboard.component.html',
  styleUrl: './transport-dashboard.component.scss',
})
export class TransportDashboardComponent implements OnInit {
  breadscrums = [
    {
      title: 'Transport Dashboad',
      items: [],
      active: 'Transport Dashboard',
    },
  ];

  // Chart options
  routeDistributionChartOptions: any;
  onTimePerformanceChartOptions: any;
  weeklyUsageChartOptions: any;
  routeCompletionChartOptions: any;

  // New Chart Options
  public fuelConsumptionChartOptions!: Partial<ChartOptions>;
  public fleetUtilizationChartOptions!: Partial<RadialBarChartOptions>;
  public operatingCostsChartOptions!: Partial<PieChartOptions>;
  public vehicleAgeChartOptions!: Partial<PieChartOptions>;
  public studentBoardingChartOptions!: Partial<ChartOptions>;

  // Vehicle status data
  vehicles = [
    {
      id: 'BUS-001',
      name: 'School Bus 1',
      status: 'active',
      driver: 'John Smith',
      location: 'North Route',
      lastUpdate: '2 mins ago',
      fuelLevel: 85,
    },
    {
      id: 'BUS-002',
      name: 'School Bus 2',
      status: 'maintenance',
      driver: 'Sarah Johnson',
      location: 'Garage',
      lastUpdate: '1 hour ago',
      fuelLevel: 45,
    },
    {
      id: 'VAN-001',
      name: 'Transport Van 1',
      status: 'active',
      driver: 'Mike Davis',
      location: 'East Route',
      lastUpdate: '5 mins ago',
      fuelLevel: 72,
    },
    {
      id: 'VAN-002',
      name: 'Transport Van 2',
      status: 'inactive',
      driver: 'Emily Wilson',
      location: 'School Parking',
      lastUpdate: '30 mins ago',
      fuelLevel: 65,
    },
  ];

  // Student transport data
  studentTransport = [
    {
      route: 'North Route',
      totalStudents: 42,
      presentToday: 38,
      absent: 4,
      specialNeeds: 3,
    },
    {
      route: 'South Route',
      totalStudents: 55,
      presentToday: 51,
      absent: 4,
      specialNeeds: 5,
    },
    {
      route: 'East Route',
      totalStudents: 38,
      presentToday: 35,
      absent: 3,
      specialNeeds: 2,
    },
    {
      route: 'West Route',
      totalStudents: 64,
      presentToday: 60,
      absent: 4,
      specialNeeds: 6,
    },
    {
      route: 'Central Route',
      totalStudents: 22,
      presentToday: 20,
      absent: 2,
      specialNeeds: 1,
    },
  ];

  // New Lists and Tables Data
  maintenanceSchedule: any[] = [];
  recentAlerts: any[] = [];
  topDrivers: any[] = [];
  driverRoster: any[] = [];
  routeEfficiency: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.initRouteDistributionChart();
    this.initOnTimePerformanceChart();
    this.initWeeklyUsageChart();
    this.initRouteCompletionChart();
    
    // Init new charts
    this.initFuelConsumptionChart();
    this.initFleetUtilizationChart();
    this.initOperatingCostsChart();
    this.initVehicleAgeChart();
    this.initStudentBoardingChart();

    this.loadNewData();
  }

  loadNewData(): void {
    this.maintenanceSchedule = [
      { vehicle: 'BUS-001', date: '2023-06-20', type: 'Oil Change', status: 'Scheduled' },
      { vehicle: 'VAN-002', date: '2023-06-22', type: 'Tire Rotation', status: 'Pending' },
      { vehicle: 'BUS-005', date: '2023-06-25', type: 'Brake Inspection', status: 'Scheduled' },
      { vehicle: 'BUS-003', date: '2023-06-28', type: 'Full Service', status: 'Pending' },
      { vehicle: 'VAN-004', date: '2023-07-02', type: 'AC Repair', status: 'Scheduled' },
      { vehicle: 'BUS-008', date: '2023-07-05', type: 'Engine Check', status: 'Pending' }
    ];

    this.recentAlerts = [
      { title: 'Traffic Delay on Route 4', time: '10 mins ago', type: 'Warning', icon: 'warning' },
      { title: 'BUS-002 Reached Garage', time: '1 hr ago', type: 'Info', icon: 'info' },
      { title: 'Minor Deviation on East Route', time: '2 hrs ago', type: 'Alert', icon: 'directions_bus' },
      { title: 'Road Closure near Main St', time: '3 hrs ago', type: 'Warning', icon: 'warning' },
      { title: 'VAN-001 Completed Route', time: '4 hrs ago', type: 'Success', icon: 'check_circle' },
      { title: 'Student reported lost item', time: '5 hrs ago', type: 'Info', icon: 'info' }
    ];

    this.topDrivers = [
      { name: 'John Smith', rating: 4.9, avatar: 'assets/images/user/user1.jpg', onTime: 98 },
      { name: 'Sarah Johnson', rating: 4.8, avatar: 'assets/images/user/user2.jpg', onTime: 97 },
      { name: 'Mike Davis', rating: 4.7, avatar: 'assets/images/user/user3.jpg', onTime: 95 },
      { name: 'Emily Wilson', rating: 4.9, avatar: 'assets/images/user/user4.jpg', onTime: 99 },
      { name: 'Robert Taylor', rating: 4.6, avatar: 'assets/images/user/user5.jpg', onTime: 94 },
      { name: 'Lisa Anderson', rating: 4.8, avatar: 'assets/images/user/user6.jpg', onTime: 96 }
    ];

    this.driverRoster = [
      { name: 'John Smith', route: 'North Route', shift: 'Morning', phone: '555-0101', status: 'On Duty' },
      { name: 'Sarah Johnson', route: 'South Route', shift: 'Afternoon', phone: '555-0102', status: 'Off Duty' },
      { name: 'Mike Davis', route: 'East Route', shift: 'Morning', phone: '555-0103', status: 'On Duty' },
      { name: 'Emily Wilson', route: 'West Route', shift: 'Evening', phone: '555-0104', status: 'On Leave' },
      { name: 'Robert Taylor', route: 'Central Route', shift: 'Morning', phone: '555-0105', status: 'On Duty' },
      { name: 'Lisa Anderson', route: 'North Route', shift: 'Afternoon', phone: '555-0106', status: 'Off Duty' },
      { name: 'David Lee', route: 'East Route', shift: 'Evening', phone: '555-0107', status: 'On Duty' },
      { name: 'Emma White', route: 'South Route', shift: 'Morning', phone: '555-0108', status: 'On Duty' },
      { name: 'James Brown', route: 'West Route', shift: 'Afternoon', phone: '555-0109', status: 'Off Duty' },
      { name: 'Olivia Martin', route: 'Central Route', shift: 'Evening', phone: '555-0110', status: 'On Duty' },
      { name: 'William Garcia', route: 'North Route', shift: 'Morning', phone: '555-0111', status: 'On Leave' }
    ];

    this.routeEfficiency = [
      { route: 'North Route', duration: '45 mins', fuel: '12 L', avgSpeed: '35 km/h', score: '95%' },
      { route: 'South Route', duration: '55 mins', fuel: '15 L', avgSpeed: '30 km/h', score: '88%' },
      { route: 'East Route', duration: '40 mins', fuel: '10 L', avgSpeed: '40 km/h', score: '92%' },
      { route: 'West Route', duration: '60 mins', fuel: '18 L', avgSpeed: '28 km/h', score: '85%' },
      { route: 'Central Route', duration: '30 mins', fuel: '8 L', avgSpeed: '25 km/h', score: '90%' },
      { route: 'Northeast Express', duration: '35 mins', fuel: '9 L', avgSpeed: '38 km/h', score: '96%' },
      { route: 'Southwest Loop', duration: '65 mins', fuel: '20 L', avgSpeed: '26 km/h', score: '82%' },
      { route: 'Downtown Shuttle', duration: '25 mins', fuel: '6 L', avgSpeed: '20 km/h', score: '89%' },
      { route: 'Suburban Line', duration: '75 mins', fuel: '22 L', avgSpeed: '32 km/h', score: '87%' },
      { route: 'Campus Circular', duration: '20 mins', fuel: '5 L', avgSpeed: '18 km/h', score: '94%' }
    ];
  }

  initRouteDistributionChart(): void {
    this.routeDistributionChartOptions = {
      series: [
        {
          name: 'Students',
          data: [44, 55, 41, 64, 22],
        },
      ],
      chart: {
        type: 'bar',
        height: 250,
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: ['north', 'south', 'east', 'west', 'central'],
        labels: {
          style: {
            fontSize: '10px',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Students',
        },
        labels: {
          formatter: function (val: number) {
            return val.toFixed(0);
          },
        },
      },
      fill: {
        opacity: 1,
        colors: ['#2196F3'],
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + ' students';
          },
        },
      },
    };
  }

  initOnTimePerformanceChart(): void {
    this.onTimePerformanceChartOptions = {
      series: [92, 5, 3],
      chart: {
        type: 'donut',
        height: 250,
        foreColor: '#9aa0ac',
      },
      labels: ['On Time', 'Delayed', 'Missed'],
      colors: ['#4CAF50', '#FFC107', '#F44336'],
      legend: {
        position: 'bottom',
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          },
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
              },
              value: {
                show: true,
                formatter: function (val: number) {
                  return val.toFixed(1) + '%';
                },
              },
              total: {
                show: true,
                label: 'On Time',
                formatter: function () {
                  return '92.0%';
                },
              },
            },
          },
        },
      },
    };
  }

  initRouteCompletionChart(): void {
    this.routeCompletionChartOptions = {
      series: [
        {
          name: 'Completion Rate',
          data: [95, 88, 92, 85, 90],
        },
      ],
      chart: {
        height: 250,
        type: 'line',
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      colors: ['#6777ef'],
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(0) + '%';
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      xaxis: {
        categories: ['North', 'South', 'East', 'West', 'Central'],
      },
      yaxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Completion Rate (%)',
        },
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          },
        },
      },
    };
  }

  initWeeklyUsageChart(): void {
    this.weeklyUsageChartOptions = {
      series: [
        {
          name: 'Morning',
          data: [310, 315, 305, 312, 308, 120, 0],
        },
        {
          name: 'Afternoon',
          data: [290, 295, 285, 292, 288, 110, 0],
        },
      ],
      chart: {
        type: 'area',
        height: 250,
        toolbar: {
          show: false,
        },
        stacked: false,
        foreColor: '#9aa0ac',
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      yaxis: {
        title: {
          text: 'Students',
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
        },
      },
      colors: ['#2196F3', '#FF9800'],
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + ' students';
          },
        },
      },
    };
  }

  // New Charts Initialization
  initFuelConsumptionChart(): void {
    this.fuelConsumptionChartOptions = {
      series: [
        { name: 'This Week', data: [45, 52, 38, 65, 48, 20] },
        { name: 'Last Week', data: [40, 48, 42, 58, 45, 15] }
      ],
      chart: { height: 320, type: 'area', toolbar: { show: false }, foreColor: '#9aa0ac' },
      colors: ['#F44336', '#9C27B0'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { type: 'category', categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      legend: { position: 'top' },
      grid: { show: true, borderColor: '#9aa0ac', strokeDashArray: 1 }
    };
  }

  initFleetUtilizationChart(): void {
    this.fleetUtilizationChartOptions = {
      series: [78],
      chart: { type: 'radialBar', height: 320 },
      plotOptions: {
        radialBar: {
          hollow: { size: '60%' },
          dataLabels: {
            name: { show: true, color: '#9aa0ac' },
            value: { show: true, formatter: (val) => val + '%', fontSize: '24px', fontWeight: 'bold' }
          }
        }
      },
      labels: ['Fleet Active'],
      colors: ['#4CAF50']
    };
  }

  initOperatingCostsChart(): void {
    this.operatingCostsChartOptions = {
      series: [45, 30, 15, 10],
      chart: { type: 'donut', height: 320 },
      labels: ['Fuel', 'Salaries', 'Maintenance', 'Insurance'],
      colors: ['#FF9800', '#2196F3', '#E91E63', '#9C27B0'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false }
    };
  }

  initVehicleAgeChart(): void {
    this.vehicleAgeChartOptions = {
      series: [15, 35, 40, 10],
      chart: { type: 'pie', height: 320 },
      labels: ['0-2 Years', '3-5 Years', '6-8 Years', '8+ Years'],
      colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false }
    };
  }

  initStudentBoardingChart(): void {
    this.studentBoardingChartOptions = {
      series: [{ name: 'Boarding Students', data: [120, 95, 85, 70, 50] }],
      chart: { type: 'bar', height: 320, toolbar: { show: false }, foreColor: '#9aa0ac' },
      plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '45%' } },
      dataLabels: { enabled: false },
      colors: ['#00BCD4'],
      xaxis: { categories: ['Main St', 'Oak Ave', 'Pine Lane', 'Maple Blvd', 'Cedar Rd'] }
    };
  }
}
