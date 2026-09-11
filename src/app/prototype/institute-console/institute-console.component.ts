import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ColumnDefinition, MasterTableComponent } from '@shared/components/master-table/master-table.component';
import {
  InstituteView,
  InstituteWorkspaceService,
} from './institute-workspace.service';
import { CampusInstitut, CentralApiService, FonctionnaliteSouscription, SalleInstitut, TypeSouscription } from '../central-api.service';
import { AppToastService } from '@core/service/app-toast.service';

interface Establishment {
  id: string | null;
  type: string;
  name: string;
  icon: string;
  color: string;
  learners: string;
  campuses: number;
  levels: string;
  status: 'Actif' | 'Non activé';
  active: boolean;
}

interface SubscriptionType {
  id: string | null;
  typeId: string;
  code: string;
  type: string;
  icon: string;
  description: string;
  modules: string[];
  price: number;
  enabled: boolean;
  functionalities: FonctionnaliteSouscription[];
}

interface Campus {
  id: string;
  code: string;
  name: string;
  city: string;
  establishments: number;
  rooms: number;
  status: string;
  phone: string | null;
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
  id: string;
  campusId: string;
  reference: string;
  name: string;
  type: string;
  campus: string;
  capacity: string;
  description: string;
  status: string;
}

interface InstituteSpaceForm {
  campusId: string;
  code: string;
  name: string;
  type: string;
  capacity: number | null;
  description: string;
  status: 'disponible' | 'indisponible' | 'maintenance';
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
export class InstituteConsoleComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workspace = inject(InstituteWorkspaceService);
  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  readonly activeView = this.workspace.activeView;
  readonly establishments = signal<Establishment[]>([]);
  readonly instituteName = signal('Institut');
  readonly connectedUserName = signal('');
  readonly subscriptionLoading = signal(false);
  readonly subscriptionSaving = signal(false);
  readonly subscriptionError = signal<string | null>(null);
  readonly subscriptionSuccess = signal<string | null>(null);
  readonly backendRefreshing = signal(false);
  readonly selectedSubscriptionType = signal<SubscriptionType | null>(null);
  readonly activeEstablishmentsCount = computed(() => this.establishments().filter((item) => item.active).length);
  readonly activeEstablishments = computed(() => this.establishments().filter((item) => item.active));

