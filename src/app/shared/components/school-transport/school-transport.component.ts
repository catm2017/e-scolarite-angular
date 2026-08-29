import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface BusRoute {
  id: number;
  routeNumber: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  status: 'On Time' | 'Delayed' | 'Arrived' | 'Not Started';
  delayTime?: string;
  activeStudents: number;
  capacity: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-school-transport',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './school-transport.component.html',
  styleUrls: ['./school-transport.component.scss']
})
export class SchoolTransportComponent {
  routes: BusRoute[] = [
    {
      id: 1,
      routeNumber: 'Route 101',
      routeName: 'North Side Suburbs',
      driverName: 'Robert Garcia',
      driverPhone: '+1-555-0199',
      status: 'On Time',
      activeStudents: 34,
      capacity: 40
    },
    {
      id: 2,
      routeNumber: 'Route 104',
      routeName: 'East Downtown Loop',
      driverName: 'Michael Chang',
      driverPhone: '+1-555-0177',
      status: 'Delayed',
      delayTime: '15 mins',
      activeStudents: 28,
      capacity: 35
    },
    {
      id: 3,
      routeNumber: 'Route 108',
      routeName: 'South Beach Express',
      driverName: 'Sarah Conner',
      driverPhone: '+1-555-0155',
      status: 'Arrived',
      activeStudents: 30,
      capacity: 30
    },
    {
      id: 4,
      routeNumber: 'Route 112',
      routeName: 'Western Hills Corridor',
      driverName: 'David Lee',
      driverPhone: '+1-555-0122',
      status: 'Not Started',
      activeStudents: 0,
      capacity: 40
    }
  ];

  trackBus(_routeNum: string) {
    // In production, this would open a live GPS tracking view
  }

  getProgressPercent(status: string): number {
    switch (status) {
      case 'Arrived':
        return 100;
      case 'On Time':
        return 60;
      case 'Delayed':
        return 45;
      case 'Not Started':
      default:
        return 0;
    }
  }

  getCapacityPercent(route: BusRoute): number {
    if (!route.capacity) return 0;
    return Math.round((route.activeStudents / route.capacity) * 100);
  }
}
