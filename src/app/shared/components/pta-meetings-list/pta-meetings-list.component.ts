import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

export interface PtaMeeting {
  id: number;
  parentName: string;
  parentImg: string;
  studentName: string;
  grade: string;
  teacherName: string;
  agenda: string;
  dateTime: string;
  priority: 'High' | 'Medium' | 'Low';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pta-meetings-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './pta-meetings-list.component.html',
  styleUrl: './pta-meetings-list.component.scss',
})
export class PtaMeetingsListComponent {
  public meetings: PtaMeeting[] = [
    {
      id: 1,
      parentName: 'Sarah Jenkins',
      parentImg: 'assets/images/user/user1.jpg',
      studentName: 'Emily Jenkins',
      grade: 'Grade 9-A',
      teacherName: 'Jens Brincker',
      agenda: 'Discuss Academic Growth & College Prep',
      dateTime: 'May 22, 10:00 AM',
      priority: 'High',
    },
    {
      id: 2,
      parentName: 'David Miller',
      parentImg: 'assets/images/user/user2.jpg',
      studentName: 'Leo Miller',
      grade: 'Grade 6-B',
      teacherName: 'Sarah Smith',
      agenda: 'Behavioral Feedback & Extra-curriculars',
      dateTime: 'May 22, 11:30 AM',
      priority: 'Medium',
    },
    {
      id: 3,
      parentName: 'Laura Brown',
      parentImg: 'assets/images/user/user3.jpg',
      studentName: 'Lucas Brown',
      grade: 'Grade 11-C',
      teacherName: 'Mark Hay',
      agenda: 'Math Olympiad Mentorship & Prep',
      dateTime: 'May 23, 09:30 AM',
      priority: 'Low',
    },
    {
      id: 4,
      parentName: 'Robert Wilson',
      parentImg: 'assets/images/user/user4.jpg',
      studentName: 'Sophie Wilson',
      grade: 'Grade 8-A',
      teacherName: 'Cara Stevens',
      agenda: 'Attendance Recovery Program Review',
      dateTime: 'May 23, 02:00 PM',
      priority: 'High',
    },
  ];

  public getPriorityBorderClass(priority: 'High' | 'Medium' | 'Low'): string {
    switch (priority) {
      case 'High': return 'border-left-red';
      case 'Medium': return 'border-left-orange';
      case 'Low': return 'border-left-blue';
      default: return 'border-left-green';
    }
  }

  public getPriorityBadgeClass(priority: 'High' | 'Medium' | 'Low'): string {
    switch (priority) {
      case 'High': return 'bg-danger text-white';
      case 'Medium': return 'bg-warning text-dark';
      case 'Low': return 'bg-info text-white';
      default: return 'bg-success text-white';
    }
  }
}
