import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, OnInit, inject, HostListener, ChangeDetectionStrategy, viewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthService,
  Role,
} from '@core';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiService } from '@core/service/ai.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface SearchRoute {
  label: string;
  route: string;
  icon: string;
  pathLabel: string;
  synonyms: string[];
  role: Role;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
],
})
export class SearchBarComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit
{
    private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  aiService = inject(AiService);

  readonly paletteInputEl = viewChild<ElementRef>('paletteInput');

  // Role Filtering State using core Role enum
  currentUserRole: Role = Role.Teacher;

  // Command Palette State
  isPaletteOpen = false;
  searchQuery = '';
  isSearchingAI = false;
  aiDetectedRoute: { label: string; route: string } | null = null;
  filteredRoutes: SearchRoute[] = [];
  selectedIdx = 0;
  private searchSubject$ = new Subject<string>();

  // Suggestion commands list
  visibleCommands: any[] = [];

  // Full Route Matrix segmented by Role access permissions
  allRoutes: SearchRoute[] = [
    // --- Teacher Routes ---
    {
      label: 'Marks Entry',
      route: '/teacher/examination/marks-entry',
      icon: 'grade',
      pathLabel: 'Teacher > Examination > Marks Entry',
      synonyms: ['marks', 'grades', 'input marks', 'marks entry', 'exam result', 'student grades', 'report comment', 'comments', 'scoring'],
      role: Role.Teacher
    },
    {
      label: 'AI Quiz Generator',
      route: '/teacher/academics/quiz-generator',
      icon: 'auto_awesome',
      pathLabel: 'Teacher > Academics > AI Quiz Generator',
      synonyms: ['quiz', 'mcq', 'generator', 'ai quiz', 'generate test', 'academics quiz', 'textbook notes', 'questions'],
      role: Role.Teacher
    },
    {
      label: 'Teacher AI Settings',
      route: '/teacher/ai-settings',
      icon: 'settings_suggest',
      pathLabel: 'Teacher > AI Settings',
      synonyms: ['ai settings', 'api key', 'openai', 'gemini', 'credentials', 'ai configuration', 'configure ai'],
      role: Role.Teacher
    },
    {
      label: 'My Classes',
      route: '/teacher/academics/my-classes',
      icon: 'school',
      pathLabel: 'Teacher > Academics > My Classes',
      synonyms: ['classes', 'schedule', 'teaching list', 'classrooms'],
      role: Role.Teacher
    },
    {
      label: 'Lesson Plans',
      route: '/teacher/academics/lesson-plans',
      icon: 'assignment',
      pathLabel: 'Teacher > Academics > Lesson Plans',
      synonyms: ['chapters', 'curriculum', 'lesson schedule', 'weekly planning'],
      role: Role.Teacher
    },
    {
      label: 'Study Materials',
      route: '/teacher/academics/study-materials',
      icon: 'import_contacts',
      pathLabel: 'Teacher > Academics > Study Materials',
      synonyms: ['upload files', 'notes', 'textbooks', 'documents', 'lecture materials'],
      role: Role.Teacher
    },
    {
      label: 'Assignments',
      route: '/teacher/academics/assignments',
      icon: 'assignment_turned_in',
      pathLabel: 'Teacher > Academics > Assignments',
      synonyms: ['homework', 'student tasks', 'submissions', 'grades homework'],
      role: Role.Teacher
    },
    {
      label: 'Student Attendance',
      route: '/teacher/students/student-attendance',
      icon: 'how_to_reg',
      pathLabel: 'Teacher > Students > Student Attendance',
      synonyms: ['roll call', 'attendance list', 'absent', 'present', 'student report'],
      role: Role.Teacher
    },
    {
      label: 'Leave Requests',
      route: '/teacher/leave-request',
      icon: 'event_busy',
      pathLabel: 'Teacher > Leave Requests',
      synonyms: ['leave request', 'apply leave', 'sick day', 'holiday', 'day off'],
      role: Role.Teacher
    },
    {
      label: 'Today\'s Schedule',
      route: '/teacher/today-schedule',
      icon: 'today',
      pathLabel: 'Teacher > Today\'s Schedule',
      synonyms: ['today schedule', 'calendar events', 'class times', 'lectures'],
      role: Role.Teacher
    },

    // --- Admin Routes ---
    {
      label: 'Admin Dashboard',
      route: '/admin/dashboard/main',
      icon: 'dashboard',
      pathLabel: 'Admin > Dashboard',
      synonyms: ['dashboard', 'stats', 'home', 'main page', 'analytics'],
      role: Role.Admin
    },
    {
      label: 'AI Model & Settings',
      route: '/admin/settings/ai-settings',
      icon: 'settings_suggest',
      pathLabel: 'Admin > Settings > AI Settings',
      synonyms: ['ai settings', 'api key', 'openai', 'gemini', 'credentials', 'ai configuration', 'configure ai'],
      role: Role.Admin
    },
    {
      label: 'Add Student Admission',
      route: '/admin/students/add-student',
      icon: 'person_add',
      pathLabel: 'Admin > Students > Add Student',
      synonyms: ['admission', 'add student', 'register student', 'new student'],
      role: Role.Admin
    },
    {
      label: 'All Students List',
      route: '/admin/students/all-students',
      icon: 'people',
      pathLabel: 'Admin > Students > All Students',
      synonyms: ['students list', 'view students', 'student database', 'files'],
      role: Role.Admin
    },
    {
      label: 'Add Teacher Profile',
      route: '/admin/teachers/add-teacher',
      icon: 'person_add_alt',
      pathLabel: 'Admin > Teachers > Add Teacher',
      synonyms: ['add teacher', 'register teacher', 'new teacher', 'hire teacher'],
      role: Role.Admin
    },
    {
      label: 'All Teachers Directory',
      route: '/admin/teachers/all-teachers',
      icon: 'people_outline',
      pathLabel: 'Admin > Teachers > All Teachers',
      synonyms: ['teachers list', 'staff directory', 'view teachers'],
      role: Role.Admin
    },
    {
      label: 'All Classes Academics',
      route: '/admin/academics/all-classes',
      icon: 'class',
      pathLabel: 'Admin > Academics > All Classes',
      synonyms: ['classes list', 'view classes', 'rooms'],
      role: Role.Admin
    },
    {
      label: 'Library Assets Management',
      route: '/admin/library/all-assets',
      icon: 'local_library',
      pathLabel: 'Admin > Library > All Assets',
      synonyms: ['books', 'library assets', 'borrow books', 'find asset'],
      role: Role.Admin
    },

    // --- Student Routes ---
    {
      label: 'Student Dashboard',
      route: '/student/dashboard',
      icon: 'dashboard',
      pathLabel: 'Student > Dashboard',
      synonyms: ['dashboard', 'stats', 'home', 'main page', 'analytics'],
      role: Role.Student
    },
    {
      label: 'My Timetable',
      route: '/student/timetable',
      icon: 'calendar_today',
      pathLabel: 'Student > Timetable',
      synonyms: ['schedule', 'timetable', 'class times', 'lectures', 'calendar'],
      role: Role.Student
    },
    {
      label: 'My Classmates',
      route: '/student/my-class',
      icon: 'people',
      pathLabel: 'Student > Classmates',
      synonyms: ['classmates', 'students list', 'friends', 'my class'],
      role: Role.Student
    },
    {
      label: 'My Homework',
      route: '/student/homework',
      icon: 'assignment',
      pathLabel: 'Student > Homework',
      synonyms: ['homework', 'pending homework', 'submissions', 'tasks', 'assignments'],
      role: Role.Student
    },
    {
      label: 'Fee Details & Receipts',
      route: '/student/fees/fee-details',
      icon: 'receipt_long',
      pathLabel: 'Student > Fees > Fee Details',
      synonyms: ['receipts', 'fee receipts', 'fee details', 'payment history'],
      role: Role.Student
    },
    {
      label: 'Due Fees Payment',
      route: '/student/fees/due-fees',
      icon: 'payment',
      pathLabel: 'Student > Fees > Due Fees',
      synonyms: ['due fees', 'online payment', 'pay fees', 'tuition fee'],
      role: Role.Student
    },
    {
      label: 'Exam Schedule',
      route: '/student/examination/exam-schedule',
      icon: 'event',
      pathLabel: 'Student > Examination > Exam Schedule',
      synonyms: ['exam date', 'schedule exam', 'test dates', 'datesheet'],
      role: Role.Student
    },
    {
      label: 'My Marks & Grades',
      route: '/student/examination/marks',
      icon: 'grade',
      pathLabel: 'Student > Examination > Marks',
      synonyms: ['marks', 'grades', 'report card', 'exam scoring', 'results'],
      role: Role.Student
    },
    {
      label: 'My Attendance Logs',
      route: '/student/attendance/my-attendance',
      icon: 'how_to_reg',
      pathLabel: 'Student > Attendance > My Attendance',
      synonyms: ['attendance summary', 'roll status', 'absent', 'present', 'present days'],
      role: Role.Student
    },
    {
      label: 'Issued Library Books',
      route: '/student/library/my-issued-books',
      icon: 'local_library',
      pathLabel: 'Student > Library > My Issued Books',
      synonyms: ['borrowed books', 'issued books', 'library logs', 'due dates'],
      role: Role.Student
    }
  ];

