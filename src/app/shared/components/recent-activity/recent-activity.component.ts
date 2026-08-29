import { Component, input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgScrollbar } from 'ngx-scrollbar';

interface Activity {
  id: number;
  type: 'assignment' | 'grade' | 'attendance' | 'message' | 'note' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  statusClass: string;
  user?: {
    name: string;
    avatar?: string;
  };
  relatedEntity?: {
    type: 'class' | 'student' | 'assignment' | 'message';
    id: number;
    name: string;
  };
  read: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recent-activity',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    NgScrollbar,
  ],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss',
})
export class RecentActivityComponent implements OnInit {
  readonly title = input('Recent Activity');
  readonly activities = input<Activity[]>([]);
  readonly maxActivities = input(5);

  displayActivities: Activity[] = [];

  // Default activities for demonstration
  private defaultActivities: Activity[] = [
    {
      id: 1,
      type: 'assignment',
      title: 'New Assignment Created',
      message: 'You created a new assignment "Midterm Project" for Class 10A',
      timestamp: new Date(new Date().getTime() - 25 * 60000), // 25 minutes ago
      statusClass: 'border-info',
      user: {
        name: 'You',
        avatar: 'assets/images/avatars/teacher-avatar.png',
      },
      relatedEntity: {
        type: 'class',
        id: 1,
        name: 'Class 10A',
      },
      read: false,
    },
    {
      id: 2,
      type: 'grade',
      title: 'Grades Updated',
      message: 'You graded 15 student submissions for "Weekly Quiz #3"',
      timestamp: new Date(new Date().getTime() - 2 * 3600000), // 2 hours ago
      statusClass: 'border-success',
      user: {
        name: 'You',
        avatar: 'assets/images/avatars/teacher-avatar.png',
      },
      relatedEntity: {
        type: 'assignment',
        id: 2,
        name: 'Weekly Quiz #3',
      },
      read: true,
    },
    {
      id: 3,
      type: 'attendance',
      title: 'Attendance Marked',
      message: 'You marked attendance for Class 9B - 3 students absent',
      timestamp: new Date(new Date().getTime() - 5 * 3600000), // 5 hours ago
      statusClass: 'border-warning',
      user: {
        name: 'You',
        avatar: 'assets/images/avatars/teacher-avatar.png',
      },
      relatedEntity: {
        type: 'class',
        id: 3,
        name: 'Class 9B',
      },
      read: true,
    },
    {
      id: 4,
      type: 'message',
      title: 'New Message',
      message:
        'Principal Johnson sent an announcement about the upcoming parent-teacher meeting',
      timestamp: new Date(new Date().getTime() - 1 * 86400000), // 1 day ago
      statusClass: 'border-primary',
      user: {
        name: 'Principal Johnson',
        avatar: 'assets/images/avatars/principal-avatar.png',
      },
      relatedEntity: {
        type: 'message',
        id: 4,
        name: 'Announcement',
      },
      read: false,
    },
    {
      id: 5,
      type: 'note',
      title: 'Note Created',
      message:
        'You created a new note "Prepare materials for science experiment"',
      timestamp: new Date(new Date().getTime() - 2 * 86400000), // 2 days ago
      statusClass: 'border-info',
      user: {
        name: 'You',
        avatar: 'assets/images/avatars/teacher-avatar.png',
      },
      read: true,
    },
  ];

  ngOnInit(): void {
    // Use provided activities or default ones if none provided
    const activitiesToUse =
      this.activities().length > 0 ? this.activities() : this.defaultActivities;

    // Limit the number of activities to display
    this.displayActivities = activitiesToUse.slice(0, this.maxActivities());
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'assignment':
        return 'assignment';
      case 'grade':
        return 'grade';
      case 'attendance':
        return 'how_to_reg';
      case 'message':
        return 'message';
      case 'note':
        return 'note';
      case 'system':
        return 'system_update';
      default:
        return 'notifications';
    }
  }

  getActivityIconClass(type: string): string {
    return type.toLowerCase();
  }

  getFormattedTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  markAsRead(activity: Activity): void {
    activity.read = true;
  }

  markAllAsRead(): void {
    this.displayActivities.forEach((activity) => {
      activity.read = true;
    });
  }

  getUnreadCount(): number {
    return this.displayActivities.filter((activity) => !activity.read).length;
  }

  viewActivity(activity: Activity): void {
    // Mark as read when viewed
    this.markAsRead(activity);

    // In a real application, this would navigate to the relevant page or open a dialog
    
  }
}
