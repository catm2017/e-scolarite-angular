import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { NgScrollbar } from 'ngx-scrollbar';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'submitted';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-upcoming-assignments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    NgScrollbar,
  ],
  templateUrl: './upcoming-assignments.component.html',
  styleUrls: ['./upcoming-assignments.component.scss'],
})
export class UpcomingAssignmentsComponent {
  assignments: Assignment[] = [
    {
      id: 1,
      title: 'Research Paper on Renewable Energy',
      subject: 'Environmental Science',
      dueDate: '2023-10-25',
      status: 'in-progress',
      priority: 'high',
      description:
        'Write a 5-page research paper on renewable energy sources and their impact on climate change.',
    },
    {
      id: 2,
      title: 'Algebra Problem Set',
      subject: 'Mathematics',
      dueDate: '2023-10-20',
      status: 'pending',
      priority: 'medium',
      description: 'Complete problems 1-20 in Chapter 5 of the textbook.',
    },
    {
      id: 3,
      title: 'Book Report',
      subject: 'English Literature',
      dueDate: '2023-10-30',
      status: 'pending',
      priority: 'medium',
      description:
        'Write a 3-page report on "To Kill a Mockingbird" focusing on character development.',
    },
    {
      id: 4,
      title: 'Chemistry Lab Report',
      subject: 'Chemistry',
      dueDate: '2023-10-18',
      status: 'submitted',
      priority: 'high',
      description:
        'Document the results of the acid-base titration experiment conducted in class.',
    },
    {
      id: 5,
      title: 'History Timeline Project',
      subject: 'History',
      dueDate: '2023-11-05',
      status: 'in-progress',
      priority: 'low',
      description:
        'Create a visual timeline of major events during the Industrial Revolution.',
    },
  ];

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'badge-solid-red';
      case 'medium':
        return 'badge-solid-blue';
      case 'low':
        return 'badge-solid-green';
      default:
        return 'badge-solid-gray';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'in-progress':
        return 'trending_up';
      case 'submitted':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'col-orange';
      case 'in-progress':
        return 'col-blue';
      case 'submitted':
        return 'col-green';
      default:
        return 'col-blue';
    }
  }

  getDaysRemaining(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  isOverdue(dueDate: string): boolean {
    return this.getDaysRemaining(dueDate) < 0;
  }
}