  ngOnInit() {
    const userRole = this.authService.currentUser().roles?.[0]?.name as Role;
    this.currentUserRole = userRole || Role.Teacher;

    // Cache visible commands based on the active user role
    this.updateVisibleCommands();

    // Bind debounced AI Intent search
    this.subs.sink = this.searchSubject$.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.parseAIIntent(query);
        this.cdr.markForCheck();
    });
  }

  // Get only the routes the current user's role is allowed to see
  getVisibleRoutes(): SearchRoute[] {
    return this.allRoutes.filter(route => route.role === this.currentUserRole);
  }

  // Segment common commands dynamically by user role enum values
  updateVisibleCommands() {
    if (this.currentUserRole === Role.Teacher) {
      this.visibleCommands = [
        {
          label: '⚡ Open AI Chat Assistant',
          route: 'open_ai_chat',
          icon: 'chat',
          desc: 'Activate the floating global assistant directly'
        },
        {
          label: '⚙️ Configure Teacher AI Key',
          route: '/teacher/ai-settings',
          icon: 'vpn_key',
          desc: 'Enter your custom OpenAI / Gemini key'
        },
        {
          label: '📝 Auto-Generate a Quiz',
          route: '/teacher/academics/quiz-generator',
          icon: 'psychology',
          desc: 'Paste text and build multiple choice tests'
        },
        {
          label: '📊 Input Student Results',
          route: '/teacher/examination/marks-entry',
          icon: 'fact_check',
          desc: 'Grade student papers and auto-draft feedback'
        }
      ];
    } else if (this.currentUserRole === Role.Student) {
      this.visibleCommands = [
        {
          label: '⚡ Open AI Chat Assistant',
          route: 'open_ai_chat',
          icon: 'chat',
          desc: 'Activate the floating global assistant directly'
        },
        {
          label: '📅 View Class Timetable',
          route: '/student/timetable',
          icon: 'calendar_today',
          desc: 'Check your today classes schedule'
        },
        {
          label: '📝 Check Pending Homework',
          route: '/student/homework',
          icon: 'assignment',
          desc: 'Submit and view class homework files'
        },
        {
          label: '💳 View Due Fees & Pay',
          route: '/student/fees/due-fees',
          icon: 'payment',
          desc: 'Check fee status and pay securely online'
        }
      ];
    } else {
      this.visibleCommands = [
        {
          label: '⚡ Open AI Chat Assistant',
          route: 'open_ai_chat',
          icon: 'chat',
          desc: 'Activate the floating global assistant directly'
        },
        {
          label: '⚙️ Configure System AI Key',
          route: '/admin/settings/ai-settings',
          icon: 'settings_suggest',
          desc: 'Manage school-wide API key configurations'
        },
        {
          label: '🧑‍🏫 View All Teachers',
          route: '/admin/teachers/all-teachers',
          icon: 'people',
          desc: 'View staff directories and performance logs'
        },
        {
          label: '🎓 View All Students',
          route: '/admin/students/all-students',
          icon: 'school',
          desc: 'Manage global student admissions and files'
        }
      ];
    }
  }

  // Global keyboard shortcut listeners
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.toggleCommandPalette();
    }
    if (event.key === 'Escape' && this.isPaletteOpen) {
      event.preventDefault();
      this.closeCommandPalette();
    }
  }

  toggleCommandPalette() {
    if (this.isPaletteOpen) {
      this.closeCommandPalette();
    } else {
      this.openCommandPalette();
    }
  }

  openCommandPalette() {
    this.isPaletteOpen = true;
    this.document.body.classList.add('palette-open');
    this.searchQuery = '';
    this.filteredRoutes = [];
    this.aiDetectedRoute = null;
    this.selectedIdx = 0;
    
    // Focus the input once rendered
    setTimeout(() => {
      const paletteInputEl = this.paletteInputEl();
      if (paletteInputEl) {
        paletteInputEl.nativeElement.focus();
      }
    }, 50);
  }

  closeCommandPalette(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isPaletteOpen = false;
    this.document.body.classList.remove('palette-open');
  }

  onSearchInput() {
    this.selectedIdx = 0;
    const query = this.searchQuery.trim().toLowerCase();
    
    if (query.length === 0) {
      this.filteredRoutes = [];
      this.aiDetectedRoute = null;
      return;
    }

    // Local Fast Filtering (ONLY role-allowed views)
    const visible = this.getVisibleRoutes();
    this.filteredRoutes = visible.filter(route => {
      return route.label.toLowerCase().includes(query) || 
             route.pathLabel.toLowerCase().includes(query) || 
             route.synonyms.some(s => s.toLowerCase().includes(query));
    });

    // Request Gemini AI Intent Parsing
    this.searchSubject$.next(this.searchQuery);
  }

  parseAIIntent(query: string) {
    if (!query || query.trim().length < 3) {
      this.aiDetectedRoute = null;
      return;
    }

    if (!this.aiService.isAiEnabled()) {
      // Demo fallback matching by role enum value
      const lowerQuery = query.toLowerCase();
      const role = this.currentUserRole;
      
      if (role === Role.Teacher) {
        if (lowerQuery.includes('grade') || lowerQuery.includes('comment') || lowerQuery.includes('marks') || lowerQuery.includes('result')) {
          this.aiDetectedRoute = { label: 'Marks Entry', route: '/teacher/examination/marks-entry' };
        } else if (lowerQuery.includes('quiz') || lowerQuery.includes('test') || lowerQuery.includes('mcq') || lowerQuery.includes('generate')) {
          this.aiDetectedRoute = { label: 'AI Quiz Generator', route: '/teacher/academics/quiz-generator' };
        } else if (lowerQuery.includes('api') || lowerQuery.includes('settings') || lowerQuery.includes('key')) {
          this.aiDetectedRoute = { label: 'Teacher AI Settings', route: '/teacher/ai-settings' };
        } else {
          this.aiDetectedRoute = null;
        }
      } else if (role === Role.Student) {
        if (lowerQuery.includes('timetable') || lowerQuery.includes('schedule') || lowerQuery.includes('calendar')) {
          this.aiDetectedRoute = { label: 'My Timetable', route: '/student/timetable' };
        } else if (lowerQuery.includes('homework') || lowerQuery.includes('assignment') || lowerQuery.includes('task')) {
          this.aiDetectedRoute = { label: 'My Homework', route: '/student/homework' };
        } else if (lowerQuery.includes('fee') || lowerQuery.includes('pay') || lowerQuery.includes('due')) {
          this.aiDetectedRoute = { label: 'Due Fees Payment', route: '/student/fees/due-fees' };
        } else {
          this.aiDetectedRoute = null;
        }
      } else if (role === Role.Admin) {
        if (lowerQuery.includes('settings') || lowerQuery.includes('api') || lowerQuery.includes('key') || lowerQuery.includes('configure')) {
          this.aiDetectedRoute = { label: 'AI Model & Settings', route: '/admin/settings/ai-settings' };
        } else if (lowerQuery.includes('teacher') || lowerQuery.includes('staff')) {
          this.aiDetectedRoute = { label: 'All Teachers Directory', route: '/admin/teachers/all-teachers' };
        } else if (lowerQuery.includes('student') || lowerQuery.includes('admission') || lowerQuery.includes('add')) {
          this.aiDetectedRoute = { label: 'Add Student Admission', route: '/admin/students/add-student' };
        } else {
          this.aiDetectedRoute = null;
        }
      } else {
        this.aiDetectedRoute = null;
      }
      return;
    }

    this.isSearchingAI = true;

    const visible = this.getVisibleRoutes();
    const visibleListText = visible.map((r, i) => `${i + 1}. "${r.route}" (label: "${r.label}")`).join('\n');

    const prompt = `You are an AI router for a school management app. The user is logged in with role: "${this.currentUserRole}".
Analyze this user search query: "${query}"
Map it to the most relevant path from this available list:
${visibleListText}

Respond strictly with a single JSON object containing ONLY keys "route" and "label", or null if nothing fits:
{ "route": "/path", "label": "Label Name" }`;

    this.aiService.postPrompt(prompt).subscribe({
      next: (res) => {
        this.isSearchingAI = false;
        if (res) {
          try {
            let responseText = res.trim();
            if (responseText.startsWith('```')) {
              responseText = responseText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
            }
            const match = JSON.parse(responseText);
            if (match && match.route && match.label) {
              this.aiDetectedRoute = match;
            } else {
              this.aiDetectedRoute = null;
            }
          } catch (e) {
            this.aiDetectedRoute = null;
          }
        }
            this.cdr.markForCheck();
      },
      error: () => {
        this.isSearchingAI = false;
        this.aiDetectedRoute = null;
      }
    });
  }

  navigateToRoute(route: string) {
    this.closeCommandPalette();
    
    if (route === 'open_ai_chat') {
      const fabButton = document.querySelector('.chat-fab') as HTMLElement;
      if (fabButton) {
        fabButton.click();
      }
      return;
    }

    this.router.navigate([route]);
  }

  handleKeyDown(event: KeyboardEvent) {
    const isQueryActive = this.searchQuery.trim().length > 0;
    const totalItems = (this.aiDetectedRoute ? 1 : 0) + (isQueryActive ? this.filteredRoutes.length : this.visibleCommands.length);
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIdx = (this.selectedIdx + 1) % totalItems;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIdx = (this.selectedIdx - 1 + totalItems) % totalItems;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      
      let targetRoute = '';
      let idxOffset = 0;
      if (this.aiDetectedRoute) {
        if (this.selectedIdx === 0) {
          targetRoute = this.aiDetectedRoute.route;
        }
        idxOffset = 1;
      }
      
      if (!targetRoute) {
        const adjustedIdx = this.selectedIdx - idxOffset;
        if (isQueryActive) {
          if (this.filteredRoutes[adjustedIdx]) {
            targetRoute = this.filteredRoutes[adjustedIdx].route;
          }
        } else {
          if (this.visibleCommands[adjustedIdx]) {
            targetRoute = this.visibleCommands[adjustedIdx].route;
          }
        }
      }

      if (targetRoute) {
        this.navigateToRoute(targetRoute);
      }
    }
  }
}
