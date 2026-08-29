import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgScrollbar } from 'ngx-scrollbar';

export interface BusRoute {
  id: number;
  name: string;
  busNumber: string;
  driverName: string;
  driverContact: string;
  totalStudents: number;
  totalStops: number;
  startTime: string;
  endTime: string;
  distance: number;
  status: 'active' | 'inactive' | 'delayed';
  lastUpdated: Date;
}

export interface RouteStop {
  id: number;
  routeId: number;
  name: string;
  arrivalTime: string;
  departureTime: string;
  studentsCount: number;
  coordinates: { lat: number; lng: number };
}

export interface TransportStats {
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  totalStudents: number;
  totalDrivers: number;
  averageRouteDistance: number;
  onTimePerformance: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transport-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    NgApexchartsModule,
    NgScrollbar,
  ],
  templateUrl: './transport-overview.component.html',
  styleUrls: ['./transport-overview.component.scss'],
})
export class TransportOverviewComponent implements OnInit {
  selectedRoute: BusRoute | null = null;
  activeTab = 0;

  // Transport statistics
  transportStats: TransportStats = {
    totalBuses: 12,
    activeBuses: 10,
    totalRoutes: 8,
    totalStudents: 320,
    totalDrivers: 12,
    averageRouteDistance: 8.5,
    onTimePerformance: 92,
  };

  // Bus routes data
  busRoutes: BusRoute[] = [
    {
      id: 1,
      name: 'North Campus Route',
      busNumber: 'BUS-001',
      driverName: 'John Smith',
      driverContact: '(555) 123-4567',
      totalStudents: 42,
      totalStops: 8,
      startTime: '7:30 AM',
      endTime: '8:15 AM',
      distance: 7.2,
      status: 'active',
      lastUpdated: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    },
    {
      id: 2,
      name: 'South Campus Route',
      busNumber: 'BUS-002',
      driverName: 'Michael Johnson',
      driverContact: '(555) 234-5678',
      totalStudents: 38,
      totalStops: 7,
      startTime: '7:35 AM',
      endTime: '8:20 AM',
      distance: 6.8,
      status: 'active',
      lastUpdated: new Date(Date.now() - 8 * 60000), // 8 minutes ago
    },
    {
      id: 3,
      name: 'East Campus Route',
      busNumber: 'BUS-003',
      driverName: 'Robert Williams',
      driverContact: '(555) 345-6789',
      totalStudents: 45,
      totalStops: 9,
      startTime: '7:25 AM',
      endTime: '8:15 AM',
      distance: 8.5,
      status: 'delayed',
      lastUpdated: new Date(Date.now() - 3 * 60000), // 3 minutes ago
    },
    {
      id: 4,
      name: 'West Campus Route',
      busNumber: 'BUS-004',
      driverName: 'David Brown',
      driverContact: '(555) 456-7890',
      totalStudents: 40,
      totalStops: 8,
      startTime: '7:30 AM',
      endTime: '8:20 AM',
      distance: 7.8,
      status: 'active',
      lastUpdated: new Date(Date.now() - 10 * 60000), // 10 minutes ago
    },
    {
      id: 5,
      name: 'Central Route',
      busNumber: 'BUS-005',
      driverName: 'James Davis',
      driverContact: '(555) 567-8901',
      totalStudents: 36,
      totalStops: 6,
      startTime: '7:40 AM',
      endTime: '8:20 AM',
      distance: 5.5,
      status: 'active',
      lastUpdated: new Date(Date.now() - 7 * 60000), // 7 minutes ago
    },
    {
      id: 6,
      name: 'Suburban Route',
      busNumber: 'BUS-006',
      driverName: 'Thomas Miller',
      driverContact: '(555) 678-9012',
      totalStudents: 48,
      totalStops: 10,
      startTime: '7:15 AM',
      endTime: '8:10 AM',
      distance: 12.3,
      status: 'active',
      lastUpdated: new Date(Date.now() - 12 * 60000), // 12 minutes ago
    },
    {
      id: 7,
      name: 'Downtown Route',
      busNumber: 'BUS-007',
      driverName: 'Charles Wilson',
      driverContact: '(555) 789-0123',
      totalStudents: 32,
      totalStops: 6,
      startTime: '7:45 AM',
      endTime: '8:25 AM',
      distance: 6.2,
      status: 'inactive',
      lastUpdated: new Date(Date.now() - 60 * 60000), // 60 minutes ago
    },
    {
      id: 8,
      name: 'Express Route',
      busNumber: 'BUS-008',
      driverName: 'Daniel Taylor',
      driverContact: '(555) 890-1234',
      totalStudents: 39,
      totalStops: 5,
      startTime: '7:50 AM',
      endTime: '8:25 AM',
      distance: 9.7,
      status: 'active',
      lastUpdated: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    },
  ];

