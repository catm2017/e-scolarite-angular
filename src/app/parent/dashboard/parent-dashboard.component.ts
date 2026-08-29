import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { NgScrollbar } from 'ngx-scrollbar';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexStroke,
  ApexFill,
  ApexGrid,
  ApexTooltip,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexResponsive,
} from 'ng-apexcharts';

export type AttendanceChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  responsive: ApexResponsive[];
};

export type PerformanceChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  fill: ApexFill;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  colors: string[];
  dataLabels: ApexDataLabels;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parent-dashboard',
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    RouterLink,
    BreadcrumbComponent,
    NgApexchartsModule,
    NgScrollbar,
  ],
})
export class ParentDashboardComponent implements OnInit {
  breadscrums = [
    {
      title: 'Parent Portal',
      items: [],
      active: 'Dashboard',
    },
  ];

  // Signal-based state
  selectedChild = signal(0);
  activeTab = signal(0);

  children = signal([
    {
      id: 1,
      name: 'Emma Parker',
      class: 'Grade 8 - Section A',
      rollNo: 'STU2024001',
      avatar: 'assets/images/user/user1.jpg',
      attendancePercent: 94,
      gpa: 3.8,
      feesDue: 2500,
      nextExam: 'Science — Jun 5',
    },
    {
      id: 2,
      name: 'Liam Parker',
      class: 'Grade 5 - Section B',
      rollNo: 'STU2024022',
      avatar: 'assets/images/user/user2.jpg',
      attendancePercent: 88,
      gpa: 3.4,
      feesDue: 0,
      nextExam: 'Math — Jun 3',
    },
  ]);

  currentChild = computed(() => this.children()[this.selectedChild()]);

  // Stats cards
  statsCards = computed(() => [
    {
      title: 'Attendance',
      value: `${this.currentChild().attendancePercent}%`,
      icon: 'how_to_reg',
      color: 'stat-green',
      trend: '+2% this month',
      trendUp: true,
    },
    {
      title: 'Current GPA',
      value: `${this.currentChild().gpa}`,
      icon: 'grade',
      color: 'stat-blue',
      trend: 'Top 15% of class',
      trendUp: true,
    },
    {
      title: 'Fees Due',
      value:
        this.currentChild().feesDue > 0
          ? `₹${this.currentChild().feesDue}`
          : 'Paid',
      icon: 'account_balance_wallet',
      color: this.currentChild().feesDue > 0 ? 'stat-red' : 'stat-green',
      trend: this.currentChild().feesDue > 0 ? 'Payment overdue' : 'All clear',
      trendUp: this.currentChild().feesDue === 0,
    },
    {
      title: 'Next Exam',
      value: this.currentChild().nextExam,
      icon: 'event_note',
      color: 'stat-orange',
      trend: 'In 5 days',
      trendUp: false,
    },
  ]);

  // Attendance chart
  public attendanceChartOptions!: Partial<AttendanceChartOptions>;

  // Subject performance chart
  public performanceChartOptions!: Partial<PerformanceChartOptions>;

  // Recent grades
  recentGrades = [
    {
      subject: 'Mathematics',
      test: 'Unit Test 3',
      score: 92,
      maxScore: 100,
      grade: 'A',
      date: '24 May 2026',
      status: 'excellent',
    },
    {
      subject: 'Science',
      test: 'Lab Assessment',
      score: 87,
      maxScore: 100,
      grade: 'B+',
      date: '20 May 2026',
      status: 'good',
    },
    {
      subject: 'English',
      test: 'Essay Writing',
      score: 78,
      maxScore: 100,
      grade: 'B',
      date: '18 May 2026',
      status: 'average',
    },
    {
      subject: 'History',
      test: 'Chapter Test',
      score: 95,
      maxScore: 100,
      grade: 'A+',
      date: '15 May 2026',
      status: 'excellent',
    },
    {
      subject: 'Computer',
      test: 'Practical Exam',
      score: 98,
      maxScore: 100,
      grade: 'A+',
      date: '10 May 2026',
      status: 'excellent',
    },
    {
      subject: 'Geography',
      test: 'Map Quiz',
      score: 82,
      maxScore: 100,
      grade: 'B+',
      date: '08 May 2026',
      status: 'good',
    },
    {
      subject: 'Physical Education',
      test: 'Fitness Test',
      score: 90,
      maxScore: 100,
      grade: 'A',
      date: '05 May 2026',
      status: 'excellent',
    },
    {
      subject: 'Art',
      test: 'Portfolio Submission',
      score: 88,
      maxScore: 100,
      grade: 'B+',
      date: '02 May 2026',
      status: 'good',
    },
    {
      subject: 'Music',
      test: 'Theory Exam',
      score: 75,
      maxScore: 100,
      grade: 'B',
      date: '28 Apr 2026',
      status: 'average',
    },
  ];

