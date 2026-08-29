import { Component, OnInit, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgScrollbarModule } from 'ngx-scrollbar';

export interface Student {
  id: number;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
  subject: string;
  improvement?: number;
  badges?: string[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-top-students-card',
  templateUrl: './top-students-card.component.html',
  styleUrls: ['./top-students-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    NgScrollbarModule,
  ],
})
export class TopStudentsCardComponent implements OnInit {
  readonly title = input('Top Performing Students');
  readonly students = input<Student[]>([]);
  readonly processedStudents = computed(() => {
    const data = this.students();
    const active = data && data.length > 0 ? data : this.defaultStudents;
    return active.slice(0, this.maxStudents());
  });
  readonly maxStudents = input(5);

  displayedColumns: string[] = [
    'rank',
    'student',
    'subject',
    'score',
    'badges',
  ];

  // Default student data if none is provided
  defaultStudents: Student[] = [
    {
      id: 1,
      name: 'Emma Thompson',
      avatar: 'assets/images/user/user1.jpg',
      score: 98,
      rank: 1,
      subject: 'Mathematics',
      improvement: 5,
      badges: ['star', 'trending_up', 'emoji_events'],
    },
    {
      id: 2,
      name: 'James Wilson',
      avatar: 'assets/images/user/user8.jpg',
      score: 96,
      rank: 2,
      subject: 'Science',
      improvement: 3,
      badges: ['star', 'emoji_events'],
    },
    {
      id: 3,
      name: 'Sophia Garcia',
      avatar: 'assets/images/user/user9.jpg',
      score: 95,
      rank: 3,
      subject: 'English',
      improvement: 7,
      badges: ['trending_up', 'emoji_events'],
    },
    {
      id: 4,
      name: 'Liam Johnson',
      avatar: 'assets/images/user/user2.jpg',
      score: 93,
      rank: 4,
      subject: 'History',
      improvement: 2,
      badges: ['star'],
    },
    {
      id: 5,
      name: 'Olivia Brown',
      avatar: 'assets/images/user/user7.jpg',
      score: 91,
      rank: 5,
      subject: 'Art',
      improvement: 4,
      badges: ['trending_up'],
    },
    {
      id: 6,
      name: 'Noah Martinez',
      avatar: 'assets/images/user/user5.jpg',
      score: 90,
      rank: 6,
      subject: 'Physics',
      improvement: 1,
      badges: [],
    },
    {
      id: 7,
      name: 'Ava Davis',
      avatar: 'assets/images/user/user11.jpg',
      score: 89,
      rank: 7,
      subject: 'Chemistry',
      improvement: 0,
      badges: [],
    },
  ];

  constructor() {}

  ngOnInit(): void {
    // Use default data if none is provided
    const students = this.processedStudents();
    if (!students || students.length === 0) {
      // removed default assign
    }

    // Limit the number of students displayed
    // removed slice assign
  }

  getBadgeTooltip(badge: string): string {
    const tooltips: { [key: string]: string } = {
      star: 'Outstanding Performance',
      trending_up: 'Significant Improvement',
      emoji_events: 'Top Achiever',
      military_tech: 'Excellence Award',
      workspace_premium: 'Premium Student',
      psychology: 'Critical Thinker',
      lightbulb: 'Creative Thinker',
      groups: 'Team Player',
      public: 'Community Contributor',
    };

    return tooltips[badge] || 'Achievement Badge';
  }

  getBadgeColor(badge: string): string {
    const colors: { [key: string]: string } = {
      star: 'gold',
      trending_up: 'green',
      emoji_events: 'purple',
      military_tech: 'blue',
      workspace_premium: 'teal',
      psychology: 'orange',
      lightbulb: 'amber',
      groups: 'indigo',
      public: 'brown',
    };

    return colors[badge] || 'primary';
  }

  getImprovementIcon(improvement: number | undefined): string {
    if (improvement === undefined) return '';
    if (improvement > 5) return 'trending_up';
    if (improvement > 0) return 'arrow_upward';
    if (improvement < 0) return 'arrow_downward';
    return 'remove';
  }

  getImprovementColor(improvement: number | undefined): string {
    if (improvement === undefined) return '';
    if (improvement > 0) return 'positive';
    if (improvement < 0) return 'negative';
    return '';
  }
}
