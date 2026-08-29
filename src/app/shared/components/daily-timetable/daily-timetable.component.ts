import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { NgScrollbar } from 'ngx-scrollbar';

interface TimeSlot {
  id: number;
  subject: string;
  time: string;
  duration: string;
  room: string;
  teacher: string;
  color: string;
}

interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-daily-timetable',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    NgScrollbar,
  ],
  templateUrl: './daily-timetable.component.html',
  styleUrls: ['./daily-timetable.component.scss'],
})
export class DailyTimetableComponent implements OnInit {
  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  selectedDay: string = '';
  currentDayIndex: number = 0;

  schedule: DaySchedule[] = [
    {
      day: 'Monday',
      slots: [
        {
          id: 1,
          subject: 'Mathematics',
          time: '08:30 AM',
          duration: '1h 30m',
          room: 'Room 101',
          teacher: 'Dr. Robert Smith',
          color: 'primary-light',
        },
        {
          id: 2,
          subject: 'Physics',
          time: '10:15 AM',
          duration: '1h 30m',
          room: 'Lab 3',
          teacher: 'Prof. Maria Johnson',
          color: 'accent-light',
        },
        {
          id: 3,
          subject: 'Lunch Break',
          time: '12:00 PM',
          duration: '45m',
          room: 'Cafeteria',
          teacher: '',
          color: 'grey-light',
        },
        {
          id: 4,
          subject: 'English Literature',
          time: '01:00 PM',
          duration: '1h 30m',
          room: 'Room 205',
          teacher: 'Dr. James Wilson',
          color: 'warn-light',
        },
      ],
    },
    {
      day: 'Tuesday',
      slots: [
        {
          id: 5,
          subject: 'Computer Science',
          time: '09:00 AM',
          duration: '1h 30m',
          room: 'Lab 1',
          teacher: 'Prof. Emily Chen',
          color: 'success-light',
        },
        {
          id: 6,
          subject: 'History',
          time: '10:45 AM',
          duration: '1h 30m',
          room: 'Room 302',
          teacher: 'Dr. Michael Brown',
          color: 'primary-light',
        },
        {
          id: 7,
          subject: 'Lunch Break',
          time: '12:15 PM',
          duration: '45m',
          room: 'Cafeteria',
          teacher: '',
          color: 'grey-light',
        },
        {
          id: 8,
          subject: 'Physical Education',
          time: '01:15 PM',
          duration: '1h 30m',
          room: 'Gymnasium',
          teacher: 'Coach Sarah Davis',
          color: 'accent-light',
        },
      ],
    },
    {
      day: 'Wednesday',
      slots: [
        {
          id: 9,
          subject: 'Chemistry',
          time: '08:30 AM',
          duration: '1h 30m',
          room: 'Lab 2',
          teacher: 'Dr. Lisa Taylor',
          color: 'warn-light',
        },
        {
          id: 10,
          subject: 'Art',
          time: '10:15 AM',
          duration: '1h 30m',
          room: 'Art Studio',
          teacher: 'Ms. Jennifer Adams',
          color: 'success-light',
        },
        {
          id: 11,
          subject: 'Lunch Break',
          time: '12:00 PM',
          duration: '45m',
          room: 'Cafeteria',
          teacher: '',
          color: 'grey-light',
        },
        {
          id: 12,
          subject: 'Mathematics',
          time: '01:00 PM',
          duration: '1h 30m',
          room: 'Room 101',
          teacher: 'Dr. Robert Smith',
          color: 'primary-light',
        },
      ],
    },
    {
      day: 'Thursday',
      slots: [
        {
          id: 13,
          subject: 'Biology',
          time: '09:00 AM',
          duration: '1h 30m',
          room: 'Lab 4',
          teacher: 'Dr. Thomas Wilson',
          color: 'accent-light',
        },
        {
          id: 14,
          subject: 'Foreign Language',
          time: '10:45 AM',
          duration: '1h 30m',
          room: 'Room 203',
          teacher: 'Ms. Sofia Rodriguez',
          color: 'primary-light',
        },
        {
          id: 15,
          subject: 'Lunch Break',
          time: '12:15 PM',
          duration: '45m',
          room: 'Cafeteria',
          teacher: '',
          color: 'grey-light',
        },
        {
          id: 16,
          subject: 'Music',
          time: '01:15 PM',
          duration: '1h 30m',
          room: 'Music Hall',
          teacher: 'Mr. David Lee',
          color: 'warn-light',
        },
      ],
    },
    {
      day: 'Friday',
      slots: [
        {
          id: 17,
          subject: 'Physics',
          time: '08:30 AM',
          duration: '1h 30m',
          room: 'Lab 3',
          teacher: 'Prof. Maria Johnson',
          color: 'success-light',
        },
        {
          id: 18,
          subject: 'English Literature',
          time: '10:15 AM',
          duration: '1h 30m',
          room: 'Room 205',
          teacher: 'Dr. James Wilson',
          color: 'primary-light',
        },
        {
          id: 19,
          subject: 'Lunch Break',
          time: '12:00 PM',
          duration: '45m',
          room: 'Cafeteria',
          teacher: '',
          color: 'grey-light',
        },
        {
          id: 20,
          subject: 'Study Hall',
          time: '01:00 PM',
          duration: '1h 30m',
          room: 'Library',
          teacher: 'Ms. Karen White',
          color: 'accent-light',
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.setCurrentDay();
  }

  setCurrentDay(): void {
    const today = new Date().getDay();
    // Convert from Sunday=0 to Monday=0 format
    this.currentDayIndex = today === 0 ? 4 : today - 1;
    if (this.currentDayIndex >= 0 && this.currentDayIndex < this.weekdays.length) {
      this.selectedDay = this.weekdays[this.currentDayIndex];
    } else {
      this.selectedDay = this.weekdays[0]; // Default to Monday if outside school days
    }
  }

  getScheduleForDay(day: string): TimeSlot[] {
    const daySchedule = this.schedule.find(s => s.day === day);
    return daySchedule ? daySchedule.slots : [];
  }

  isCurrentTimeSlot(slot: TimeSlot): boolean {
    const now = new Date();
    const [hourStr, minuteStr] = slot.time.split(':');
    const isPM = slot.time.includes('PM');
    
    let hour = parseInt(hourStr, 10);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    
    const minute = parseInt(minuteStr.split(' ')[0], 10);
    
    const slotTime = new Date();
    slotTime.setHours(hour, minute, 0, 0);
    
    // Parse duration (e.g., "1h 30m")
    const durationParts = slot.duration.split(' ');
    let durationMinutes = 0;
    
    for (const part of durationParts) {
      if (part.includes('h')) {
        durationMinutes += parseInt(part, 10) * 60;
      } else if (part.includes('m')) {
        durationMinutes += parseInt(part, 10);
      }
    }
    
    const endTime = new Date(slotTime.getTime() + durationMinutes * 60000);
    
    return now >= slotTime && now <= endTime;
  }
}