  // Today's timetable
  todayTimetable = [
    {
      time: '8:00 AM',
      subject: 'Mathematics',
      teacher: 'Mr. Raj Sharma',
      room: '201',
      status: 'completed',
    },
    {
      time: '9:00 AM',
      subject: 'Science',
      teacher: 'Ms. Priya Patel',
      room: 'Lab 1',
      status: 'completed',
    },
    {
      time: '10:00 AM',
      subject: 'English',
      teacher: 'Ms. Sarah Lee',
      room: '203',
      status: 'ongoing',
    },
    {
      time: '11:00 AM',
      subject: 'History',
      teacher: 'Mr. Anil Kumar',
      room: '205',
      status: 'upcoming',
    },
    {
      time: '12:00 PM',
      subject: 'Lunch Break',
      teacher: '',
      room: 'Cafeteria',
      status: 'break',
    },
    {
      time: '1:00 PM',
      subject: 'Computer',
      teacher: 'Mr. David Roy',
      room: 'Lab 2',
      status: 'upcoming',
    },
    {
      time: '2:00 PM',
      subject: 'Physical Education',
      teacher: 'Mr. Sanjay Nair',
      room: 'Ground',
      status: 'upcoming',
    },
  ];

  // Notifications
  notifications = signal([
    {
      id: 1,
      icon: 'notifications',
      type: 'notice',
      message: 'Parent-Teacher Meeting scheduled on June 10 at 10:00 AM',
      time: '2h ago',
      read: false,
    },
    {
      id: 2,
      icon: 'assignment_late',
      type: 'homework',
      message: 'Emma has a Science assignment due tomorrow',
      time: '4h ago',
      read: false,
    },
    {
      id: 3,
      icon: 'local_atm',
      type: 'fee',
      message: 'Term 2 fee payment reminder — ₹2,500 due by June 30',
      time: '1d ago',
      read: true,
    },
    {
      id: 4,
      icon: 'event',
      type: 'event',
      message: 'Annual Sports Day on June 15 — Participation form required',
      time: '2d ago',
      read: true,
    },
    {
      id: 5,
      icon: 'sick',
      type: 'health',
      message: 'Health checkup camp on June 8 for all students',
      time: '3d ago',
      read: true,
    },
  ]);

  unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  // Upcoming events
  upcomingEvents = [
    {
      date: 3,
      month: 'JUN',
      title: 'Math Exam',
      type: 'exam',
      color: 'event-exam',
    },
    {
      date: 5,
      month: 'JUN',
      title: 'Science Exam',
      type: 'exam',
      color: 'event-exam',
    },
    {
      date: 10,
      month: 'JUN',
      title: 'PTM Meeting',
      type: 'meeting',
      color: 'event-meeting',
    },
    {
      date: 15,
      month: 'JUN',
      title: 'Sports Day',
      type: 'event',
      color: 'event-sports',
    },
    {
      date: 30,
      month: 'JUN',
      title: 'Fee Due Date',
      type: 'fee',
      color: 'event-fee',
    },
  ];

  // Homework pending
  homeworkList = [
    {
      subject: 'Mathematics',
      task: 'Chapter 7 Exercises — Quadratic Equations',
      dueDate: 'Tomorrow',
      priority: 'high',
    },
    {
      subject: 'English',
      task: 'Write a 500-word essay on Environmental Awareness',
      dueDate: 'Jun 3',
      priority: 'medium',
    },
    {
      subject: 'Science',
      task: 'Complete lab report for Experiment #4',
      dueDate: 'Jun 5',
      priority: 'medium',
    },
    {
      subject: 'History',
      task: 'Read Chapter 12 and answer review questions',
      dueDate: 'Jun 7',
      priority: 'low',
    },
  ];

  // Teacher messages
  teacherMessages = [
    {
      teacher: 'Mr. Raj Sharma',
      subject: 'Mathematics',
      message: 'Emma has shown great improvement in algebra this week!',
      time: '1h ago',
      avatar: 'assets/images/user/user3.jpg',
      unread: true,
    },
    {
      teacher: 'Ms. Priya Patel',
      subject: 'Science',
      message: 'Please ensure Emma submits her lab report by Friday.',
      time: 'Yesterday',
      avatar: 'assets/images/user/user4.jpg',
      unread: false,
    },
    {
      teacher: 'Ms. Sarah Lee',
      subject: 'English',
      message:
        "Emma's essay was creative. We discussed some areas for improvement.",
      time: '2 days ago',
      avatar: 'assets/images/user/user5.jpg',
      unread: false,
    },
    {
      teacher: 'Mr. David Roy',
      subject: 'Computer Science',
      message: 'Excellent performance in the programming assignment!',
      time: '3 days ago',
      avatar: 'assets/images/user/user2.jpg',
      unread: false,
    },
    {
      teacher: 'Mrs. Anita Desai',
      subject: 'Social Studies',
      message: 'Don\'t forget the history project is due next Monday.',
      time: 'Last Week',
      avatar: 'assets/images/user/user1.jpg',
      unread: false,
    },
    {
      teacher: 'Mr. Sanjay Nair',
      subject: 'Physical Education',
      message: 'Sports day practice starts at 4 PM tomorrow. Bring your gear.',
      time: 'Last Week',
      avatar: 'assets/images/user/user6.jpg',
      unread: false,
    },
  ];

