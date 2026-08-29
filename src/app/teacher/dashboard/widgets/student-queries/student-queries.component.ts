import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-queries',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, NgScrollbar],
  templateUrl: './student-queries.component.html',
  styleUrls: ['./student-queries.component.scss']
})
export class StudentQueriesComponent {
  queries = [
    {
      student: 'John Doe',
      avatar: 'JD',
      subject: 'Mathematics',
      question: 'Can you explain the quadratic formula steps again? I am stuck on Chapter 4 exercise 2.',
      date: 'Today, 10:30 AM',
      status: 'Pending',
      statusClass: 'pending',
      color: '#6366f1',
      icon: 'calculate'
    },
    {
      student: 'Alice Smith',
      avatar: 'AS',
      subject: 'Physics',
      question: 'Do we need to write the detailed lab notes for the electromagnetism practical tomorrow?',
      date: 'Yesterday, 4:15 PM',
      status: 'Resolved',
      statusClass: 'resolved',
      color: '#06b6d4',
      icon: 'analytics'
    },
    {
      student: 'Michael Brown',
      avatar: 'MB',
      subject: 'Chemistry',
      question: 'Is the physical chemistry section included in the upcoming mid-term syllabus?',
      date: 'Yesterday, 2:30 PM',
      status: 'Pending',
      statusClass: 'pending',
      color: '#f59e0b',
      icon: 'science'
    },
    {
      student: 'Sarah Jenkins',
      avatar: 'SJ',
      subject: 'Chemistry',
      question: 'Could you recommend any reference books for the carbon compounds and organic reaction mechanism chapters?',
      date: 'May 19, 11:20 AM',
      status: 'Pending',
      statusClass: 'pending',
      color: '#f59e0b',
      icon: 'science'
    },
    {
      student: 'Emma Stone',
      avatar: 'ES',
      subject: 'Physics',
      question: 'Where can I find the extra practice sheets for thermodynamics and heat transfer?',
      date: 'May 18, 9:00 AM',
      status: 'Pending',
      statusClass: 'pending',
      color: '#06b6d4',
      icon: 'analytics'
    },
    {
      student: 'David Vance',
      avatar: 'DV',
      subject: 'Mathematics',
      question: 'I submitted the calculus homework 10 minutes late due to a connection issue, could you please check if it is received?',
      date: 'May 17, 6:45 PM',
      status: 'Resolved',
      statusClass: 'resolved',
      color: '#6366f1',
      icon: 'calculate'
    }
  ];
}
