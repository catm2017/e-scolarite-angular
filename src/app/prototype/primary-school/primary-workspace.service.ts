import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  LanguageService,
  PlatformLocale,
} from '@core/service/language.service';
import { CentralApiService } from '../central-api.service';
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
  | 'quran-followup'
  | 'settings';

export type PrimaryLocale = PlatformLocale;
export type EstablishmentWorkspaceType = 'daara' | 'prescolaire' | 'primary' | 'college' | 'lycee';

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
  'quran-followup': 'suivi-coran',
  settings: 'parametres',
};

const ESTABLISHMENT_BASE_PATHS: Record<EstablishmentWorkspaceType, string> = {
  daara: '/institut/etablissements/daara',
  prescolaire: '/institut/etablissements/prescolaire',
  primary: '/institut/etablissements/primaire',
  college: '/institut/etablissements/college',
  lycee: '/institut/etablissements/lycee',
};

const FONCTIONNALITE_PAR_VUE: Partial<Record<PrimaryView, string>> = {
  settings: 'gestion_parametres',
  registrations: 'gestion_eleves',
  students: 'gestion_eleves',
  guardians: 'gestion_eleves',
  'student-detail': 'gestion_eleves',
  'guardian-detail': 'gestion_eleves',
  enrollments: 'gestion_inscriptions_reinscriptions',
  classes: 'gestion_classes',
  series: 'gestion_classes',
  staff: 'gestion_personnels',
  'staff-detail': 'gestion_personnels',
  'staff-attendance': 'gestion_personnels',
  teachers: 'gestion_enseignants',
  'teacher-detail': 'gestion_enseignants',
  subjects: 'gestion_matieres',
  'class-subjects': 'gestion_matieres',
  curriculum: 'suivi_programme_cahier_texte',
  'timetable-builder': 'gestion_emplois_temps',
  timetable: 'gestion_emplois_temps',
  attendance: 'gestion_seances',
  assessments: 'gestion_evaluations',
  reports: 'gestion_bulletins_notes',
  fees: 'gestion_finances',
  payments: 'gestion_finances',
  'expense-settings': 'gestion_finances',
  expenses: 'gestion_finances',
  finance: 'gestion_finances',
  'quran-followup': 'gestion_suivi_coran',
};

@Injectable({ providedIn: 'root' })
export class PrimaryWorkspaceService {
  private readonly language = inject(LanguageService);
  private readonly api = inject(CentralApiService);

  readonly activeView = signal<PrimaryView>('dashboard');
  readonly selectedCampusId = signal(this.campusInitial());
  private readonly campusSessionEffect = effect(() => {
    const campusId = this.selectedCampusId();
    if (!campusId) return;
    try { localStorage.setItem('e-scolarite:campus-actif', campusId); } catch { /* stockage indisponible */ }
  });
  readonly establishmentType = signal<EstablishmentWorkspaceType>('primary');
  readonly academicYears = signal(['2025–2026', '2026–2027', '2027–2028']);
  readonly selectedAcademicYear = signal('2026–2027');
  readonly selectedPeriod = signal('Trimestre 1');
  readonly availablePeriods = computed<readonly string[]>(() =>
    this.establishmentType() === 'primary' || this.establishmentType() === 'prescolaire'
      ? ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']
      : this.establishmentType() === 'daara' ? [] : ['Semestre 1', 'Semestre 2'],
  );
  readonly locale = this.language.locale;
  readonly sessionListRequest = signal(0);
  readonly classListRequest = signal(0);
  readonly assessmentListRequest = signal(0);
  private readonly configurationStates = signal<Record<EstablishmentWorkspaceType, { checked: boolean; ready: boolean }>>({
    daara: { checked: false, ready: false },
    prescolaire: { checked: false, ready: false },
    primary: { checked: false, ready: false },
    college: { checked: false, ready: false },
    lycee: { checked: false, ready: false },
  });
  readonly configurationChecked = computed(() => this.configurationStates()[this.establishmentType()].checked);
  readonly configurationReady = computed(() => this.configurationStates()[this.establishmentType()].ready);

  private campusInitial(): string {
    try { return localStorage.getItem('e-scolarite:campus-actif') ?? 'keur-massar'; } catch { return 'keur-massar'; }
  }

