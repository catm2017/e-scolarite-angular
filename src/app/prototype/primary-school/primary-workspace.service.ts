import { computed, inject, Injectable, signal } from '@angular/core';
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
  | 'class-subjects'
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
export type EstablishmentWorkspaceType = 'primary' | 'college' | 'lycee';

const PRIMARY_VIEW_PATHS: Record<PrimaryView, string> = {
  dashboard: 'tableau-de-bord',
  registrations: 'dossiers-eleves',
  enrollments: 'inscriptions-transferts',
  'staff-attendance': 'presences-personnel',
  students: 'eleves',
  'student-detail': 'eleves',
  guardians: 'tuteurs',
  'guardian-detail': 'tuteurs',
  classes: 'classes',
  series: 'series',
  subjects: 'matieres',
  'class-subjects': 'matieres-par-classe',
  curriculum: 'programmes-lecons',
  teachers: 'enseignants',
  'teacher-detail': 'enseignants',
  staff: 'personnel',
  'staff-detail': 'personnel',
  'timetable-builder': 'configuration-emploi-du-temps',
  timetable: 'emploi-du-temps',
  attendance: 'seances',
  assessments: 'evaluations',
  reports: 'notes-bulletins',
  fees: 'tarification-scolaire',
  payments: 'encaissements',
  'expense-settings': 'parametrage-depenses',
  expenses: 'depenses',
  finance: 'finances',
  settings: 'parametres',
};

const ESTABLISHMENT_BASE_PATHS: Record<EstablishmentWorkspaceType, string> = {
  primary: '/institut/etablissements/primaire',
  college: '/institut/etablissements/college',
  lycee: '/institut/etablissements/lycee',
};

@Injectable({ providedIn: 'root' })
export class PrimaryWorkspaceService {
  private readonly language = inject(LanguageService);

  readonly activeView = signal<PrimaryView>('dashboard');
  readonly selectedCampusId = signal('keur-massar');
  readonly establishmentType = signal<EstablishmentWorkspaceType>('primary');
  readonly academicYears = signal(['2025–2026', '2026–2027', '2027–2028']);
  readonly selectedAcademicYear = signal('2026–2027');
  readonly selectedPeriod = signal('Trimestre 1');
  readonly availablePeriods = computed<readonly string[]>(() =>
    this.establishmentType() === 'primary'
      ? ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']
      : ['Semestre 1', 'Semestre 2'],
  );
  readonly locale = this.language.locale;
  readonly sessionListRequest = signal(0);
  readonly classListRequest = signal(0);
  readonly assessmentListRequest = signal(0);

  /**
   * Applique le contexte métier d'un établissement à tous les composants
   * partagés (topbar, sidebar et contenu). Un changement de cycle repart du
   * tableau de bord afin de ne pas conserver une vue propre à l'ancien cycle.
   */
  configureEstablishment(type: EstablishmentWorkspaceType): void {
    const hasChanged = this.establishmentType() !== type;
    this.establishmentType.set(type);

    const periods = this.availablePeriods();
    if (hasChanged || !periods.includes(this.selectedPeriod())) {
      this.selectedPeriod.set(periods[0]);
    }

    if (hasChanged) {
      this.selectView('dashboard');
    }
  }

  /** Synchronise le contexte depuis la route et retourne le cycle détecté. */
  synchronizeFromUrl(url: string): EstablishmentWorkspaceType | null {
    const path = url.split('?')[0].split('#')[0];
    let type: EstablishmentWorkspaceType | null = null;

    if (path.startsWith('/institut/etablissements/primaire')) {
      type = 'primary';
    } else if (path.startsWith('/institut/etablissements/college')) {
      type = 'college';
    } else if (path.startsWith('/institut/etablissements/lycee')) {
      type = 'lycee';
    }

    if (type) {
      this.configureEstablishment(type);
      const basePath = ESTABLISHMENT_BASE_PATHS[type];
      const segment = path.slice(basePath.length).replace(/^\//, '').split('/')[0];
      const view = (Object.entries(PRIMARY_VIEW_PATHS)
        .find(([, value]) => value === segment)?.[0] ?? 'dashboard') as PrimaryView;
      this.selectView(view);
    }

    return type;
  }

  cheminVue(view: PrimaryView): string {
    return `${ESTABLISHMENT_BASE_PATHS[this.establishmentType()]}${view === 'dashboard' ? '/tableau-de-bord' : `/${PRIMARY_VIEW_PATHS[view]}`}`;
  }

  selectView(view: PrimaryView): void {
    // Le layout, le header et la sidebar peuvent observer le même événement de
    // navigation. Une vue déjà active ne doit pas relancer ses effets métier :
    // cela provoquait des remises à zéro et des appels redondants à chaque
    // aller-retour entre l'espace institut et un établissement.
    if (this.activeView() === view) {
      return;
    }

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
