import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { NgScrollbar } from 'ngx-scrollbar';

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  isRead: boolean;
  sender?: string;
  attachments?: string[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-noticeboard-announcements',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    NgScrollbar,
  ],
  templateUrl: './noticeboard-announcements.component.html',
  styleUrls: ['./noticeboard-announcements.component.scss'],
})
export class NoticeboardAnnouncementsComponent {
  announcements: Announcement[] = [
    {
      id: 1,
      title: 'School Closure Due to Weather',
      content:
        'Due to severe weather conditions, the school will remain closed on Monday, May 25th. All classes and activities are cancelled.',
      date: '2026-05-20',
      urgency: 'critical',
      category: 'Administrative',
      isRead: false,
      sender: 'Principal Johnson',
    },
    {
      id: 2,
      title: 'Annual Sports Day Schedule',
      content:
        'The annual sports day will be held on June 15th. All students are required to participate in at least one event. Registration closes on June 1st.',
      date: '2026-05-18',
      urgency: 'medium',
      category: 'Events',
      isRead: true,
      sender: 'Sports Director',
      attachments: ['sports_schedule.pdf'],
    },
    {
      id: 3,
      title: 'Parent-Teacher Meeting',
      content:
        'Parent-teacher meetings will be held on May 28th from 9 AM to 3 PM. Please book your slots in advance through the school portal.',
      date: '2026-05-19',
      urgency: 'high',
      category: 'Meetings',
      isRead: false,
      sender: 'Vice Principal Smith',
    },
    {
      id: 4,
      title: 'Library Book Return Reminder',
      content:
        'All borrowed library books must be returned by May 28th. Late returns will incur a fine of $1 per day.',
      date: '2026-05-15',
      urgency: 'low',
      category: 'Library',
      isRead: true,
      sender: 'Librarian Evans',
    },
    {
      id: 5,
      title: 'Scholarship Application Deadline',
      content:
        'Applications for the annual merit scholarship are due by June 10th. Eligible students must have a GPA of at least 3.5.',
      date: '2026-05-17',
      urgency: 'high',
      category: 'Scholarships',
      isRead: false,
      sender: 'Academic Office',
      attachments: ['scholarship_form.pdf', 'eligibility_criteria.pdf'],
    },
    {
      id: 6,
      title: 'New Cafeteria Menu',
      content:
        'The school cafeteria will be introducing a new menu starting June 1st. The menu includes healthier options and accommodates various dietary restrictions.',
      date: '2026-05-14',
      urgency: 'low',
      category: 'Cafeteria',
      isRead: true,
      sender: 'Cafeteria Team',
      attachments: ['new_menu.pdf'],
    },
    {
      id: 7,
      title: 'COVID-19 Protocol Update',
      content:
        'Updated safety protocols will be implemented starting next week. Hand sanitizing stations have been added to all classroom hallways.',
      date: '2026-05-16',
      urgency: 'high',
      category: 'Health',
      isRead: false,
      sender: 'Health Officer Lee',
    },
  ];

  categories: string[] = [
    'All',
    'Administrative',
    'Events',
    'Meetings',
    'Library',
    'Scholarships',
    'Cafeteria',
    'Health',
  ];

  selectedCategory: string = 'All';
  activeTab: number = 0;

  // Filter announcements by category
  getFilteredAnnouncements(): Announcement[] {
    if (this.selectedCategory === 'All') {
      return this.announcements;
    }
    return this.announcements.filter(
      (a) => a.category === this.selectedCategory
    );
  }

  // Get unread announcements
  getUnreadAnnouncements(): Announcement[] {
    return this.announcements.filter((a) => !a.isRead);
  }

  // Get urgent announcements (high or critical urgency)
  getUrgentAnnouncements(): Announcement[] {
    return this.announcements.filter(
      (a) => a.urgency === 'high' || a.urgency === 'critical'
    );
  }

  // Mark announcement as read
  markAsRead(announcement: Announcement): void {
    announcement.isRead = true;
  }

  // Get urgency color
  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'low':
        return 'urgency-low';
      case 'medium':
        return 'urgency-medium';
      case 'high':
        return 'urgency-high';
      case 'critical':
        return 'urgency-critical';
      default:
        return '';
    }
  }

  // Get urgency icon
  getUrgencyIcon(urgency: string): string {
    switch (urgency) {
      case 'low':
        return 'info';
      case 'medium':
        return 'notification_important';
      case 'high':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  // Format date to readable format
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Get days ago
  getDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date('2026-05-20'); // Static mock today synchronized with local time
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  }

  // Set active category
  setCategory(category: string): void {
    this.selectedCategory = category;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.announcements.filter((a) => !a.isRead).length;
  }

  // Get urgent count
  getUrgentCount(): number {
    return this.getUrgentAnnouncements().length;
  }

  // Get sender avatar initials
  getSenderInitials(sender: string): string {
    if (!sender) return 'SA';
    const parts = sender.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return sender.substring(0, 2).toUpperCase();
  }

  // Get dynamic stable color for sender initials avatar
  getSenderAvatarColor(sender: string): string {
    if (!sender) return '#5c67f2';
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Curated premium HSL colors to ensure visual harmony
    const colors = [
      '#5c67f2', // Primary Indigo
      '#3f51b5', // Royal Blue
      '#009688', // Teal
      '#4caf50', // Green
      '#ff9800', // Amber
      '#f44336', // Coral Red
      '#e91e63', // Pink
      '#9c27b0', // Purple
      '#00bcd4', // Cyan
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  // Extract attachment extension or shorthand
  getAttachmentExtension(filename: string): string {
    if (!filename) return 'FILE';
    const ext = filename.split('.').pop() || '';
    return ext.toUpperCase();
  }

  // Mock download action
  downloadAttachment(_filename: string): void {
    // In production, this would trigger a file download
  }

  // Mark all announcements as read
  markAllAsRead(): void {
    this.announcements.forEach((a) => (a.isRead = true));
  }
}
