import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-exam-schedule',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgScrollbar],
  templateUrl: './exam-schedule.component.html',
  styleUrls: ['./exam-schedule.component.scss']
})
export class ExamScheduleComponent {
  exams = [
    {
      date: '12 Oct',
      day: 'Monday',
      subject: 'Mathematics',
      examType: 'Mid-Term',
      room: 'Main Hall',
      time: '09:00 AM',
      duration: '2 hrs',
      color: '#6366f1',
      icon: 'calculate',
      status: 'Upcoming',
      statusClass: 'upcoming'
    },
    {
      date: '14 Oct',
      day: 'Wednesday',
      subject: 'Physics',
      examType: 'Mid-Term',
      room: 'Lab 2',
      time: '11:00 AM',
      duration: '1.5 hrs',
      color: '#06b6d4',
      icon: 'analytics',
      status: 'Upcoming',
      statusClass: 'upcoming'
    },
    {
      date: '18 Oct',
      day: 'Sunday',
      subject: 'Chemistry',
      examType: 'Practical',
      room: 'Science Lab',
      time: '10:00 AM',
      duration: '1 hr',
      color: '#f59e0b',
      icon: 'science',
      status: 'Upcoming',
      statusClass: 'upcoming'
    },
    {
      date: '22 Oct',
      day: 'Thursday',
      subject: 'Mathematics',
      examType: 'Final',
      room: 'Auditorium',
      time: '09:30 AM',
      duration: '3 hrs',
      color: '#6366f1',
      icon: 'calculate',
      status: 'Scheduled',
      statusClass: 'scheduled'
    },
    {
      date: '25 Oct',
      day: 'Sunday',
      subject: 'Physics',
      examType: 'Final',
      room: 'Main Hall',
      time: '10:00 AM',
      duration: '2.5 hrs',
      color: '#06b6d4',
      icon: 'analytics',
      status: 'Scheduled',
      statusClass: 'scheduled'
    }
  ];
}
