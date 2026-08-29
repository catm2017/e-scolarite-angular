import { inject, Injectable, signal } from '@angular/core';
import {
  LanguageService,
  PlatformLocale,
} from '@core/service/language.service';
import { translatePlatformText } from '../../core/i18n/platform-translations';

export type PrimaryView =
  | 'dashboard'
  | 'registrations'
  | 'enrollments'
  | 'staff-attendance'
  | 'students'
  | 'student-detail'
  | 'guardians'
  | 'guardian-detail'
  | 'classes'
  | 'series'
  | 'subjects'
  | 'curriculum'
  | 'teachers'
  | 'teacher-detail'
  | 'staff'
  | 'staff-detail'
  | 'timetable-builder'
  | 'timetable'
  | 'attendance'
  | 'assessments'
  | 'reports'
  | 'fees'
  | 'payments'
  | 'expense-settings'
  | 'expenses'
  | 'finance'
  | 'settings';

export type PrimaryLocale = PlatformLocale;

@Injectable({ providedIn: 'root' })
export class PrimaryWorkspaceService {
  private readonly language = inject(LanguageService);

  readonly activeView = signal<PrimaryView>('dashboard');
  readonly selectedCampusId = signal('keur-massar');
  readonly establishmentType = signal('primary');
  readonly academicYears = signal(['2025–2026', '2026–2027', '2027–2028']);
  readonly selectedAcademicYear = signal('2026–2027');
  readonly selectedPeriod = signal('Trimestre 1');
  readonly locale = this.language.locale;
  readonly sessionListRequest = signal(0);
  readonly classListRequest = signal(0);
  readonly assessmentListRequest = signal(0);

  selectView(view: PrimaryView): void {
    if (view === 'attendance') {
      this.sessionListRequest.update((request) => request + 1);
    }
    if (view === 'classes') {
      this.classListRequest.update((request) => request + 1);
    }
    if (view === 'assessments') {
      this.assessmentListRequest.update((request) => request + 1);
    }
    this.activeView.set(view);
  }

  translate(value: string): string {
    return translatePlatformText(value, this.locale());
  }
}