  readonly campuses = signal<Campus[]>([]);
  readonly campusCount = computed(() => this.campuses().length);
  readonly roomCount = computed(() => this.campuses().reduce((total, campus) => total + campus.rooms, 0));
  readonly campusSaving = signal(false);
  readonly campusError = signal<string | null>(null);
  readonly editingCampusId = signal<string | null>(null);

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
  readonly userDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.userRows);
  readonly staffDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.staffRows);
  readonly teacherDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.teacherRows);
  readonly spaceRows = signal<InstituteSpaceRow[]>([]);
  readonly spaceDataSource = new MatTableDataSource<InstituteSpaceRow>([]);
  readonly spacesLoading = signal(false);
  readonly spaceSaving = signal(false);
  readonly spaceFormOpen = signal(false);
  readonly editingSpaceId = signal<string | null>(null);
  readonly spaceError = signal<string | null>(null);
  spaceForm: InstituteSpaceForm = this.emptySpaceForm();
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
    { def: 'status', label: 'État', type: 'status', visible: true, statusBadgeMap: { Disponible: 'badge badge-solid-green', Indisponible: 'badge badge-solid-red', Maintenance: 'badge badge-solid-orange' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  readonly assetCategories = [
    { label: 'Matériel informatique', count: 248, value: '78,4 M F', icon: 'computer' },
    { label: 'Mobilier scolaire', count: 1830, value: '42,7 M F', icon: 'chair' },
    { label: 'Véhicules', count: 12, value: '96,0 M F', icon: 'directions_bus' },
    { label: 'Équipements pédagogiques', count: 426, value: '31,8 M F', icon: 'science' },
  ];

  readonly subscriptionTypes = signal<SubscriptionType[]>([]);

  readonly subscriptionTotal = computed(
    () =>
      this.subscriptionTypes()
        .reduce((sum, item) => sum + item.functionalities
          .filter((fonctionnalite) => fonctionnalite.selectionnee)
          .reduce((subtotal, fonctionnalite) => subtotal + fonctionnalite.prix_mensuel, 0), 0),
  );
  readonly activeSubscriptionCount = computed(
    () => this.subscriptionTypes().flatMap((item) => item.functionalities).filter((item) => item.selectionnee).length,
  );
  readonly activeSubscriptionTypesCount = computed(() => this.subscriptionTypes().filter((item) => item.enabled).length);

  ngOnInit(): void {
    const vueDemandee = this.route.snapshot.queryParamMap.get('vue');
    // Compatibilité des anciens liens /institut?vue=… : ils deviennent des
    // URLs réelles, donc un changement de menu réactive bien son composant.
    if (vueDemandee) {
      const view: InstituteView = vueDemandee === 'campuses'
        ? 'campuses'
        : vueDemandee === 'souscription'
          ? 'subscription'
          : 'overview';
      void this.router.navigateByUrl(this.workspace.cheminVue(view), { replaceUrl: true });
      return;
    }

    this.workspace.synchronizeFromUrl(this.router.url);
    if (!this.workspace.subscriptionValidated() && this.activeView() !== 'subscription') {
      void this.router.navigateByUrl(this.workspace.cheminVue('subscription'), { replaceUrl: true });
      return;
    }
    this.chargerEspace();
  }

  private chargerEspace(): void {
    this.subscriptionLoading.set(true);
    this.subscriptionError.set(null);
    this.api.espaceInstitut().subscribe({
      next: (espace) => {
        this.instituteName.set(espace.institut.nom);
        this.connectedUserName.set(`${espace.user.prenom} ${espace.user.nom}`.trim());
        this.campuses.set(espace.campus.map((campus) => this.presenterCampus(campus)));
        this.establishments.set(espace.etablissements.map((item) => this.presenterEtablissement(item)));
        this.chargerSalles();
        this.chargerSouscription();
      },
      error: (erreur: HttpErrorResponse) => {
        if (erreur.status === 401 || erreur.status === 419) {
          this.subscriptionLoading.set(false);
          this.backendRefreshing.set(false);
          return;
        }
        this.subscriptionError.set('Les données de votre institut ne sont pas disponibles pour le moment.');
        this.subscriptionLoading.set(false);
        this.backendRefreshing.set(false);
      },
    });
  }

  private chargerSouscription(): void {
    this.api.souscriptionInstitut().subscribe({
      next: (souscription) => {
        const types = souscription.types.map((item) => this.presenterSouscription(item));
        this.subscriptionTypes.set(types);
        this.selectedSubscriptionType.set(types.find((item) => item.enabled) ?? null);
        this.workspace.configureSubscriptionAccess(souscription.validee, souscription.fonctionnalites_actives);
        if (!souscription.validee && this.activeView() !== 'subscription') {
          void this.router.navigateByUrl(this.workspace.cheminVue('subscription'), { replaceUrl: true });
        }
        this.subscriptionLoading.set(false);
        if (this.backendRefreshing()) {
          this.backendRefreshing.set(false);
          this.subscriptionSuccess.set('Les données ont été réactualisées depuis la base de données.');
        }
      },
      error: (erreur: HttpErrorResponse) => {
        if (erreur.status === 401 || erreur.status === 419) {
          this.subscriptionLoading.set(false);
          this.backendRefreshing.set(false);
          return;
        }
        this.subscriptionError.set('La souscription est momentanément indisponible.');
        this.subscriptionLoading.set(false);
        this.backendRefreshing.set(false);
      },
    });
  }

  actualiserDonneesBackend(): void {
    if (this.backendRefreshing()) return;
    this.api.invaliderCache('institut:');
    this.backendRefreshing.set(true);
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    this.chargerEspace();
  }

  chargerSalles(): void {
    this.spacesLoading.set(true);
    this.api.sallesInstitut().subscribe({
      next: (resultat) => {
        this.spacesLoading.set(false);
        this.spaceRows.set(resultat.data.map((salle) => this.presenterSalle(salle)));
        this.appliquerFiltreSalles();
      },
      error: (erreur: HttpErrorResponse) => {
        this.spacesLoading.set(false);
        if (erreur.status !== 401 && erreur.status !== 419) {
          this.toast.error(erreur.error?.message ?? 'Les salles et espaces n’ont pas pu être chargés.');
        }
      },
    });
  }

  private presenterEtablissement(item: Omit<TypeSouscription, 'fonctionnalites'>): Establishment {
    const presentation = this.presentationType(item.code);
    return {
      id: item.id,
      type: item.type,
      name: item.nom,
      icon: presentation.icon,
      color: presentation.color,
      learners: '—',
      campuses: this.campusCount(),
      levels: presentation.levels,
      status: item.active ? 'Actif' : 'Non activé',
      active: item.active,
    };
  }

  private presenterCampus(campus: CampusInstitut): Campus {
    return {
      id: campus.id,
      code: campus.code,
      name: campus.nom,
      city: campus.adresse || 'Adresse non renseignée',
      establishments: campus.etablissements_count,
      rooms: campus.salles_count,
      status: campus.statut === 'actif' ? 'Actif' : 'Inactif',
      phone: campus.telephone,
    };
  }

  private presenterSalle(salle: SalleInstitut): InstituteSpaceRow {
    const statuts: Record<SalleInstitut['statut'], string> = {
      disponible: 'Disponible',
      indisponible: 'Indisponible',
      maintenance: 'Maintenance',
    };
    return {
      id: salle.id,
      campusId: salle.campus_id,
      reference: salle.code,
      name: salle.nom,
      type: salle.type,
      campus: salle.campus_nom,
      capacity: salle.capacite ? `${salle.capacite} places` : 'Non définie',
      description: salle.description ?? '',
      status: statuts[salle.statut],
    };
  }

  canOpenEstablishment(item: Establishment): boolean {
    const typeSouscription = this.subscriptionTypes().find((type) => type.type === item.type);
    return item.active
      && this.campusCount() > 0
      && this.workspace.subscriptionValidated()
      && Boolean(typeSouscription?.functionalities.some((fonctionnalite) => fonctionnalite.selectionnee));
  }

  establishmentActionLabel(item: Establishment): string {
    if (!item.active) return 'Non activé';
    if (this.campusCount() === 0) return 'Ajoutez un campus';
    return 'Ouvrir l’espace';
  }

  private presenterSouscription(item: TypeSouscription): SubscriptionType {
    const presentation = this.presentationType(item.code);
    return {
      id: item.id,
      typeId: item.type_id,
      code: item.code,
      type: item.type,
      icon: presentation.icon,
      description: item.active ? 'Établissement activé lors de votre adhésion.' : 'Type non retenu dans votre adhésion.',
      modules: item.fonctionnalites.map((fonctionnalite) => fonctionnalite.libelle),
      price: item.fonctionnalites.reduce((total, fonctionnalite) => total + fonctionnalite.prix_mensuel, 0),
      enabled: item.active,
      functionalities: item.fonctionnalites,
    };
  }

  private presentationType(code: string): { icon: string; color: string; levels: string } {
    const presentations: Record<string, { icon: string; color: string; levels: string }> = {
      prescolaire: { icon: 'toys', color: '#e28b4f', levels: 'Petite · Moyenne · Grande section' },
      primaire: { icon: 'school', color: '#36a37c', levels: 'CI à CM2' },
      college: { icon: 'menu_book', color: '#7b61c9', levels: '6e à 3e' },
      lycee: { icon: 'workspace_premium', color: '#d66f57', levels: 'Seconde à Terminale' },
      universite: { icon: 'account_balance', color: '#2779b9', levels: 'Licence · Master' },
      formation_professionnelle: { icon: 'engineering', color: '#a56a3f', levels: 'Diplômes · Certifications' },
    };
    return presentations[code] ?? { icon: 'account_balance', color: '#2f80ed', levels: 'À définir' };
  }

  openEstablishmentSpace(type: string): void {
    const establishment = this.establishments().find((item) => item.type === type);
    const typeSouscription = this.subscriptionTypes().find((item) => item.type === type);
    if (!establishment || !this.canOpenEstablishment(establishment)
      || !typeSouscription?.functionalities.some((item) => item.selectionnee)) return;
    const paths: Record<string, string> = {
      'École primaire': '/institut/etablissements/primaire/tableau-de-bord',
      Collège: '/institut/etablissements/college/tableau-de-bord',
      Lycée: '/institut/etablissements/lycee/tableau-de-bord',
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

  openCampusForm(campus?: Campus): void {
    this.editingCampusId.set(campus?.id ?? null);
    this.campusForm = campus ? { name: campus.name, address: campus.city } : { name: '', address: '' };
    this.campusError.set(null);
    this.campusFormOpen.set(true);
  }

  closeCampusForm(): void {
    this.campusFormOpen.set(false);
    this.editingCampusId.set(null);
  }

  saveCampus(): void {
    const name = this.campusForm.name.trim();
    const address = this.campusForm.address.trim();
    const isUpdate = Boolean(this.editingCampusId());

    if (!name || !address) return;

    this.campusSaving.set(true);
    this.campusError.set(null);
    const requete = this.editingCampusId()
      ? this.api.mettreAJourCampusInstitut(this.editingCampusId()!, { nom: name, adresse: address })
      : this.api.creerCampusInstitut({ nom: name, adresse: address });
    requete.subscribe({
      next: (resultat) => {
        this.campuses.update((items) => {
          const existe = items.some((item) => item.id === resultat.data.id);
          const campus = this.presenterCampus(resultat.data);
          return (existe ? items.map((item) => item.id === campus.id ? campus : item) : [...items, campus])
            .sort((a, b) => a.name.localeCompare(b.name));
        });
        this.establishments.update((items) => items.map((item) => ({ ...item, campuses: this.campusCount() })));
        this.campusSaving.set(false);
        this.closeCampusForm();
        this.toast.success(isUpdate ? 'Le campus a été mis à jour.' : 'Le campus a été ajouté.');
      },
      error: (erreur) => {
        this.campusSaving.set(false);
        const message = erreur?.error?.message || 'Le campus n’a pas pu être créé. Vérifiez les informations puis réessayez.';
        this.campusError.set(message);
        this.toast.error(message);
      },
    });
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
    this.appliquerFiltreSalles();
  }

  shortCampusName(name: string): string {
    return name.replace('Campus ', '');
  }

  staffCampusCount(campus: string): number {
    return this.staffRows.filter((person) => person.campus === campus).length;
  }

  spaceCampusCount(campus: string): number {
    return this.spaceRows().filter((space) => space.campusId === campus).length;
  }

  openSpaceForm(space?: InstituteSpaceRow): void {
    this.editingSpaceId.set(space?.id ?? null);
    const campusId = space?.campusId ?? this.campuses()[0]?.id ?? '';
    this.spaceForm = space
      ? {
          campusId,
          code: space.reference,
          name: space.name,
          type: space.type,
          capacity: this.nombreCapacite(space.capacity),
          description: space.description,
          status: this.codeStatutSalle(space.status),
        }
      : { ...this.emptySpaceForm(), campusId };
    this.spaceError.set(null);
    this.spaceFormOpen.set(true);
  }

  closeSpaceForm(): void {
    this.spaceFormOpen.set(false);
    this.editingSpaceId.set(null);
    this.spaceError.set(null);
  }

  saveSpace(): void {
    if (!this.spaceForm.campusId || !this.spaceForm.name.trim() || !this.spaceForm.type.trim() || this.spaceSaving()) {
      return;
    }
    this.spaceSaving.set(true);
    this.spaceError.set(null);
    const donnees = {
      campus_id: this.spaceForm.campusId,
      code: this.spaceForm.code.trim() || null,
      nom: this.spaceForm.name.trim(),
      type: this.spaceForm.type.trim(),
      capacite: this.spaceForm.capacity,
      description: this.spaceForm.description.trim() || null,
      statut: this.spaceForm.status,
    };
    const requete = this.editingSpaceId()
      ? this.api.mettreAJourSalleInstitut(this.editingSpaceId()!, donnees)
      : this.api.creerSalleInstitut(donnees);
    requete.subscribe({
      next: (resultat) => {
        const salle = this.presenterSalle(resultat.data);
        this.spaceRows.update((items) => {
          const existe = items.some((item) => item.id === salle.id);
          return (existe ? items.map((item) => item.id === salle.id ? salle : item) : [...items, salle])
            .sort((a, b) => `${a.campus}\u0000${a.name}`.localeCompare(`${b.campus}\u0000${b.name}`));
        });
        this.appliquerFiltreSalles();
        this.spaceSaving.set(false);
        this.closeSpaceForm();
        this.chargerEspace();
        this.toast.success(resultat.message);
      },
      error: (erreur) => {
        this.spaceSaving.set(false);
        const message = erreur?.error?.message ?? 'La salle n’a pas pu être enregistrée.';
        this.spaceError.set(message);
        this.toast.error(message);
      },
    });
  }

  deleteSpace(space: InstituteSpaceRow): void {
    if (!window.confirm(`Supprimer « ${space.name} » ? Cette action retirera la salle des futures configurations d’emploi du temps.`)) {
      return;
    }
    this.api.supprimerSalleInstitut(space.id).subscribe({
      next: (resultat) => {
        this.spaceRows.update((items) => items.filter((item) => item.id !== space.id));
        this.appliquerFiltreSalles();
        this.chargerEspace();
        this.toast.success(resultat.message);
      },
      error: (erreur) => this.toast.error(erreur?.error?.message ?? 'La salle n’a pas pu être supprimée.'),
    });
  }

  private appliquerFiltreSalles(): void {
    const campusId = this.selectedSpaceCampus();
    this.spaceDataSource.data = campusId === 'all'
      ? this.spaceRows()
      : this.spaceRows().filter((space) => space.campusId === campusId);
  }

  private emptySpaceForm(): InstituteSpaceForm {
    return {
      campusId: '',
      code: '',
      name: '',
      type: 'Salle de classe',
      capacity: null,
      description: '',
      status: 'disponible',
    };
  }

  private codeStatutSalle(statut: string): InstituteSpaceForm['status'] {
    return statut === 'Indisponible' ? 'indisponible' : statut === 'Maintenance' ? 'maintenance' : 'disponible';
  }

  private nombreCapacite(capacite: string): number | null {
    const valeur = Number(capacite.replace(/\D/g, ''));
    return Number.isFinite(valeur) && valeur > 0 ? valeur : null;
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

  ouvrirFonctionnalites(type: SubscriptionType): void {
    if (!type.enabled) return;
    this.selectedSubscriptionType.set(type);
  }

  ouvrirPremierTypeActif(): void {
    const type = this.subscriptionTypes().find((item) => item.enabled);
    if (type) this.ouvrirFonctionnalites(type);
  }

  basculerFonctionnalite(fonctionnaliteId: string): void {
    const type = this.selectedSubscriptionType();
    if (!type) return;
    this.subscriptionTypes.update((types) => types.map((item) => item.typeId !== type.typeId ? item : {
      ...item,
      functionalities: item.functionalities.map((fonctionnalite) => fonctionnalite.id === fonctionnaliteId
        ? { ...fonctionnalite, selectionnee: !fonctionnalite.selectionnee }
        : fonctionnalite),
    }));
    this.selectedSubscriptionType.set(this.subscriptionTypes().find((item) => item.typeId === type.typeId) ?? null);
  }

  enregistrerSouscription(): void {
    if (this.subscriptionSaving()) return;
    this.subscriptionSaving.set(true);
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    const selection = this.subscriptionTypes()
      .flatMap((type) => type.functionalities)
      .filter((fonctionnalite) => fonctionnalite.selectionnee)
      .map((fonctionnalite) => fonctionnalite.id);

    if (!selection.length) {
      this.subscriptionError.set('Sélectionnez au moins une fonctionnalité commercialisée avant de valider.');
      this.subscriptionSaving.set(false);
      return;
    }

    this.api.enregistrerSouscriptionInstitut(selection).subscribe({
      next: () => this.api.validerSouscriptionInstitut().subscribe({
        next: (souscription) => {
          const types = souscription.types.map((item) => this.presenterSouscription(item));
          this.subscriptionTypes.set(types);
          const selected = this.selectedSubscriptionType();
          this.selectedSubscriptionType.set(types.find((item) => item.typeId === selected?.typeId) ?? types.find((item) => item.enabled) ?? null);
          this.workspace.configureSubscriptionAccess(souscription.validee, souscription.fonctionnalites_actives);
          this.subscriptionSuccess.set('Votre souscription est validée. Les espaces et menus autorisés sont maintenant accessibles.');
          this.subscriptionSaving.set(false);
        },
        error: (response: unknown) => {
          this.subscriptionError.set(this.subscriptionErrorMessage(response, 'La validation de votre souscription a échoué.'));
          this.subscriptionSaving.set(false);
        },
      }),
      error: (response: unknown) => {
        this.subscriptionError.set(this.subscriptionErrorMessage(response, 'La sauvegarde de votre souscription a échoué.'));
        this.subscriptionSaving.set(false);
      },
    });
  }

  hasActiveFeature(code: string): boolean {
    return this.workspace.hasFeature(code);
  }

  private subscriptionErrorMessage(response: unknown, fallback: string): string {
    return (response as { error?: { message?: string } })?.error?.message ?? fallback;
  }

  formatPrice(value: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(value)} F`;
  }
}
