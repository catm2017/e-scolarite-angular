import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgScrollbar } from 'ngx-scrollbar';

interface TeacherActivity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'class' | 'meeting' | 'break' | 'office_hours' | 'other';
  description?: string;
}

interface Teacher {
  id: string;
  name: string;
  department: string;
  image: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-teacher-activity-tracker',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    FormsModule,
    MatDividerModule,
    MatTooltipModule,
    NgScrollbar
],
  templateUrl: './teacher-activity-tracker.component.html',
  styleUrls: ['./teacher-activity-tracker.component.scss'],
})
export class TeacherActivityTrackerComponent {
  // Time slots for the schedule
  timeSlots: string[] = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  // Selected teacher and day
  selectedTeacher: string = 'teacher1';
  selectedDay: string = 'monday';

  // Available teachers
  teachers: Teacher[] = [
    {
      id: 'teacher1',
      name: 'John Smith',
      department: 'Mathematics',
      image: 'assets/images/user/user1.jpg',
    },
    {
      id: 'teacher2',
      name: 'Emily Johnson',
      department: 'Science',
      image: 'assets/images/user/user2.jpg',
    },
    {
      id: 'teacher3',
      name: 'Michael Brown',
      department: 'English',
      image: 'assets/images/user/user3.jpg',
    },
    {
      id: 'teacher4',
      name: 'Sarah Wilson',
      department: 'History',
      image: 'assets/images/user/user4.jpg',
    },
  ];

