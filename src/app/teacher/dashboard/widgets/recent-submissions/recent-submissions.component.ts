import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recent-submissions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, NgScrollbar],
  templateUrl: './recent-submissions.component.html',
  styleUrls: ['./recent-submissions.component.scss']
})
export class RecentSubmissionsComponent {
  submissions = [
    {
      name: 'Sarah Wilson',
      avatar: 'SW',
      assignment: 'Calculus Assignment 3',
      subject: 'Mathematics',
      date: 'Today, 9:15 AM',
      status: 'Pending',
      statusClass: 'pending',
      color: '#6366f1',
      icon: 'calculate'
    },
    {
      name: 'Tom Hardy',
      avatar: 'TH',
      assignment: 'Physics Lab Report',
      subject: 'Physics',
      date: 'Today, 8:40 AM',
      status: 'Graded',
      statusClass: 'graded',
      grade: 'A',
      color: '#06b6d4',
      icon: 'analytics'
    },
    {
      name: 'Emma Stone',
      avatar: 'ES',
      assignment: 'Chemistry Project',
      subject: 'Chemistry',
      date: 'Yesterday, 4:30 PM',
      status: 'Pending',
      statusClass: 'pending',
      color: '#f59e0b',
      icon: 'science'
    },
    {
      name: 'Liam Parker',
      avatar: 'LP',
      assignment: 'Trigonometry Worksheet 7',
      subject: 'Mathematics',
      date: 'Yesterday, 2:10 PM',
      status: 'Graded',
      statusClass: 'graded',
      grade: 'B+',
      color: '#6366f1',
      icon: 'calculate'
    },
    {
      name: 'Olivia Brown',
      avatar: 'OB',
      assignment: 'Optics Diagram Sheet',
      subject: 'Physics',
      date: 'May 19, 11:00 AM',
      status: 'Pending',
      statusClass: 'pending',
      color: '#06b6d4',
      icon: 'analytics'
    },
    {
      name: 'Noah Davis',
      avatar: 'ND',
      assignment: 'Organic Chemistry Essay',
      subject: 'Chemistry',
      date: 'May 18, 3:45 PM',
      status: 'Graded',
      statusClass: 'graded',
      grade: 'A-',
      color: '#f59e0b',
      icon: 'science'
    }
  ];
}