  /**
   * Applique le contexte métier d'un établissement à tous les composants
   * partagés (topbar, sidebar et contenu). Un changement de cycle repart du
   * tableau de bord afin de ne pas conserver une vue propre à l'ancien cycle.
   */
  configureEstablishment(type: EstablishmentWorkspaceType): void {
    const hasChanged = this.establishmentType() !== type;
    this.establishmentType.set(type);

    const periods = this.availablePeriods();
    if (periods.length && (hasChanged || !periods.includes(this.selectedPeriod()))) {
      this.selectedPeriod.set(periods[0]);
    } else if (!periods.length) {
      this.selectedPeriod.set('');
    }

    if (hasChanged) {
      this.selectView('dashboard');
    }
  }

  /** Synchronise le contexte depuis la route et retourne le cycle détecté. */
  synchronizeFromUrl(url: string): EstablishmentWorkspaceType | null {
    const path = url.split('?')[0].split('#')[0];
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
    const campusId = new URLSearchParams(query).get('campus');
    if (campusId) {
      this.selectedCampusId.set(campusId);
      try { localStorage.setItem('e-scolarite:campus-actif', campusId); } catch { /* stockage indisponible */ }
    }
    let type: EstablishmentWorkspaceType | null = null;

    if (path.startsWith('/institut/etablissements/daara')) {
      type = 'daara';
    } else if (path.startsWith('/institut/etablissements/prescolaire')) {
      type = 'prescolaire';
    } else if (path.startsWith('/institut/etablissements/primaire')) {
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

  setConfigurationState(type: EstablishmentWorkspaceType, checked: boolean, ready: boolean): void {
    this.configurationStates.update((states) => ({
      ...states,
      [type]: { checked, ready },
    }));
  }

  canAccessView(view: PrimaryView): boolean {
    // Le préscolaire reprend le socle administratif du primaire, sans le
    // suivi de leçons, les évaluations, les bulletins, ni la planification de
    // séances. Cette règle protège également les accès directs par URL.
    if (this.establishmentType() === 'daara' && [
      'enrollments', 'classes', 'series', 'subjects', 'class-subjects', 'curriculum',
      'timetable-builder', 'timetable', 'attendance', 'assessments', 'reports',
    ].includes(view)) {
      return false;
    }
    if (this.establishmentType() === 'prescolaire' && [
      'curriculum', 'timetable-builder', 'timetable', 'attendance', 'assessments', 'reports',
    ].includes(view)) {
      return false;
    }
    // À l’ouverture d’un espace, la configuration arrive de façon asynchrone.
    // Il ne faut donc pas remplacer l’URL demandée par Paramètres avant que le
    // backend ait confirmé si l’année, les niveaux et les périodes existent.
    const fonctionnalite = FONCTIONNALITE_PAR_VUE[view];
    const espacePermission = this.establishmentType() === 'primary' ? 'primaire' : this.establishmentType();
    // L’administrateur de l’institut peut toujours piloter les espaces
    // primaire, collège et lycée. Son accès ne dépend pas d’un droit métier
    // individuel ou d’un état local temporairement non rafraîchi.
    if (this.api.accesUtilisateur()?.administrateur) return true;
    if (view === 'settings') {
      return Boolean(fonctionnalite && this.api.permissionUtilisateurAutorisee(fonctionnalite, espacePermission));
    }
    if (!this.configurationChecked()) return true;
    if (view === 'dashboard') return this.configurationReady();
    return this.configurationReady()
      && this.api.souscriptionValidee()
      && Boolean(fonctionnalite && this.api.fonctionnalitesActives().includes(fonctionnalite))
      && Boolean(fonctionnalite && this.api.permissionUtilisateurAutorisee(fonctionnalite, espacePermission));
  }

  selectView(view: PrimaryView): void {
    // Le layout, le header et la sidebar peuvent observer le même événement de
    // navigation. Une vue déjà active ne doit pas relancer ses effets métier :
    // cela provoquait des remises à zéro et des appels redondants à chaque
    // aller-retour entre l'espace institut et un établissement.
    const accessibleView: PrimaryView = this.canAccessView(view) ? view : 'settings';
    if (this.activeView() === accessibleView) {
      return;
    }

    if (accessibleView === 'attendance') {
      this.sessionListRequest.update((request) => request + 1);
    }
    if (accessibleView === 'classes') {
      this.classListRequest.update((request) => request + 1);
    }
    if (accessibleView === 'assessments') {
      this.assessmentListRequest.update((request) => request + 1);
    }
    this.activeView.set(accessibleView);
  }

  translate(value: string): string {
    return translatePlatformText(value, this.locale());
  }
}