  // Route stops data
  routeStops: RouteStop[] = [
    {
      id: 1,
      routeId: 1,
      name: 'Main Street & 5th Avenue',
      arrivalTime: '7:30 AM',
      departureTime: '7:32 AM',
      studentsCount: 6,
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    {
      id: 2,
      routeId: 1,
      name: 'Oak Road & Pine Street',
      arrivalTime: '7:35 AM',
      departureTime: '7:37 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7129, lng: -74.0065 },
    },
    {
      id: 3,
      routeId: 1,
      name: 'Maple Avenue & Cedar Lane',
      arrivalTime: '7:42 AM',
      departureTime: '7:44 AM',
      studentsCount: 7,
      coordinates: { lat: 40.713, lng: -74.007 },
    },
    {
      id: 4,
      routeId: 1,
      name: 'Elm Street & Birch Road',
      arrivalTime: '7:48 AM',
      departureTime: '7:50 AM',
      studentsCount: 4,
      coordinates: { lat: 40.7131, lng: -74.0075 },
    },
    {
      id: 5,
      routeId: 1,
      name: 'Willow Lane & Spruce Avenue',
      arrivalTime: '7:55 AM',
      departureTime: '7:57 AM',
      studentsCount: 8,
      coordinates: { lat: 40.7132, lng: -74.008 },
    },
    {
      id: 6,
      routeId: 1,
      name: 'Aspen Court & Redwood Drive',
      arrivalTime: '8:02 AM',
      departureTime: '8:04 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7133, lng: -74.0085 },
    },
    {
      id: 7,
      routeId: 1,
      name: 'Sycamore Street & Poplar Road',
      arrivalTime: '8:08 AM',
      departureTime: '8:10 AM',
      studentsCount: 4,
      coordinates: { lat: 40.7134, lng: -74.009 },
    },
    {
      id: 8,
      routeId: 1,
      name: 'School Campus',
      arrivalTime: '8:15 AM',
      departureTime: '8:15 AM',
      studentsCount: 3,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },

    {
      id: 9,
      routeId: 2,
      name: 'Park Avenue & Lake Street',
      arrivalTime: '7:35 AM',
      departureTime: '7:37 AM',
      studentsCount: 5,
      coordinates: { lat: 40.714, lng: -74.01 },
    },
    {
      id: 10,
      routeId: 2,
      name: 'River Road & Mountain View',
      arrivalTime: '7:42 AM',
      departureTime: '7:44 AM',
      studentsCount: 6,
      coordinates: { lat: 40.7145, lng: -74.0105 },
    },
    {
      id: 11,
      routeId: 2,
      name: 'Valley Lane & Hill Drive',
      arrivalTime: '7:49 AM',
      departureTime: '7:51 AM',
      studentsCount: 7,
      coordinates: { lat: 40.715, lng: -74.011 },
    },
    {
      id: 12,
      routeId: 2,
      name: 'Forest Avenue & Meadow Road',
      arrivalTime: '7:56 AM',
      departureTime: '7:58 AM',
      studentsCount: 4,
      coordinates: { lat: 40.7155, lng: -74.0115 },
    },
    {
      id: 13,
      routeId: 2,
      name: 'Garden Street & Orchard Lane',
      arrivalTime: '8:03 AM',
      departureTime: '8:05 AM',
      studentsCount: 6,
      coordinates: { lat: 40.716, lng: -74.012 },
    },
    {
      id: 14,
      routeId: 2,
      name: 'Vineyard Road & Harvest Drive',
      arrivalTime: '8:10 AM',
      departureTime: '8:12 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7165, lng: -74.0125 },
    },
    {
      id: 15,
      routeId: 2,
      name: 'School Campus',
      arrivalTime: '8:20 AM',
      departureTime: '8:20 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },
    // Route 3
    {
      id: 16,
      routeId: 3,
      name: 'Lakeview Drive & Sunset Blvd',
      arrivalTime: '7:30 AM',
      departureTime: '7:32 AM',
      studentsCount: 5,
      coordinates: { lat: 40.716, lng: -74.013 },
    },
    {
      id: 17,
      routeId: 3,
      name: 'Highland Road & Chestnut Street',
      arrivalTime: '7:36 AM',
      departureTime: '7:38 AM',
      studentsCount: 6,
      coordinates: { lat: 40.7165, lng: -74.0135 },
    },
    {
      id: 18,
      routeId: 3,
      name: 'School Campus',
      arrivalTime: '7:45 AM',
      departureTime: '7:45 AM',
      studentsCount: 4,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },

    // Route 4
    {
      id: 19,
      routeId: 4,
      name: 'Brookside Ave & Ivy Lane',
      arrivalTime: '7:30 AM',
      departureTime: '7:32 AM',
      studentsCount: 3,
      coordinates: { lat: 40.717, lng: -74.014 },
    },
    {
      id: 20,
      routeId: 4,
      name: 'Mulberry Street & Willow Way',
      arrivalTime: '7:35 AM',
      departureTime: '7:37 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7175, lng: -74.0145 },
    },
    {
      id: 21,
      routeId: 4,
      name: 'Evergreen Drive & Palm Court',
      arrivalTime: '7:40 AM',
      departureTime: '7:42 AM',
      studentsCount: 4,
      coordinates: { lat: 40.718, lng: -74.015 },
    },
    {
      id: 22,
      routeId: 4,
      name: 'School Campus',
      arrivalTime: '7:48 AM',
      departureTime: '7:48 AM',
      studentsCount: 3,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },

    // Route 5
    {
      id: 23,
      routeId: 5,
      name: 'Hickory Lane & Aspen Way',
      arrivalTime: '7:30 AM',
      departureTime: '7:32 AM',
      studentsCount: 4,
      coordinates: { lat: 40.719, lng: -74.016 },
    },
    {
      id: 24,
      routeId: 5,
      name: 'Magnolia Blvd & Fir Street',
      arrivalTime: '7:36 AM',
      departureTime: '7:38 AM',
      studentsCount: 6,
      coordinates: { lat: 40.7195, lng: -74.0165 },
    },
    {
      id: 25,
      routeId: 5,
      name: 'School Campus',
      arrivalTime: '7:45 AM',
      departureTime: '7:45 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },

    // Route 6
    {
      id: 26,
      routeId: 6,
      name: 'Oak Hill Road & Maple Crescent',
      arrivalTime: '7:30 AM',
      departureTime: '7:32 AM',
      studentsCount: 5,
      coordinates: { lat: 40.72, lng: -74.017 },
    },
    {
      id: 27,
      routeId: 6,
      name: 'Pinecrest Drive & Juniper Way',
      arrivalTime: '7:35 AM',
      departureTime: '7:37 AM',
      studentsCount: 6,
      coordinates: { lat: 40.7205, lng: -74.0175 },
    },
    {
      id: 28,
      routeId: 6,
      name: 'Cypress Street & Olive Avenue',
      arrivalTime: '7:41 AM',
      departureTime: '7:43 AM',
      studentsCount: 4,
      coordinates: { lat: 40.721, lng: -74.018 },
    },
    {
      id: 29,
      routeId: 6,
      name: 'School Campus',
      arrivalTime: '7:50 AM',
      departureTime: '7:50 AM',
      studentsCount: 3,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },

    // Route 7
    {
      id: 30,
      routeId: 7,
      name: 'Riverbend Road & Clover Drive',
      arrivalTime: '7:30 AM',
      departureTime: '7:32 AM',
      studentsCount: 4,
      coordinates: { lat: 40.722, lng: -74.019 },
    },
    {
      id: 31,
      routeId: 7,
      name: 'Birchwood Lane & Thistle Way',
      arrivalTime: '7:36 AM',
      departureTime: '7:38 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7225, lng: -74.0195 },
    },
    {
      id: 32,
      routeId: 7,
      name: 'School Campus',
      arrivalTime: '7:45 AM',
      departureTime: '7:45 AM',
      studentsCount: 4,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },

    // Route 8
    {
      id: 33,
      routeId: 8,
      name: 'Northview Road & Acorn Street',
      arrivalTime: '7:30 AM',
      departureTime: '7:32 AM',
      studentsCount: 6,
      coordinates: { lat: 40.723, lng: -74.02 },
    },
    {
      id: 34,
      routeId: 8,
      name: 'Sunrise Blvd & Pebble Lane',
      arrivalTime: '7:35 AM',
      departureTime: '7:37 AM',
      studentsCount: 5,
      coordinates: { lat: 40.7235, lng: -74.0205 },
    },
    {
      id: 35,
      routeId: 8,
      name: 'Daisy Drive & Fern Street',
      arrivalTime: '7:40 AM',
      departureTime: '7:42 AM',
      studentsCount: 4,
      coordinates: { lat: 40.724, lng: -74.021 },
    },
    {
      id: 36,
      routeId: 8,
      name: 'School Campus',
      arrivalTime: '7:50 AM',
      departureTime: '7:50 AM',
      studentsCount: 3,
      coordinates: { lat: 40.7135, lng: -74.0095 },
    },
  ];

  constructor() {}

  ngOnInit(): void {
    this.selectedRoute = this.busRoutes[0]; // Select first route by default
  }

  selectRoute(route: BusRoute): void {
    this.selectedRoute = route;
    this.activeTab = 0; // Reset to first tab
  }

  getRouteStops(routeId: number): RouteStop[] {
    return this.routeStops.filter((stop) => stop.routeId === routeId);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'delayed':
        return 'status-delayed';
      default:
        return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active':
        return 'check_circle';
      case 'inactive':
        return 'cancel';
      case 'delayed':
        return 'access_time';
      default:
        return 'help';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }

  getActiveBusCount(): number {
    return this.busRoutes.filter((route) => route.status === 'active').length;
  }

  getDelayedBusCount(): number {
    return this.busRoutes.filter((route) => route.status === 'delayed').length;
  }

  getInactiveBusCount(): number {
    return this.busRoutes.filter((route) => route.status === 'inactive').length;
  }

  getTotalStudentsCount(): number {
    return this.busRoutes.reduce(
      (total, route) => total + route.totalStudents,
      0
    );
  }
}
