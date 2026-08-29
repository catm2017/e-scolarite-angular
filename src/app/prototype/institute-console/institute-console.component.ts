import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ColumnDefinition, MasterTableComponent } from '@shared/components/master-table/master-table.component';
import {
  InstituteView,
  InstituteWorkspaceService,
} from './institute-workspace.service';

interface Establishment {
  type: string;
  name: string;
  icon: string;
  color: string;
  learners: string;
  campuses: number;
  levels: string;
  status: 'Actif' | 'À configurer';
}

interface SubscriptionType {
  type: string;
  icon: string;
  description: string;
  modules: string[];
  price: number;
  enabled: boolean;
}

interface Campus {
  name: string;
  city: string;
  manager: string;
  establishments: number;
  learners: string;
  rooms: number;
  status: string;
}

interface InstituteDirectoryRow {
  matricule?: string;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  role?: string;
  function?: string;
  subject?: string;
  establishment?: string;
  scope?: string;
  campus?: string;
  status: string;
}

interface InstituteSpaceRow {
  reference: string;
  name: string;
  type: string;
  campus: string;
  capacity: string;
  status: string;
}

type StaffRecordTab = 'identity' | 'assignment' | 'access';
type TeacherRecordTab = 'identity' | 'teaching' | 'access';
type UserRecordTab = 'roles' | 'scope' | 'security' | 'activity';

interface TraceSetting {
  type: string;
  description: string;
  actions: boolean;
  authentications: boolean;
  updatedAt: string;
}

interface ActivityEntry {
  date: string;
  actor: string;
  action: string;
  description: string;
  scope: string;
  status: 'Réussie' | 'Refusée';
}

interface PermissionDefinition {
  code: string;
  label: string;
  module: string;
  description: string;
}

interface InstituteRole {
  id: string;
  label: string;
  description: string;
  users: number;
  permissions: string[];
}

