import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { NgScrollbarModule } from 'ngx-scrollbar';

export interface EnhancedEvent {
  day: string;
  date: string;
  month: string;
  title: string;
  time: string;
  status: string;
  type: string; // 'exam', 'holiday', 'meeting', 'activity'
  description?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-enhanced-events-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatBadgeModule,
    NgScrollbarModule,
  ],
  templateUrl: './enhanced-events-card.component.html',
  styleUrls: ['./enhanced-events-card.component.scss'],
})
export class EnhancedEventsCardComponent {
  readonly events = input.required<EnhancedEvent[]>();
  readonly maxEvents = input<number>(5);
  readonly showViewMore = input<boolean>(true);

  selectedType: string = 'all';
  selectedDate: string = 'upcoming';

  // Event type options
  eventTypes = [
    { value: 'all', viewValue: 'All Events' },
    { value: 'exam', viewValue: 'Exams' },
    { value: 'holiday', viewValue: 'Holidays' },
    { value: 'meeting', viewValue: 'Meetings' },
    { value: 'activity', viewValue: 'Activities' },
  ];

  // Date filter options
  dateFilters = [
    { value: 'upcoming', viewValue: 'Upcoming' },
    { value: 'this-week', viewValue: 'This Week' },
    { value: 'this-month', viewValue: 'This Month' },
    { value: 'next-month', viewValue: 'Next Month' },
  ];

  // Get filtered events based on selected type and date
  get filteredEvents(): EnhancedEvent[] {
    let filtered = this.events();

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter((event) => event.type === this.selectedType);
    }

    // Filter by date (simplified for demo)
    // In a real app, you would use actual date comparisons
    if (this.selectedDate === 'this-week') {
      filtered = filtered.filter((_, index) => index < 7); // First 7 events as this week
    } else if (this.selectedDate === 'this-month') {
      filtered = filtered.filter((_, index) => index < 15); // First 15 events as this month
    } else if (this.selectedDate === 'next-month') {
      filtered = filtered.filter((_, index) => index >= 15); // Remaining events as next month
    }

    // Limit to maxEvents
    return filtered.slice(0, this.maxEvents());
  }

  // Get icon for event type
  getEventIcon(type: string): string {
    switch (type) {
      case 'exam':
        return 'assignment';
      case 'holiday':
        return 'celebration';
      case 'meeting':
        return 'groups';
      case 'activity':
        return 'emoji_events';
      default:
        return 'event';
    }
  }
}
