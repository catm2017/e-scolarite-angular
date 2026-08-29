import { Component, Input, ChangeDetectionStrategy , input, computed} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { NgScrollbar } from 'ngx-scrollbar';

export interface ScheduleItem {
  day: string;
  classes: {
    subject: string;
    time: string;
    room: string;
    class: string;
    icon?: string;
    iconColor?: string;
  }[];
}

interface SubjectTheme {
  color: string;
  type: string;
  icon: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-class-schedule-card',
  templateUrl: './class-schedule-card.component.html',
  styleUrls: ['./class-schedule-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    NgScrollbar,
  ],
})
export class ClassScheduleCardComponent {
  readonly title = input('Weekly Class Schedule');
  readonly scheduleData = input<ScheduleItem[]>([]);
  readonly processedScheduleData = computed(() => {
    const data = this.scheduleData();
    return data && data.length > 0 ? data : this.defaultSchedule;
  });

  // Subject themes mapping
  private subjectThemes: { [key: string]: SubjectTheme } = {
    Mathematics: { color: '#4285F4', type: 'math', icon: 'calculate' },
    Physics: { color: '#EA4335', type: 'science', icon: 'science' },
    Chemistry: { color: '#FBBC05', type: 'science', icon: 'science' },
    Biology: { color: '#34A853', type: 'science', icon: 'biotech' },
    'English Literature': {
      color: '#8E24AA',
      type: 'language',
      icon: 'menu_book',
    },
    History: { color: '#795548', type: 'humanities', icon: 'history_edu' },
    Geography: { color: '#009688', type: 'humanities', icon: 'public' },
    'Computer Science': { color: '#3949AB', type: 'tech', icon: 'computer' },
    Art: { color: '#D81B60', type: 'arts', icon: 'palette' },
    'Physical Education': {
      color: '#F57C00',
      type: 'sports',
      icon: 'fitness_center',
    },
  };

  // Default schedule data if none is provided
  defaultSchedule: ScheduleItem[] = [
    {
      day: 'Monday',
      classes: [
        {
          subject: 'Mathematics',
          time: '08:30 - 09:30',
          room: 'Room 101',
          class: 'Grade 10A',
          icon: 'calculate',
          iconColor: 'primary',
        },
        {
          subject: 'Physics',
          time: '10:00 - 11:00',
          room: 'Room 203',
          class: 'Grade 11B',
          icon: 'science',
          iconColor: 'accent',
        },
        {
          subject: 'Computer Science',
          time: '13:00 - 14:30',
          room: 'Lab 3',
          class: 'Grade 12C',
          icon: 'computer',
          iconColor: 'warn',
        },
      ],
    },
    {
      day: 'Tuesday',
      classes: [
        {
          subject: 'Chemistry',
          time: '09:00 - 10:30',
          room: 'Lab 2',
          class: 'Grade 11A',
          icon: 'science',
          iconColor: 'primary',
        },
        {
          subject: 'English Literature',
          time: '11:00 - 12:00',
          room: 'Room 105',
          class: 'Grade 10B',
          icon: 'menu_book',
          iconColor: 'accent',
        },
      ],
    },
    {
      day: 'Wednesday',
      classes: [
        {
          subject: 'Mathematics',
          time: '08:30 - 09:30',
          room: 'Room 101',
          class: 'Grade 10A',
          icon: 'calculate',
          iconColor: 'primary',
        },
        {
          subject: 'Biology',
          time: '10:00 - 11:30',
          room: 'Lab 1',
          class: 'Grade 12A',
          icon: 'biotech',
          iconColor: 'warn',
        },
        {
          subject: 'History',
          time: '13:00 - 14:00',
          room: 'Room 202',
          class: 'Grade 11C',
          icon: 'history_edu',
          iconColor: 'accent',
        },
      ],
    },
    {
      day: 'Thursday',
      classes: [
        {
          subject: 'Physics',
          time: '09:00 - 10:30',
          room: 'Room 203',
          class: 'Grade 11B',
          icon: 'science',
          iconColor: 'accent',
        },
        {
          subject: 'Computer Science',
          time: '11:00 - 12:30',
          room: 'Lab 3',
          class: 'Grade 12C',
          icon: 'computer',
          iconColor: 'warn',
        },
      ],
    },
    {
      day: 'Friday',
      classes: [
        {
          subject: 'Chemistry',
          time: '08:30 - 10:00',
          room: 'Lab 2',
          class: 'Grade 11A',
          icon: 'science',
          iconColor: 'primary',
        },
        {
          subject: 'Mathematics',
          time: '10:30 - 11:30',
          room: 'Room 101',
          class: 'Grade 10A',
          icon: 'calculate',
          iconColor: 'primary',
        },
        {
          subject: 'English Literature',
          time: '13:00 - 14:00',
          room: 'Room 105',
          class: 'Grade 10B',
          icon: 'menu_book',
          iconColor: 'accent',
        },
      ],
    },
  ];

  // Days of the week mapping
  private daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  constructor() {}

  /**
   * Checks if the given day is today
   */
  isToday(day: string): boolean {
    const today = new Date();
    const dayIndex = this.daysOfWeek.indexOf(day);
    return today.getDay() === dayIndex;
  }

  /**
   * Gets the date for a specific day of the week
   */
  getDayDate(day: string): string {
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const targetDayIndex = this.daysOfWeek.indexOf(day);

    // Calculate the difference between the target day and current day
    let dayDiff = targetDayIndex - currentDayIndex;

    // If the difference is negative, it means the target day is in the next week
    if (dayDiff < 0) {
      dayDiff += 7;
    }

    // Create a new date by adding the difference
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayDiff);

    // Format the date as 'MMM DD' (e.g., 'Jun 15')
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Formats the time string for better display
   */
  formatTime(timeString: string): string {
    if (!timeString) return '';

    // Assuming format is 'HH:MM - HH:MM'
    const startTime = timeString.split(' - ')[0];

    // Convert to 12-hour format with AM/PM
    const [hours, minutes] = startTime.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${hour12}:${minutes} ${ampm}`;
  }

  /**
   * Calculates the duration of a class from its time string
   */
  calculateDuration(timeString: string): string {
    if (!timeString || !timeString.includes(' - ')) return '';

    const [startTime, endTime] = timeString.split(' - ');

    // Parse hours and minutes
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Calculate total minutes
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Calculate difference in minutes
    let durationMinutes = endTotalMinutes - startTotalMinutes;
    if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight classes

    // Convert to hours and minutes
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    // Format the output
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Gets the color for a subject based on the subject name
   */
  getSubjectColor(subject: string): string {
    return this.subjectThemes[subject]?.color || '#757575'; // Default gray if not found
  }

  /**
   * Gets the type/category of a subject for styling purposes
   */
  getSubjectType(subject: string): string {
    return this.subjectThemes[subject]?.type || 'default';
  }
}