  // Fee Status
  feeStatus = {
    totalDue: 4500,
    dueDate: '15 Jun 2026',
    status: 'pending',
    lastPaid: '15 Mar 2026',
    lastPaidAmount: 4500,
  };

  // Transport Details
  transportDetails = {
    route: 'Route 4A - Downtown',
    busNo: 'MH-12-AB-1234',
    driverName: 'Ramesh Singh',
    driverPhone: '+91 98765 43210',
    pickupTime: '07:15 AM',
    dropTime: '03:45 PM',
  };

  // Library Books
  libraryBooks = [
    { title: 'The Universe in a Nutshell', issueDate: '10 May 2026', dueDate: '24 May 2026', status: 'overdue' },
    { title: 'Advanced Mathematics', issueDate: '20 May 2026', dueDate: '03 Jun 2026', status: 'issued' },
    { title: 'Introduction to Algorithms', issueDate: '21 May 2026', dueDate: '04 Jun 2026', status: 'issued' },
    { title: 'World History Vol 2', issueDate: '15 Apr 2026', dueDate: '30 Apr 2026', status: 'overdue' },
    { title: 'The Great Gatsby', issueDate: '25 May 2026', dueDate: '10 Jun 2026', status: 'issued' },
  ];

  // Behavioral Remarks
  behavioralRemarks = [
    { date: '25 May 2026', teacher: 'Mr. Raj Sharma', remark: 'Excellent problem-solving skills in class today.', type: 'positive' },
    { date: '18 May 2026', teacher: 'Ms. Priya Patel', remark: 'Needs to focus more during lab sessions.', type: 'warning' },
    { date: '10 May 2026', teacher: 'Mr. David Roy', remark: 'Outstanding presentation on the solar system.', type: 'positive' },
    { date: '02 May 2026', teacher: 'Mrs. Anita Desai', remark: 'Frequently talking with peers during the lecture.', type: 'warning' },
    { date: '20 Apr 2026', teacher: 'Mr. Sanjay Nair', remark: 'Showed great leadership during team sports.', type: 'positive' },
  ];

  ngOnInit() {
    this.buildAttendanceChart();
    this.buildPerformanceChart();
  }

  selectChild(index: number) {
    this.selectedChild.set(index);
    this.buildAttendanceChart();
    this.buildPerformanceChart();
  }

  markAllRead() {
    this.notifications.update((notifs) =>
      notifs.map((n) => ({ ...n, read: true })),
    );
  }

  private buildAttendanceChart() {
    const child = this.currentChild();
    const absent = 100 - child.attendancePercent;
    this.attendanceChartOptions = {
      series: [child.attendancePercent, absent],
      chart: {
        type: 'donut',
        height: 250,
      },
      labels: ['Present', 'Absent'],
      colors: ['#10b981', '#f43f5e'],
      legend: {
        show: true,
        position: 'bottom',
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(0)}%`,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' },
          },
        },
      ],
    };
  }

  private buildPerformanceChart() {
    this.performanceChartOptions = {
      series: [
        {
          name: 'Score',
          data: [92, 87, 78, 95, 98, 85],
        },
      ],
      chart: {
        type: 'area',
        height: 250,
        foreColor: '#9aa0ac',
        toolbar: { show: false },
        sparkline: { enabled: false },
      },
      colors: ['#8b5cf6'],
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      xaxis: {
        categories: [
          'Math',
          'Science',
          'English',
          'History',
          'Computer',
          'Hindi',
        ],
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
      },
      grid: {
        borderColor: '#e0e0e0',
        strokeDashArray: 4,
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => `${val}/100`,
        },
      },
    };
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'excellent':
        return 'grade-excellent';
      case 'good':
        return 'grade-good';
      case 'average':
        return 'grade-average';
      default:
        return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }

  getTimetableStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'tt-completed';
      case 'ongoing':
        return 'tt-ongoing';
      case 'break':
        return 'tt-break';
      default:
        return 'tt-upcoming';
    }
  }
}
