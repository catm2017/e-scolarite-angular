import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgScrollbar } from 'ngx-scrollbar';

interface PtaMeeting {
  id: number;
  grade: string;
  dateDay: string;
  dateMonth: string;
  time: string;
  agenda: string;
  coordinator: string;
  rsvpCount: number;
  location: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-upcoming-pta-meetings',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, NgScrollbar],
  templateUrl: './upcoming-pta-meetings.component.html',
  styleUrls: ['./upcoming-pta-meetings.component.scss']
})
export class UpcomingPtaMeetingsComponent {
  meetings: PtaMeeting[] = [
    {
      id: 1,
      grade: 'Grade 10 & 11 General',
      dateDay: '24',
      dateMonth: 'MAY',
      time: '04:00 PM',
      agenda: 'Discussing final board exam preparations and career counseling pathways.',
      coordinator: 'Mrs. Emily Davis',
      rsvpCount: 145,
      location: 'School Main Auditorium'
    },
    {
      id: 2,
      grade: 'Grade 9 - All Sections',
      dateDay: '28',
      dateMonth: 'MAY',
      time: '02:30 PM',
      agenda: 'Curriculum update, disciplinary guidelines, and upcoming science fair projects.',
      coordinator: 'Mr. David Wilson',
      rsvpCount: 98,
      location: 'Seminar Hall B'
    },
    {
      id: 3,
      grade: 'Primary Grade 1 - 5',
      dateDay: '02',
      dateMonth: 'JUN',
      time: '10:00 AM',
      agenda: 'Focusing on early child development, reading programs, and physical activity guidelines.',
      coordinator: 'Miss Clara Oswald',
      rsvpCount: 220,
      location: 'School Gymnasium'
    },
    {
      id: 4,
      grade: 'Grade 12 Graduation Meet',
      dateDay: '05',
      dateMonth: 'JUN',
      time: '11:00 AM',
      agenda: 'Discussing the graduation ceremony, college admission support, and parent invitations.',
      coordinator: 'Dr. Sarah Jenkins',
      rsvpCount: 180,
      location: 'Main Conference Hall'
    },
    {
      id: 5,
      grade: 'Kindergarten Orientation',
      dateDay: '10',
      dateMonth: 'JUN',
      time: '09:30 AM',
      agenda: 'Welcoming new preschool parents, introduction to early curriculum, and school tours.',
      coordinator: 'Mrs. Lisa Adams',
      rsvpCount: 85,
      location: 'Activity Room A'
    },
    {
      id: 6,
      grade: 'Middle School (Grade 6-8)',
      dateDay: '15',
      dateMonth: 'JUN',
      time: '03:00 PM',
      agenda: 'Parent-teacher discussions on sports schedule, extracurricular options, and mid-term assessments.',
      coordinator: 'Mr. Robert Taylor',
      rsvpCount: 160,
      location: 'Seminar Hall A'
    }
  ];

  rsvpMeeting(meetingId: number) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (meeting) {
      meeting.rsvpCount++;
    }
  }
}
