import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgScrollbar } from 'ngx-scrollbar';

interface ClassSchedule {
  subject: string;
  time: string;
  room: string;
  teacher?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-class-schedule',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    NgScrollbar,
  ],
  templateUrl: './class-schedule.component.html',
  styleUrls: ['./class-schedule.component.scss'],
})
export class ClassScheduleComponent {
  todayClasses: ClassSchedule[] = [
    {
      subject: 'Mathematics',
      time: '08:00 - 09:30',
      room: 'Room 101',
      status: 'completed',
    },
    {
      subject: 'Science',
      time: '10:00 - 11:30',
      room: 'Lab 3',
      status: 'ongoing',
    },
    {
      subject: 'English Literature',
      time: '13:00 - 14:30',
      room: 'Room 203',
      status: 'upcoming',
    },
    {
      subject: 'History',
      time: '15:00 - 16:30',
      room: 'Room 105',
      status: 'upcoming',
    },
    {
      subject: 'Mathematics - Algebra',
      time: '07:30 - 09:00',
      room: 'Room 201',
      status: 'completed',
    },
    {
      subject: 'Physics - Mechanics',
      time: '09:15 - 10:45',
      room: 'Lab 4',
      status: 'ongoing',
    },
    {
      subject: 'English Grammar Workshop',
      time: '11:00 - 12:30',
      room: 'Room 103',
      status: 'upcoming',
    },
    {
      subject: 'World History Lecture',
      time: '13:00 - 14:30',
      room: 'Room 106',
      status: 'upcoming',
    },
    {
      subject: 'Computer Science - Web Dev',
      time: '15:00 - 16:30',
      room: 'Lab 2',
      status: 'completed',
    },
    {
      subject: 'Chemistry - Organic Chemistry',
      time: '16:45 - 18:15',
      room: 'Lab 1',
      status: 'upcoming',
    },
  ];

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'completed-class';
      case 'ongoing':
        return 'ongoing-class';
      case 'upcoming':
        return 'upcoming-class';
      default:
        return '';
    }
  }
}