@Component({
  selector: 'app-institute-console',
  imports: [RouterLink, BreadcrumbComponent, FormsModule, MasterTableComponent],
  templateUrl: './institute-console.component.html',
  styleUrl: './institute-console.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstituteConsoleComponent {
  private readonly router = inject(Router);
  private readonly workspace = inject(InstituteWorkspaceService);
  readonly activeView = this.workspace.activeView;

  readonly establishments: Establishment[] = [
    {
      type: 'Daara',
      name: 'Daara Joyau du Savoir',
      icon: 'auto_stories',
      color: '#2f80ed',
      learners: '520',
      campuses: 2,
      levels: 'Mémorisation · Révision · Arabe',
      status: 'Actif',
    },
    {
      type: 'Préscolaire',
      name: 'La Petite Académie',
      icon: 'toys',
      color: '#e28b4f',
      learners: '186',
      campuses: 2,
      levels: 'Petite · Moyenne · Grande section',
      status: 'Actif',
    },
    {
      type: 'École primaire',
      name: 'École Élémentaire Joyau',
      icon: 'school',
      color: '#36a37c',
      learners: '760',
      campuses: 3,
      levels: 'CI à CM2',
      status: 'Actif',
    },
    {
      type: 'Collège',
      name: 'Collège Joyau du Savoir',
      icon: 'menu_book',
      color: '#7b61c9',
      learners: '890',
      campuses: 2,
      levels: '6e à 3e',
      status: 'Actif',
    },
    {
      type: 'Lycée',
      name: 'Lycée d’Excellence Joyau',
      icon: 'workspace_premium',
      color: '#d66f57',
      learners: '730',
      campuses: 2,
      levels: 'Seconde à Terminale',
      status: 'Actif',
    },
    {
      type: 'Université',
      name: 'Université Joyau',
      icon: 'account_balance',
      color: '#2779b9',
      learners: '910',
      campuses: 1,
      levels: 'Licence · Master',
      status: 'Actif',
    },
    {
      type: 'Formation professionnelle',
      name: 'Institut des Métiers',
      icon: 'engineering',
      color: '#a56a3f',
      learners: '284',
      campuses: 2,
      levels: 'Diplômes · Certifications',
      status: 'À configurer',
    },
  ];

  readonly campuses = signal<Campus[]>([
    {
      name: 'Campus Keur Massar',
      city: 'Keur Massar, Dakar',
      manager: 'Aminata Ndiaye',
      establishments: 5,
      learners: '2 010',
      rooms: 42,
      status: 'Campus principal',
    },
    {
      name: 'Campus Dakar Plateau',
      city: 'Plateau, Dakar',
      manager: 'Moussa Fall',
      establishments: 4,
      learners: '1 470',
      rooms: 31,
      status: 'Actif',
    },
    {
      name: 'Campus Rufisque',
      city: 'Rufisque, Dakar',
      manager: 'Fatou Sarr',
      establishments: 3,
      learners: '800',
      rooms: 24,
      status: 'Actif',
    },
  ]);

  readonly campusFormOpen = signal(false);
  campusForm = { name: '', address: '' };

  readonly userCategory = signal<'all' | 'teachers' | 'staff' | 'guardians' | 'learners'>('all');
  readonly userRows: InstituteDirectoryRow[] = [
    { matricule: 'ENS-001', name: 'Mamadou Ngom', email: 'mamadou.ngom@joyau.sn', type: 'Enseignant', role: 'Enseignant de mathématiques', scope: 'École primaire · Keur Massar', status: 'Actif' },
    { matricule: 'ENS-002', name: 'Aïssatou Kane', email: 'aissatou.kane@joyau.sn', type: 'Enseignant', role: 'Enseignante de français', scope: 'Collège · Dakar Plateau', status: 'Actif' },
    { matricule: 'PER-001', name: 'Khadija Diop', email: 'khadija.diop@joyau.sn', type: 'Personnel', role: 'Secrétaire générale', scope: 'Institut · Keur Massar', status: 'Actif' },
    { matricule: 'PER-002', name: 'Ousmane Ba', email: 'ousmane.ba@joyau.sn', type: 'Personnel', role: 'Comptable', scope: 'Institut · Dakar Plateau', status: 'Actif' },
    { matricule: 'TUT-001', name: 'Mariam Diallo', email: 'mariam.diallo@example.sn', type: 'Tuteur', role: 'Compte famille', scope: 'École primaire · Keur Massar', status: 'Actif' },
    { matricule: 'TUT-002', name: 'Cheikh Seck', email: 'cheikh.seck@example.sn', type: 'Tuteur', role: 'Compte famille', scope: 'Lycée · Rufisque', status: 'Invitation envoyée' },
    { matricule: 'ELV-001', name: 'Aïssatou Ba', email: 'aissatou.ba@example.sn', type: 'Élève', role: 'Portail apprenant', scope: 'CM2 A · Keur Massar', status: 'Actif' },
    { matricule: 'ETU-001', name: 'Ibrahima Sow', email: 'ibrahima.sow@example.sn', type: 'Élève', role: 'Portail apprenant', scope: 'Université · Dakar Plateau', status: 'Actif' },
  ];
  readonly staffRows: InstituteDirectoryRow[] = [
    { matricule: 'PER-001', name: 'Khadija Diop', email: 'khadija.diop@joyau.sn', phone: '77 321 45 67', function: 'Secrétaire générale', campus: 'Keur Massar', status: 'Actif' },
    { matricule: 'PER-002', name: 'Ousmane Ba', email: 'ousmane.ba@joyau.sn', phone: '76 211 08 36', function: 'Comptable', campus: 'Dakar Plateau', status: 'Actif' },
    { matricule: 'PER-003', name: 'Ndeye Awa Sène', email: 'ndeyeawa.sene@joyau.sn', phone: '78 536 19 42', function: 'Surveillante générale', campus: 'Rufisque', status: 'En congé' },
  ];
  readonly teacherRows: InstituteDirectoryRow[] = [
    { matricule: 'ENS-001', name: 'Mamadou Ngom', email: 'mamadou.ngom@joyau.sn', phone: '77 111 45 90', subject: 'Arabe et mémorisation', establishment: 'Daara', campus: 'Keur Massar', status: 'Actif' },
    { matricule: 'ENS-002', name: 'Aïssatou Kane', email: 'aissatou.kane@joyau.sn', phone: '76 515 26 83', subject: 'Éveil et langage', establishment: 'Préscolaire', campus: 'Dakar Plateau', status: 'Actif' },
    { matricule: 'ENS-003', name: 'Cheikh Fall', email: 'cheikh.fall@joyau.sn', phone: '78 603 44 15', subject: 'Mathématiques', establishment: 'École primaire', campus: 'Keur Massar', status: 'Actif' },
    { matricule: 'ENS-004', name: 'Sokhna Faye', email: 'sokhna.faye@joyau.sn', phone: '77 794 31 26', subject: 'Français', establishment: 'Collège', campus: 'Dakar Plateau', status: 'Actif' },
    { matricule: 'ENS-005', name: 'Abdoulaye Touré', email: 'abdoulaye.toure@joyau.sn', phone: '76 485 67 32', subject: 'Sciences de la vie et de la terre', establishment: 'Lycée', campus: 'Rufisque', status: 'En congé' },
    { matricule: 'ENS-006', name: 'Coumba Ba', email: 'coumba.ba@joyau.sn', phone: '78 603 15 41', subject: 'Droit des affaires', establishment: 'Université', campus: 'Dakar Plateau', status: 'Actif' },
  ];
  readonly spaceRows: InstituteSpaceRow[] = [
    { reference: 'KM-S01', name: 'Salle A1', type: 'Salle de classe', campus: 'Keur Massar', capacity: '36 places', status: 'Disponible' },
    { reference: 'KM-LAB1', name: 'Laboratoire de sciences', type: 'Laboratoire', campus: 'Keur Massar', capacity: '28 places', status: 'Disponible' },
    { reference: 'DP-S12', name: 'Salle B12', type: 'Salle de classe', campus: 'Dakar Plateau', capacity: '40 places', status: 'Occupée' },
    { reference: 'RF-B01', name: 'Bureau direction', type: 'Bureau', campus: 'Rufisque', capacity: '6 places', status: 'Disponible' },
  ];

  readonly userDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.userRows);
  readonly staffDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.staffRows);
  readonly teacherDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.teacherRows);
  readonly spaceDataSource = new MatTableDataSource<InstituteSpaceRow>(this.spaceRows);
  readonly selectedTeacherEstablishment = signal('all');
  readonly selectedStaffCampus = signal('all');
  readonly selectedSpaceCampus = signal('all');
  readonly staffEditorOpen = signal(false);
  readonly teacherEditorOpen = signal(false);
  readonly selectedStaffRecord = signal<InstituteDirectoryRow | null>(null);
  readonly selectedTeacherRecord = signal<InstituteDirectoryRow | null>(null);
  readonly staffRecordTab = signal<StaffRecordTab>('identity');
  readonly teacherRecordTab = signal<TeacherRecordTab>('identity');
  readonly selectedUserRecord = signal<InstituteDirectoryRow | null>(null);
  readonly userRecordTab = signal<UserRecordTab>('roles');
  readonly userRole = signal('Gestionnaire d’établissement');
  readonly userPermissions = signal<string[]>(['Consulter les dossiers', 'Gérer les inscriptions']);
  readonly userCampusAccess = signal<string[]>(['Campus Keur Massar']);
  readonly userEstablishmentAccess = signal<string[]>(['École primaire']);
  readonly passwordResetSent = signal(false);
  readonly userAssignedRoles = signal<string[]>([]);
  readonly userRoleAssignmentDraft = signal('');
  readonly userDirectPermissions = signal<string[]>([]);
  readonly roleManagementTab = signal<'roles' | 'permissions'>('roles');
  readonly selectedRole = signal<InstituteRole | null>(null);
  readonly permissionSyncMessage = signal('Catalogue synchronisé le 28 août 2026 · 10:45');
  readonly permissionCatalogue = signal<PermissionDefinition[]>([
    { code: 'students.view', label: 'Consulter les dossiers élèves', module: 'Scolarité', description: 'Voir les dossiers et informations de scolarité.' },
    { code: 'students.manage', label: 'Gérer les inscriptions', module: 'Scolarité', description: 'Créer, inscrire et transférer les élèves.' },
    { code: 'finance.view', label: 'Consulter les finances', module: 'Finances', description: 'Voir encaissements, dépenses et journal financier.' },
    { code: 'finance.manage', label: 'Gérer les finances', module: 'Finances', description: 'Enregistrer et valider les opérations financières.' },
    { code: 'timetable.manage', label: 'Gérer les emplois du temps', module: 'Pédagogie', description: 'Créer et modifier les emplois du temps.' },
    { code: 'attendance.manage', label: 'Saisir les présences', module: 'Pédagogie', description: 'Renseigner les séances et les absences.' },
    { code: 'assessments.manage', label: 'Saisir les évaluations', module: 'Pédagogie', description: 'Créer les évaluations et renseigner les notes.' },
    { code: 'users.manage', label: 'Gérer les utilisateurs', module: 'Administration', description: 'Créer les comptes et définir les accès.' },
    { code: 'reports.export', label: 'Exporter les données', module: 'Administration', description: 'Exporter les listes et les rapports.' },
  ]);
  readonly instituteRoles = signal<InstituteRole[]>([
    { id: 'institute-admin', label: 'Administrateur d’institut', description: 'Administration globale de l’institut, de ses campus et de ses établissements.', users: 2, permissions: ['students.view', 'students.manage', 'finance.view', 'finance.manage', 'timetable.manage', 'attendance.manage', 'assessments.manage', 'users.manage', 'reports.export'] },
    { id: 'establishment-manager', label: 'Gestionnaire d’établissement', description: 'Pilotage d’un établissement et de son équipe dans son périmètre.', users: 6, permissions: ['students.view', 'students.manage', 'finance.view', 'timetable.manage', 'attendance.manage', 'assessments.manage', 'reports.export'] },
    { id: 'teacher', label: 'Enseignant', description: 'Accès aux classes, séances, évaluations et emploi du temps affectés.', users: 224, permissions: ['students.view', 'timetable.manage', 'attendance.manage', 'assessments.manage'] },
    { id: 'tutor', label: 'Tuteur', description: 'Consultation des informations, paiements et résultats des enfants liés.', users: 1180, permissions: ['students.view', 'finance.view'] },
    { id: 'learner', label: 'Élève', description: 'Accès en consultation à son espace apprenant.', users: 3410, permissions: ['students.view'] },
  ]);
  readonly traceConfigurationTab = signal<'journal' | 'settings'>('journal');
  readonly traceSettings = signal<TraceSetting[]>([
    { type: 'Administrateurs', description: 'Direction, responsables de campus et gestionnaires.', actions: true, authentications: true, updatedAt: '28 août 2026 · 09:30' },
    { type: 'Enseignants', description: 'Séances, présences, évaluations et cahier de texte.', actions: true, authentications: true, updatedAt: '28 août 2026 · 09:30' },
    { type: 'Personnel', description: 'Opérations administratives et financières autorisées.', actions: true, authentications: false, updatedAt: '27 août 2026 · 16:10' },
    { type: 'Tuteurs', description: 'Accès famille, paiements et consultations de dossier.', actions: false, authentications: true, updatedAt: '27 août 2026 · 16:10' },
    { type: 'Élèves', description: 'Accès au portail apprenant et consultations.', actions: false, authentications: false, updatedAt: '27 août 2026 · 16:10' },
  ]);
  readonly traceActionsEnabledCount = computed(() => this.traceSettings().filter((setting) => setting.actions).length);
  readonly traceAuthEnabledCount = computed(() => this.traceSettings().filter((setting) => setting.authentications).length);
  readonly activityEntries: ActivityEntry[] = [
    { date: '28 août 2026 · 10:42', actor: 'Aminata Ndiaye', action: 'Modification des autorisations', description: 'Ajout de la permission « Gérer les inscriptions »', scope: 'École primaire · Keur Massar', status: 'Réussie' },
    { date: '28 août 2026 · 09:18', actor: 'Mamadou Ngom', action: 'Connexion au compte', description: 'Authentification réussie depuis le réseau mobile', scope: 'Lycée · Rufisque', status: 'Réussie' },
    { date: '27 août 2026 · 16:05', actor: 'Ousmane Ba', action: 'Export financier', description: 'Export du registre des encaissements', scope: 'Institut · Dakar Plateau', status: 'Réussie' },
    { date: '27 août 2026 · 14:22', actor: 'Cheikh Seck', action: 'Tentative de connexion', description: 'Mot de passe incorrect', scope: 'Portail famille', status: 'Refusée' },
  ];
  readonly selectedUserActivityEntries = computed<ActivityEntry[]>(() => {
    const user = this.selectedUserRecord();
    if (!user) return [];
    const matches = this.activityEntries.filter((entry) => entry.actor === user.name);
    return matches.length ? matches : [{
      date: '26 août 2026 · 11:06',
      actor: user.name,
      action: 'Consultation du compte',
      description: 'Accès au portail selon le périmètre autorisé',
      scope: user.scope || 'Plateforme E-Scolarité',
      status: 'Réussie',
    }];
  });
  staffForm: InstituteDirectoryRow = this.emptyStaffForm();
  teacherForm: InstituteDirectoryRow = this.emptyTeacherForm();
  readonly teacherInterventionTabs = computed(() =>
    this.subscriptionTypes()
      .filter((subscription) => subscription.enabled)
      .map((subscription) => ({
        label: subscription.type,
        count: this.teacherRows.filter((teacher) => teacher.establishment === subscription.type).length,
      })),
  );

  readonly userColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Référence', type: 'text', visible: true },
    { def: 'name', label: 'Utilisateur', type: 'nameWithImage', visible: true },
    { def: 'type', label: 'Type', type: 'text', visible: true },
    { def: 'role', label: 'Rôle', type: 'text', visible: true },
    { def: 'scope', label: 'Périmètre', type: 'text', visible: true },
    { def: 'status', label: 'Statut', type: 'status', visible: true, statusBadgeMap: { Actif: 'badge badge-solid-green', 'Invitation envoyée': 'badge badge-solid-blue', Suspendu: 'badge badge-solid-red' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly staffColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true },
    { def: 'name', label: 'Personnel', type: 'nameWithImage', visible: true },
    { def: 'function', label: 'Fonction', type: 'text', visible: true },
    { def: 'phone', label: 'Téléphone', type: 'phone', visible: true },
    { def: 'campus', label: 'Campus', type: 'text', visible: true },
    { def: 'status', label: 'Statut', type: 'status', visible: true, statusBadgeMap: { Actif: 'badge badge-solid-green', 'En congé': 'badge badge-solid-orange' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly teacherColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true },
    { def: 'name', label: 'Enseignant', type: 'nameWithImage', visible: true },
    { def: 'establishment', label: 'Établissement / cycle', type: 'text', visible: true },
    { def: 'subject', label: 'Matière principale', type: 'text', visible: true },
    { def: 'phone', label: 'Téléphone', type: 'phone', visible: true },
    { def: 'campus', label: 'Campus', type: 'text', visible: true },
    { def: 'status', label: 'Statut', type: 'status', visible: true, statusBadgeMap: { Actif: 'badge badge-solid-green', 'En congé': 'badge badge-solid-orange' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly spaceColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'reference', label: 'Référence', type: 'text', visible: true },
    { def: 'name', label: 'Salle ou espace', type: 'text', visible: true },
    { def: 'type', label: 'Type', type: 'text', visible: true },
    { def: 'campus', label: 'Campus', type: 'text', visible: true },
    { def: 'capacity', label: 'Capacité', type: 'text', visible: true },
    { def: 'status', label: 'État', type: 'status', visible: true, statusBadgeMap: { Disponible: 'badge badge-solid-green', Occupée: 'badge badge-solid-orange' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  readonly assetCategories = [
    { label: 'Matériel informatique', count: 248, value: '78,4 M F', icon: 'computer' },
    { label: 'Mobilier scolaire', count: 1830, value: '42,7 M F', icon: 'chair' },
    { label: 'Véhicules', count: 12, value: '96,0 M F', icon: 'directions_bus' },
    { label: 'Équipements pédagogiques', count: 426, value: '31,8 M F', icon: 'science' },
  ];

  readonly subscriptionTypes = signal<SubscriptionType[]>([
    {
      type: 'Daara',
      icon: 'auto_stories',
      description: 'Suivi des sourates, révisions et progression',
      modules: ['Apprenants', 'Progression coranique', 'Planning'],
      price: 6000,
      enabled: true,
    },
    {
      type: 'Préscolaire',
      icon: 'toys',
      description: 'Cycles préscolaires et suivi des enfants',
      modules: ['Inscriptions', 'Présences'],
      price: 4000,
      enabled: true,
    },
    {
      type: 'École primaire',
      icon: 'school',
      description: 'Classes CI à CM2 et évaluations',
      modules: ['Scolarité', 'Évaluations', 'Finances'],
      price: 5000,
      enabled: true,
    },
    {
      type: 'Collège',
      icon: 'menu_book',
      description: 'Cycles moyen, emplois du temps et notes',
      modules: ['Scolarité', 'Séances', 'Évaluations'],
      price: 6000,
      enabled: true,
    },
    {
      type: 'Lycée',
      icon: 'workspace_premium',
      description: 'Séries, compositions et préparation examens',
      modules: ['Scolarité', 'Séances', 'Examens'],
      price: 7000,
      enabled: true,
    },
    {
      type: 'Université',
      icon: 'account_balance',
      description: 'Semestres, crédits, filières et délibérations',
      modules: ['Filières', 'Crédits', 'Délibérations'],
      price: 12000,
      enabled: true,
    },
    {
      type: 'Formation professionnelle',
      icon: 'engineering',
      description: 'Parcours, compétences et certifications',
      modules: ['Parcours', 'Stages', 'Certifications'],
      price: 8000,
      enabled: false,
    },
  ]);

  readonly subscriptionTotal = computed(
    () =>
      15000 +
      this.subscriptionTypes()
        .filter((item) => item.enabled)
        .reduce((sum, item) => sum + item.price, 0),
  );
  readonly activeSubscriptionCount = computed(
    () => this.subscriptionTypes().filter((item) => item.enabled).length,
  );

  openEstablishmentSpace(type: string): void {
    const paths: Record<string, string> = {
      'École primaire': '/institut/etablissements/primaire',
      Collège: '/institut/etablissements/college',
      Lycée: '/institut/etablissements/lycee',
    };
    const path = paths[type];

    if (path) {
      void this.router.navigateByUrl(path);
      return;
    }

    this.setView('establishments');
  }

  setView(view: InstituteView): void {
    if (view === 'users') this.selectedUserRecord.set(null);
    if (view === 'roles') this.selectedRole.set(null);
    if (view === 'staff') this.selectedStaffRecord.set(null);
    if (view === 'teachers') this.selectedTeacherRecord.set(null);
    this.workspace.selectView(view);
  }

  openCampusForm(): void {
    this.campusForm = { name: '', address: '' };
    this.campusFormOpen.set(true);
  }

  closeCampusForm(): void {
    this.campusFormOpen.set(false);
  }

  saveCampus(): void {
    const name = this.campusForm.name.trim();
    const address = this.campusForm.address.trim();

    if (!name || !address) return;

    this.campuses.update((items) => [
      ...items,
      {
        name,
        city: address,
        manager: 'À définir',
        establishments: 0,
        learners: '0',
        rooms: 0,
        status: 'À configurer',
      },
    ]);
    this.closeCampusForm();
  }

  selectUserCategory(category: 'all' | 'teachers' | 'staff' | 'guardians' | 'learners'): void {
    this.userCategory.set(category);
    const categoryLabel = category === 'all'
      ? null
      : category === 'teachers'
        ? 'Enseignant'
        : category === 'staff'
          ? 'Personnel'
          : category === 'guardians'
            ? 'Tuteur'
            : 'Élève';
    this.userDataSource.data = categoryLabel
      ? this.userRows.filter((user) => user.type === categoryLabel)
      : this.userRows;
  }

  viewUser(record: InstituteDirectoryRow): void {
    this.selectedUserRecord.set(record);
    this.userRecordTab.set('roles');
    this.passwordResetSent.set(false);
    this.userRole.set(record.role || 'Gestionnaire d’établissement');
    const defaultRole = record.type === 'Enseignant' ? 'teacher' : record.type === 'Tuteur' ? 'tutor' : record.type === 'Élève' ? 'learner' : 'establishment-manager';
    this.userAssignedRoles.set([defaultRole]);
    this.userRoleAssignmentDraft.set('');
    this.userDirectPermissions.set([]);
    this.userCampusAccess.set(record.scope?.includes('Dakar Plateau') ? ['Campus Dakar Plateau'] : record.scope?.includes('Rufisque') ? ['Campus Rufisque'] : ['Campus Keur Massar']);
    this.userEstablishmentAccess.set(record.type === 'Tuteur' ? ['Lycée'] : record.type === 'Élève' ? ['École primaire'] : record.scope?.includes('Collège') ? ['Collège'] : record.scope?.includes('Lycée') ? ['Lycée'] : ['École primaire']);
    this.setView('user-detail');
  }

  setUserRecordTab(tab: UserRecordTab): void {
    this.userRecordTab.set(tab);
  }

  toggleUserPermission(permission: string): void {
    this.userDirectPermissions.update((permissions) => permissions.includes(permission)
      ? permissions.filter((item) => item !== permission)
      : [...permissions, permission]);
  }

  assignRoleToUser(): void {
    const roleId = this.userRoleAssignmentDraft();
    if (!roleId) return;
    this.userAssignedRoles.update((roles) => roles.includes(roleId) ? roles : [...roles, roleId]);
    this.userRoleAssignmentDraft.set('');
  }

  removeRoleFromUser(roleId: string): void {
    this.userAssignedRoles.update((roles) => roles.filter((item) => item !== roleId));
  }

  roleById(roleId: string): InstituteRole | undefined {
    return this.instituteRoles().find((role) => role.id === roleId);
  }

  permissionsForRole(roleId: string): PermissionDefinition[] {
    const role = this.roleById(roleId);
    return role ? this.permissionCatalogue().filter((permission) => role.permissions.includes(permission.code)) : [];
  }

  openRoleDetail(role: InstituteRole): void {
    this.selectedRole.set(role);
    this.setView('role-detail');
  }

  toggleRolePermission(permissionCode: string): void {
    const role = this.selectedRole();
    if (!role) return;
    const permissions = role.permissions.includes(permissionCode)
      ? role.permissions.filter((code) => code !== permissionCode)
      : [...role.permissions, permissionCode];
    const next = { ...role, permissions };
    this.instituteRoles.update((roles) => roles.map((item) => item.id === role.id ? next : item));
    this.selectedRole.set(next);
  }

  synchronizePermissions(): void {
    this.permissionSyncMessage.set('Catalogue synchronisé le 28 août 2026 · maintenant');
  }

  toggleUserCampus(campus: string): void {
    this.userCampusAccess.update((campuses) => campuses.includes(campus)
      ? campuses.filter((item) => item !== campus)
      : [...campuses, campus]);
  }

  toggleUserEstablishment(establishment: string): void {
    this.userEstablishmentAccess.update((establishments) => establishments.includes(establishment)
      ? establishments.filter((item) => item !== establishment)
      : [...establishments, establishment]);
  }

  setUserAccountStatus(status: 'Actif' | 'Désactivé'): void {
    const user = this.selectedUserRecord();
    if (!user) return;
    user.status = status;
    this.userDataSource.data = [...this.userDataSource.data];
  }

  sendPasswordReset(): void {
    this.passwordResetSent.set(true);
  }

  updateTraceSetting(type: string, field: 'actions' | 'authentications', value: boolean): void {
    this.traceSettings.update((settings) => settings.map((setting) => setting.type === type
      ? { ...setting, [field]: value, updatedAt: '28 août 2026 · maintenant' }
      : setting));
  }

  selectTeacherEstablishment(establishment: string): void {
    this.selectedTeacherEstablishment.set(establishment);
    this.teacherDataSource.data = establishment === 'all'
      ? this.teacherRows
      : this.teacherRows.filter((teacher) => teacher.establishment === establishment);
  }

  selectStaffCampus(campus: string): void {
    this.selectedStaffCampus.set(campus);
    this.staffDataSource.data = campus === 'all'
      ? this.staffRows
      : this.staffRows.filter((person) => person.campus === campus);
  }

  selectSpaceCampus(campus: string): void {
    this.selectedSpaceCampus.set(campus);
    this.spaceDataSource.data = campus === 'all'
      ? this.spaceRows
      : this.spaceRows.filter((space) => space.campus === campus);
  }

  shortCampusName(name: string): string {
    return name.replace('Campus ', '');
  }

  staffCampusCount(campus: string): number {
    return this.staffRows.filter((person) => person.campus === campus).length;
  }

  spaceCampusCount(campus: string): number {
    return this.spaceRows.filter((space) => space.campus === campus).length;
  }

  startStaffForm(record?: InstituteDirectoryRow): void {
    this.staffForm = record ? { ...record } : this.emptyStaffForm();
    this.selectedStaffRecord.set(null);
    this.staffEditorOpen.set(true);
    if (this.activeView() === 'staff-detail') this.setView('staff');
  }

  saveStaff(): void {
    if (!this.staffForm.name?.trim() || !this.staffForm.function?.trim() || !this.staffForm.campus) return;
    const existing = this.staffRows.find((record) => record.matricule === this.staffForm.matricule);
    const saved = { ...this.staffForm, name: this.staffForm.name.trim(), status: this.staffForm.status || 'Actif' };
    if (existing) Object.assign(existing, saved);
    else this.staffRows.push({ ...saved, matricule: saved.matricule || `PER-${String(this.staffRows.length + 1).padStart(3, '0')}` });
    this.staffDataSource.data = [...this.staffRows];
    this.selectedStaffRecord.set(existing ?? this.staffRows[this.staffRows.length - 1]);
    this.staffRecordTab.set('identity');
    this.staffEditorOpen.set(false);
    this.setView('staff-detail');
  }

  viewStaff(record: InstituteDirectoryRow): void {
    this.staffEditorOpen.set(false);
    this.selectedStaffRecord.set(record);
    this.staffRecordTab.set('identity');
    this.setView('staff-detail');
  }

  removeStaff(record: InstituteDirectoryRow): void {
    const index = this.staffRows.indexOf(record);
    if (index >= 0) this.staffRows.splice(index, 1);
    this.staffDataSource.data = [...this.staffRows];
    if (this.selectedStaffRecord() === record) this.selectedStaffRecord.set(null);
  }

  startTeacherForm(record?: InstituteDirectoryRow): void {
    this.teacherForm = record ? { ...record } : this.emptyTeacherForm();
    this.selectedTeacherRecord.set(null);
    this.teacherEditorOpen.set(true);
    if (this.activeView() === 'teacher-detail') this.setView('teachers');
  }

  saveTeacher(): void {
    if (!this.teacherForm.name?.trim() || !this.teacherForm.establishment || !this.teacherForm.subject?.trim() || !this.teacherForm.campus) return;
    const existing = this.teacherRows.find((record) => record.matricule === this.teacherForm.matricule);
    const saved = { ...this.teacherForm, name: this.teacherForm.name.trim(), status: this.teacherForm.status || 'Actif' };
    if (existing) Object.assign(existing, saved);
    else this.teacherRows.push({ ...saved, matricule: saved.matricule || `ENS-${String(this.teacherRows.length + 1).padStart(3, '0')}` });
    this.teacherDataSource.data = [...this.teacherRows];
    this.selectedTeacherRecord.set(existing ?? this.teacherRows[this.teacherRows.length - 1]);
    this.teacherRecordTab.set('identity');
    this.teacherEditorOpen.set(false);
    this.setView('teacher-detail');
  }

  viewTeacher(record: InstituteDirectoryRow): void {
    this.teacherEditorOpen.set(false);
    this.selectedTeacherRecord.set(record);
    this.teacherRecordTab.set('identity');
    this.setView('teacher-detail');
  }

  removeTeacher(record: InstituteDirectoryRow): void {
    const index = this.teacherRows.indexOf(record);
    if (index >= 0) this.teacherRows.splice(index, 1);
    this.teacherDataSource.data = [...this.teacherRows];
    if (this.selectedTeacherRecord() === record) this.selectedTeacherRecord.set(null);
  }

  setStaffRecordTab(tab: StaffRecordTab): void {
    this.staffRecordTab.set(tab);
  }

  setTeacherRecordTab(tab: TeacherRecordTab): void {
    this.teacherRecordTab.set(tab);
  }

  private emptyStaffForm(): InstituteDirectoryRow {
    return { matricule: '', name: '', email: '', phone: '', function: '', campus: '', status: 'Actif' };
  }

  private emptyTeacherForm(): InstituteDirectoryRow {
    return { matricule: '', name: '', email: '', phone: '', establishment: '', subject: '', campus: '', status: 'Actif' };
  }

  directoryTitle(): string {
    switch (this.activeView()) {
      case 'staff': return 'Personnel institut';
      case 'teachers': return 'Enseignants';
      default: return 'Utilisateurs & accès';
    }
  }

  directoryDescription(): string {
    switch (this.activeView()) {
      case 'staff': return 'Retrouvez le personnel administratif et technique rattaché à l’institut ou à un campus.';
      case 'teachers': return 'Consultez les enseignants de l’institut avant leurs affectations dans les établissements.';
      default: return 'Définissez les rôles et le périmètre d’accès de chaque utilisateur de l’institut.';
    }
  }

  directoryAddLabel(): string {
    switch (this.activeView()) {
      case 'staff': return 'Ajouter un personnel';
      case 'teachers': return 'Ajouter un enseignant';
      default: return 'Ajouter un utilisateur';
    }
  }

  openDirectoryForm(): void {
    if (this.activeView() === 'staff') this.startStaffForm();
    if (this.activeView() === 'teachers') this.startTeacherForm();
  }

  refreshDirectory(): void {
    this.selectUserCategory(this.userCategory());
  }

  breadcrumbActive(): string {
    const labels: Record<InstituteView, string> = {
      overview: 'Tableau de bord',
      establishments: 'Établissements',
      campuses: 'Campus',
      users: 'Utilisateurs & accès',
      'user-detail': 'Dossier utilisateur',
      staff: 'Personnel institut',
      'staff-detail': 'Dossier personnel',
      teachers: 'Enseignants',
      'teacher-detail': 'Dossier enseignant',
      spaces: 'Salles & espaces',
      'activity-log': 'Traçabilité',
      roles: 'Rôles & permissions',
      'role-detail': 'Détail du rôle',
      assets: 'Patrimoine',
      subscription: 'Souscription',
      settings: 'Paramètres',
    };
    return labels[this.activeView()];
  }

  toggleSubscription(type: string): void {
    this.subscriptionTypes.update((items) =>
      items.map((item) => (item.type === type ? { ...item, enabled: !item.enabled } : item)),
    );
  }

  formatPrice(value: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(value)} F`;
  }
}
