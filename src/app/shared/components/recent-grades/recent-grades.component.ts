import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { NgScrollbar } from 'ngx-scrollbar';

interface GradeItem {
  subject: string;
  title: string;
  date: string;
  grade: string;
  score: number;
  maxScore: number;
  iconClass: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recent-grades',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    NgScrollbar,
  ],
  templateUrl: './recent-grades.component.html',
  styleUrls: ['./recent-grades.component.scss'],
})
export class RecentGradesComponent {
  grades: GradeItem[] = [
    {
      subject: 'Mathematics',
      title: 'Algebra Quiz',
      date: '2023-10-15',
      grade: 'A',
      score: 92,
      maxScore: 100,
      iconClass: 'primary-rgba text-primary',
    },
    {
      subject: 'Science',
      title: 'Chemistry Lab Report',
      date: '2023-10-12',
      grade: 'B+',
      score: 87,
      maxScore: 100,
      iconClass: 'success-rgba text-success',
    },
    {
      subject: 'English',
      title: 'Essay Assignment',
      date: '2023-10-10',
      grade: 'A-',
      score: 90,
      maxScore: 100,
      iconClass: 'info-rgba text-info',
    },
    {
      subject: 'History',
      title: 'World War II Test',
      date: '2023-10-08',
      grade: 'B',
      score: 83,
      maxScore: 100,
      iconClass: 'warning-rgba text-warning',
    },
    {
      subject: 'Computer Science',
      title: 'Programming Project',
      date: '2023-10-05',
      grade: 'A+',
      score: 98,
      maxScore: 100,
      iconClass: 'primary-rgba text-primary',
    },
  ];

  getGradeColor(grade: string): string {
    const firstChar = grade.charAt(0);
    switch (firstChar) {
      case 'A':
        return 'badge-solid-green';
      case 'B':
        return 'badge-solid-blue';
      case 'C':
        return 'badge-solid-brown';
      case 'D':
        return 'badge-solid-purple';
      case 'F':
        return 'badge-solid-orange';
      default:
        return 'badge-solid-blue';
    }
  }

  getPercentage(score: number, maxScore: number): number {
    return (score / maxScore) * 100;
  }
}
