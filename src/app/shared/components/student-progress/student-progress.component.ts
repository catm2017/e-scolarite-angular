import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgScrollbar } from 'ngx-scrollbar';

interface StudentProgress {
  name: string;
  subject: string;
  progress: number;
  grade: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-progress',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    NgScrollbar
],
  templateUrl: './student-progress.component.html',
  styleUrls: ['./student-progress.component.scss'],
})
export class StudentProgressComponent {
  students: StudentProgress[] = [
    { name: 'John Smith', subject: 'Mathematics', progress: 85, grade: 'A' },
    { name: 'Emily Johnson', subject: 'Science', progress: 92, grade: 'A+' },
    { name: 'Michael Brown', subject: 'English', progress: 78, grade: 'B+' },
    { name: 'Sarah Davis', subject: 'History', progress: 65, grade: 'C+' },
    { name: 'David Wilson', subject: 'Physics', progress: 88, grade: 'A-' },
    { name: 'Laura Martinez', subject: 'Chemistry', progress: 73, grade: 'B' },
    { name: 'James Anderson', subject: 'Biology', progress: 59, grade: 'C' },
    {
      name: 'Olivia Thompson',
      subject: 'Geography',
      progress: 95,
      grade: 'A+',
    },
    {
      name: 'Daniel Clark',
      subject: 'Computer Science',
      progress: 81,
      grade: 'A-',
    },
    { name: 'Sophia Lewis', subject: 'Art', progress: 68, grade: 'B-' },
  ];
}
