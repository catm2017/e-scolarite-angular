import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-upcoming-classes',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgScrollbar
],
  templateUrl: './upcoming-classes.component.html',
  styleUrls: ['./upcoming-classes.component.scss'],
})
export class UpcomingClassesComponent {
  classes = [
    {
      subject: 'Advanced Mathematics',
      time: '09:00 AM - 10:30 AM',
      duration: '1h 30m',
      grade: 'Grade 12A',
      room: 'Room 302',
      students: 28,
      color: '#3f51b5',
      icon: 'functions',
    },
    {
      subject: 'Physics Practical',
      time: '11:00 AM - 12:30 PM',
      duration: '1h 30m',
      grade: 'Grade 11B',
      room: 'Lab 1',
      students: 22,
      color: '#009688',
      icon: 'science',
    },
    {
      subject: 'Calculus',
      time: '01:30 PM - 02:45 PM',
      duration: '1h 15m',
      grade: 'Grade 12A',
      room: 'Room 304',
      students: 30,
      color: '#ff9800',
      icon: 'calculate',
    },
    {
      subject: 'Algebra Remedial',
      time: '03:00 PM - 04:00 PM',
      duration: '1h',
      grade: 'Grade 10C',
      room: 'Room 101',
      students: 15,
      color: '#f44336',
      icon: 'straighten',
    },
    {
      subject: 'Geometry',
      time: '04:15 PM - 05:00 PM',
      duration: '45m',
      grade: 'Grade 9B',
      room: 'Room 205',
      students: 25,
      color: '#9c27b0',
      icon: 'architecture',
    },
    {
      subject: 'Staff Meeting',
      time: '05:15 PM - 06:00 PM',
      duration: '45m',
      grade: 'Faculty',
      room: 'Conf. Hall',
      students: 12,
      color: '#00bcd4',
      icon: 'groups',
    },
  ];
}