  // Available days
  days: { id: string; name: string }[] = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
  ];

  // Teacher activities
  activities: { [teacherId: string]: { [day: string]: TeacherActivity[] } } = {
    teacher1: {
      monday: [
        {
          id: 'act1',
          title: 'Algebra I',
          startTime: '08:00',
          endTime: '09:30',
          location: 'Room 101',
          type: 'class',
        },
        {
          id: 'act2',
          title: 'Department Meeting',
          startTime: '10:00',
          endTime: '11:00',
          location: 'Conference Room',
          type: 'meeting',
        },
        {
          id: 'act3',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act4',
          title: 'Calculus II',
          startTime: '13:30',
          endTime: '15:00',
          location: 'Room 105',
          type: 'class',
        },
        {
          id: 'act5',
          title: 'Office Hours',
          startTime: '15:30',
          endTime: '17:00',
          location: 'Office 203',
          type: 'office_hours',
        },
      ],
      tuesday: [
        {
          id: 'act6',
          title: 'Geometry',
          startTime: '09:00',
          endTime: '10:30',
          location: 'Room 102',
          type: 'class',
        },
        {
          id: 'act7',
          title: 'Student Consultation',
          startTime: '11:00',
          endTime: '12:00',
          location: 'Office 203',
          type: 'office_hours',
        },
        {
          id: 'act8',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act9',
          title: 'Algebra II',
          startTime: '14:00',
          endTime: '15:30',
          location: 'Room 103',
          type: 'class',
        },
      ],
      wednesday: [
        {
          id: 'act10',
          title: 'Faculty Meeting',
          startTime: '08:30',
          endTime: '09:30',
          location: 'Main Hall',
          type: 'meeting',
        },
        {
          id: 'act11',
          title: 'Calculus I',
          startTime: '10:00',
          endTime: '11:30',
          location: 'Room 105',
          type: 'class',
        },
        {
          id: 'act12',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act13',
          title: 'Statistics',
          startTime: '13:30',
          endTime: '15:00',
          location: 'Room 104',
          type: 'class',
        },
        {
          id: 'act14',
          title: 'Curriculum Planning',
          startTime: '15:30',
          endTime: '16:30',
          location: 'Conference Room',
          type: 'meeting',
        },
      ],
      thursday: [
        {
          id: 'act15',
          title: 'Algebra I',
          startTime: '08:00',
          endTime: '09:30',
          location: 'Room 101',
          type: 'class',
        },
        {
          id: 'act16',
          title: 'Office Hours',
          startTime: '10:00',
          endTime: '11:30',
          location: 'Office 203',
          type: 'office_hours',
        },
        {
          id: 'act17',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act18',
          title: 'Calculus II',
          startTime: '13:30',
          endTime: '15:00',
          location: 'Room 105',
          type: 'class',
        },
      ],
      friday: [
        {
          id: 'act19',
          title: 'Department Meeting',
          startTime: '09:00',
          endTime: '10:00',
          location: 'Conference Room',
          type: 'meeting',
        },
        {
          id: 'act20',
          title: 'Geometry',
          startTime: '10:30',
          endTime: '12:00',
          location: 'Room 102',
          type: 'class',
        },
        {
          id: 'act21',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act22',
          title: 'Office Hours',
          startTime: '13:30',
          endTime: '15:00',
          location: 'Office 203',
          type: 'office_hours',
        },
        {
          id: 'act23',
          title: 'Faculty Social',
          startTime: '15:30',
          endTime: '17:00',
          location: 'Staff Lounge',
          type: 'other',
        },
      ],
    },
    teacher2: {
      monday: [
        {
          id: 'act24',
          title: 'Biology I',
          startTime: '08:00',
          endTime: '09:30',
          location: 'Lab 201',
          type: 'class',
        },
        {
          id: 'act25',
          title: 'Lab Preparation',
          startTime: '10:00',
          endTime: '11:00',
          location: 'Lab 201',
          type: 'other',
        },
        {
          id: 'act26',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act27',
          title: 'Chemistry II',
          startTime: '13:30',
          endTime: '15:00',
          location: 'Lab 202',
          type: 'class',
        },
        {
          id: 'act28',
          title: 'Office Hours',
          startTime: '15:30',
          endTime: '17:00',
          location: 'Office 205',
          type: 'office_hours',
        },
      ],
      tuesday: [
        {
          id: 'act29',
          title: 'Department Meeting',
          startTime: '08:30',
          endTime: '09:30',
          location: 'Conference Room',
          type: 'meeting',
        },
        {
          id: 'act30',
          title: 'Physics I',
          startTime: '10:00',
          endTime: '11:30',
          location: 'Lab 203',
          type: 'class',
        },
        {
          id: 'act31',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act32',
          title: 'Biology II',
          startTime: '13:30',
          endTime: '15:00',
          location: 'Lab 201',
          type: 'class',
        },
      ],
      wednesday: [
        {
          id: 'act33',
          title: 'Chemistry I',
          startTime: '09:00',
          endTime: '10:30',
          location: 'Lab 202',
          type: 'class',
        },
        {
          id: 'act34',
          title: 'Student Consultation',
          startTime: '11:00',
          endTime: '12:00',
          location: 'Office 205',
          type: 'office_hours',
        },
        {
          id: 'act35',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act36',
          title: 'Research Work',
          startTime: '13:30',
          endTime: '15:30',
          location: 'Research Lab',
          type: 'other',
        },
        {
          id: 'act37',
          title: 'Science Club',
          startTime: '16:00',
          endTime: '17:00',
          location: 'Lab 204',
          type: 'other',
        },
      ],
      thursday: [
        {
          id: 'act38',
          title: 'Biology I',
          startTime: '08:00',
          endTime: '09:30',
          location: 'Lab 201',
          type: 'class',
        },
        {
          id: 'act39',
          title: 'Faculty Meeting',
          startTime: '10:00',
          endTime: '11:00',
          location: 'Main Hall',
          type: 'meeting',
        },
        {
          id: 'act40',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act41',
          title: 'Chemistry II',
          startTime: '13:30',
          endTime: '15:00',
          location: 'Lab 202',
          type: 'class',
        },
        {
          id: 'act42',
          title: 'Office Hours',
          startTime: '15:30',
          endTime: '16:30',
          location: 'Office 205',
          type: 'office_hours',
        },
      ],
      friday: [
        {
          id: 'act43',
          title: 'Physics I',
          startTime: '09:00',
          endTime: '10:30',
          location: 'Lab 203',
          type: 'class',
        },
        {
          id: 'act44',
          title: 'Lab Preparation',
          startTime: '11:00',
          endTime: '12:00',
          location: 'Lab 203',
          type: 'other',
        },
        {
          id: 'act45',
          title: 'Lunch Break',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Cafeteria',
          type: 'break',
        },
        {
          id: 'act46',
          title: 'Department Meeting',
          startTime: '13:30',
          endTime: '14:30',
          location: 'Conference Room',
          type: 'meeting',
        },
        {
          id: 'act47',
          title: 'Biology II',
          startTime: '15:00',
          endTime: '16:30',
          location: 'Lab 201',
          type: 'class',
        },
      ],
    },
  };

  // Initialize with activities for other teachers
  constructor() {
    // Clone activities from teacher1 to teacher3 and teacher4 with slight modifications
    this.activities['teacher3'] = JSON.parse(
      JSON.stringify(this.activities['teacher1'])
    );
    this.activities['teacher4'] = JSON.parse(
      JSON.stringify(this.activities['teacher2'])
    );

    // Modify some activities for teacher3 and teacher4 to make them different
    this.activities['teacher3']['monday'][0].title = 'English Literature';
    this.activities['teacher3']['monday'][0].location = 'Room 301';
    this.activities['teacher3']['monday'][3].title = 'Creative Writing';
    this.activities['teacher3']['monday'][3].location = 'Room 302';

    this.activities['teacher4']['monday'][0].title = 'World History';
    this.activities['teacher4']['monday'][0].location = 'Room 401';
    this.activities['teacher4']['monday'][3].title = 'American History';
    this.activities['teacher4']['monday'][3].location = 'Room 402';
  }

  // Get current activities based on selected teacher and day
  get currentActivities(): TeacherActivity[] {
    if (
      this.activities[this.selectedTeacher] &&
      this.activities[this.selectedTeacher][this.selectedDay]
    ) {
      return this.activities[this.selectedTeacher][this.selectedDay];
    }
    return [];
  }

  // Get selected teacher object
  get currentTeacher(): Teacher | undefined {
    return this.teachers.find((t) => t.id === this.selectedTeacher);
  }

  // Get activity at a specific time slot
  getActivityAtTime(timeSlot: string): TeacherActivity | null {
    const hour = parseInt(timeSlot.split(':')[0]);

    return (
      this.currentActivities.find((activity) => {
        const startHour = parseInt(activity.startTime.split(':')[0]);
        const endHour = parseInt(activity.endTime.split(':')[0]);

        // Check if the time slot falls within the activity's time range
        return hour >= startHour && hour < endHour;
      }) || null
    );
  }

  // Get activity duration in hours
  getActivityDuration(activity: TeacherActivity): number {
    const startHour = parseInt(activity.startTime.split(':')[0]);
    const startMinute = parseInt(activity.startTime.split(':')[1]) / 60;
    const endHour = parseInt(activity.endTime.split(':')[0]);
    const endMinute = parseInt(activity.endTime.split(':')[1]) / 60;

    return endHour + endMinute - (startHour + startMinute);
  }

  // Get activity position in the timeline
  getActivityPosition(activity: TeacherActivity): number {
    const startHour = parseInt(activity.startTime.split(':')[0]);
    const startMinute = parseInt(activity.startTime.split(':')[1]) / 60;
    const firstHour = parseInt(this.timeSlots[0].split(':')[0]);

    return startHour + startMinute - firstHour;
  }

  // Get activity width percentage based on duration
  getActivityWidth(activity: TeacherActivity): string {
    const duration = this.getActivityDuration(activity);
    const totalHours = this.timeSlots.length;

    return `${(duration / totalHours) * 100}%`;
  }

  // Get activity left position percentage based on start time
  getActivityLeft(activity: TeacherActivity): string {
    const position = this.getActivityPosition(activity);
    const totalHours = this.timeSlots.length;

    return `${(position / totalHours) * 100}%`;
  }

  // Get activity color based on type
  getActivityColor(type: string): string {
    switch (type) {
      case 'class':
        return '#4CAF50'; // Green
      case 'meeting':
        return '#2196F3'; // Blue
      case 'break':
        return '#FF9800'; // Orange
      case 'office_hours':
        return '#9C27B0'; // Purple
      case 'other':
        return '#607D8B'; // Blue Grey
      default:
        return '#757575'; // Grey
    }
  }

  // Get activity icon based on type
  getActivityIcon(type: string): string {
    switch (type) {
      case 'class':
        return 'school';
      case 'meeting':
        return 'groups';
      case 'break':
        return 'restaurant';
      case 'office_hours':
        return 'support_agent';
      case 'other':
        return 'event';
      default:
        return 'event';
    }
  }

  getSelectedDayName(): string {
    const day = this.days.find((d) => d.id === this.selectedDay);
    return day ? day.name : '';
  }
}
