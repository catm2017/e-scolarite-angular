import { Component, OnInit, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { NgScrollbar } from 'ngx-scrollbar';

export interface Message {
  id: number;
  title: string;
  content: string;
  sender: string;
  date: Date;
  read: boolean;
  type: 'announcement' | 'message' | 'alert-msg';
  priority?: 'high' | 'medium' | 'low';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-message-center',
  templateUrl: './message-center.component.html',
  styleUrls: ['./message-center.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    NgScrollbar,
  ],
})
export class MessageCenterComponent implements OnInit {
  readonly title = input('Message Center');
  readonly messages = input<Message[]>([]);
  readonly processedMessages = computed(() => {
    const data = this.messages();
    const active = data && data.length > 0 ? data : this.defaultMessages;
    return active.slice(0, this.maxMessages());
  });
  readonly maxMessages = input(10);

  expandedMessageId: number | null = null;

  // Default messages if none are provided
  defaultMessages: Message[] = [
    {
      id: 1,
      title: 'Staff Meeting Reminder',
      content:
        'This is a reminder that we have a staff meeting tomorrow at 3:30 PM in the conference room. Please bring your quarterly reports and be prepared to discuss curriculum changes for the next semester.',
      sender: 'Principal Johnson',
      date: new Date(new Date().setDate(new Date().getDate() - 1)),
      read: false,
      type: 'announcement',
      priority: 'high',
    },
    {
      id: 2,
      title: 'New Grading System Update',
      content:
        'The IT department has completed the update to our grading system. Please log in and verify that all your class data has been transferred correctly. If you encounter any issues, contact technical support immediately.',
      sender: 'IT Department',
      date: new Date(new Date().setDate(new Date().getDate() - 2)),
      read: true,
      type: 'announcement',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Parent-Teacher Conference Schedule',
      content:
        'The parent-teacher conferences will be held next week on Thursday and Friday. Please check your assigned schedule in the attached document and let me know if you need any adjustments by end of day tomorrow.',
      sender: 'Vice Principal Smith',
      date: new Date(new Date().setDate(new Date().getDate() - 3)),
      read: false,
      type: 'message',
      priority: 'medium',
    },
    {
      id: 4,
      title: 'Fire Drill Scheduled',
      content:
        'There will be a fire drill tomorrow at 10:15 AM. Please review the evacuation procedures with your students during your first period class.',
      sender: 'Safety Committee',
      date: new Date(new Date().setDate(new Date().getDate() - 4)),
      read: true,
      type: 'alert-msg',
      priority: 'high',
    },
    {
      id: 5,
      title: 'Professional Development Opportunity',
      content:
        'Registration is now open for the summer professional development workshop on "Integrating Technology in the Classroom". Space is limited, so please register by the end of the month if you are interested.',
      sender: 'Academic Affairs',
      date: new Date(new Date().setDate(new Date().getDate() - 5)),
      read: true,
      type: 'message',
      priority: 'low',
    },
    {
      id: 6,
      title: 'Classroom Supply Requests',
      content:
        'Please submit your classroom supply requests for the next semester by Friday. The form is available on the school portal under "Administrative Forms".',
      sender: 'Administrative Office',
      date: new Date(new Date().setDate(new Date().getDate() - 6)),
      read: false,
      type: 'message',
      priority: 'medium',
    },
    {
      id: 7,
      title: 'Sports Day Announcement',
      content:
        'The annual Sports Day will be held on Saturday, starting at 9:00 AM in the school grounds. All staff members are requested to guide their respective houses and ensure student participation.',
      sender: 'Sports Coordinator',
      date: new Date(new Date().setDate(new Date().getDate() - 7)),
      read: false,
      type: 'announcement',
      priority: 'high',
    },
    {
      id: 8,
      title: 'Library Book Return Reminder',
      content:
        'Teachers are kindly reminded to return any borrowed library books by the end of this week so the inventory can be updated for the new semester.',
      sender: 'Library Staff',
      date: new Date(new Date().setDate(new Date().getDate() - 8)),
      read: true,
      type: 'alert-msg',
      priority: 'low',
    },
  ];

  constructor() {}

  ngOnInit(): void {
    // Use default data if none is provided
    const messages = this.processedMessages();
    if (!messages || messages.length === 0) {
      // removed default assign
    }

    // Limit the number of messages displayed
    // removed slice assign
  }

  toggleMessageExpansion(messageId: number): void {
    if (this.expandedMessageId === messageId) {
      this.expandedMessageId = null;
    } else {
      this.expandedMessageId = messageId;
      this.markAsRead(messageId);
    }
  }

  markAsRead(messageId: number): void {
    const message = this.processedMessages().find((m) => m.id === messageId);
    if (message && !message.read) {
      message.read = true;
    }
  }

  markAllAsRead(): void {
    this.processedMessages().forEach((message) => {
      message.read = true;
    });
  }

  getUnreadCount(): number {
    return this.processedMessages().filter((message) => !message.read).length;
  }

  getMessageTypeIcon(type: string): string {
    switch (type) {
      case 'announcement':
        return 'campaign';
      case 'alert-msg':
        return 'error_outline';
      case 'message':
        return 'mail';
      default:
        return 'message';
    }
  }

  getMessageTypeClass(type: string): string {
    return type.toLowerCase();
  }

  getPriorityClass(priority: string | undefined): string {
    return priority ? priority.toLowerCase() : 'medium';
  }

  getFormattedDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffTime = today.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }
}
