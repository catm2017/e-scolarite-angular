import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NgScrollbar } from 'ngx-scrollbar';

export interface Incident {
  id: string;
  studentName: string;
  studentImg: string;
  incidentType: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Investigating' | 'Resolved' | 'Suspended';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-disciplinary-incidents-table',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    NgScrollbar,
  ],
  templateUrl: './disciplinary-incidents-table.component.html',
  styleUrl: './disciplinary-incidents-table.component.scss',
})
export class DisciplinaryIncidentsTableComponent {
  public incidents: Incident[] = [
    {
      id: 'DIS-102',
      studentName: 'Alex Mercer',
      studentImg: 'assets/images/user/user1.jpg',
      incidentType: 'Class Disruption',
      date: '2026-05-18',
      severity: 'Medium',
      status: 'Investigating',
    },
    {
      id: 'DIS-103',
      studentName: 'Clara Oswald',
      studentImg: 'assets/images/user/user2.jpg',
      incidentType: 'Unexcused Absence',
      date: '2026-05-17',
      severity: 'Low',
      status: 'Resolved',
    },
    {
      id: 'DIS-104',
      studentName: 'Danny Pink',
      studentImg: 'assets/images/user/user3.jpg',
      incidentType: 'Cheating on Midterm',
      date: '2026-05-15',
      severity: 'High',
      status: 'Suspended',
    },
    {
      id: 'DIS-105',
      studentName: 'Amy Pond',
      studentImg: 'assets/images/user/user4.jpg',
      incidentType: 'Property Damage',
      date: '2026-05-14',
      severity: 'High',
      status: 'Investigating',
    },
    {
      id: 'DIS-106',
      studentName: 'Rory Williams',
      studentImg: 'assets/images/user/user5.jpg',
      incidentType: 'Dress Code Violation',
      date: '2026-05-12',
      severity: 'Low',
      status: 'Resolved',
    },
  ];

  public getSeverityClass(severity: 'Low' | 'Medium' | 'High'): string {
    switch (severity) {
      case 'High': return 'badge-solid-red';
      case 'Medium': return 'badge-solid-orange';
      case 'Low': return 'badge-solid-blue';
      default: return 'badge-solid-green';
    }
  }

  public getStatusClass(status: 'Investigating' | 'Resolved' | 'Suspended'): string {
    switch (status) {
      case 'Suspended': return 'bg-danger-subtle text-danger';
      case 'Investigating': return 'bg-warning-subtle text-warning-emphasis';
      case 'Resolved': return 'bg-success-subtle text-success';
      default: return '';
    }
  }
}
