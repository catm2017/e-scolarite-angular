import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
import { PrimaryWorkspaceService } from '../primary-school/primary-workspace.service';
import { CampusInstitut, CentralApiService, CompteCandidatInstitut, FactureSouscriptionInstitut, FonctionnaliteSouscription, MembreEquipeInstitut, PackageSouscription, PermissionInstitutApi, RoleInstitutApi, SalleInstitut, SouscriptionInstitut, TypeSouscription, UtilisateurInstitutApi } from '../central-api.service';
import { AppToastService } from '@core/service/app-toast.service';
import { TemplateMultiselectDirective } from '@shared/directives/template-multiselect.directive';
import { StudentTransfersComponent } from './student-transfers/student-transfers.component';

interface Establishment {
  id: string | null;
  workspaceId?: string | null;
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
  learnerCount: number;
  staffCount: number;
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
  id?: string;
  matricule?: string;
  identifier?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: 'F' | 'M';
  birthDate?: string;
  birthPlace?: string;
  hireDate?: string;
  contractType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  diploma?: string;
  experience?: number | null;
  salaryMode?: 'Mensuel' | 'Horaire';
  salary?: number | null;
  hourlyRate?: number | null;
  type?: string;
  role?: string;
  function?: string;
  subject?: string;
  establishment?: string;
  scope?: string;
  campus?: string;
  status: string;
  campusIds?: string[];
  establishmentIds?: string[];
}

interface CompteCandidatRow extends InstituteDirectoryRow {
  candidateType: CompteCandidatInstitut['type'];
  eligible: boolean;
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
  id?: string;
  code: string;
  label: string;
  module: string;
  description: string;
}

interface InstituteRole {
  id: string;
  code?: string;
  label: string;
  description: string;
  users: number;
  permissions: string[];
}

@Component({
  selector: 'app-institute-console',
  imports: [RouterLink, BreadcrumbComponent, FormsModule, MasterTableComponent, DecimalPipe, TemplateMultiselectDirective, StudentTransfersComponent],
  templateUrl: './institute-console.component.html',
  styleUrl: './institute-console.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstituteConsoleComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workspace = inject(InstituteWorkspaceService);
  readonly primaryWorkspace = inject(PrimaryWorkspaceService);
  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  readonly activeView = this.workspace.activeView;
  readonly establishments = signal<Establishment[]>([]);
  private readonly establishmentsCatalogue = signal<Establishment[]>([]);
  private readonly establishmentsAccessEffect = effect(() => {
    const catalogue = this.establishmentsCatalogue();
    const acces = this.api.accesUtilisateur();
    if (!catalogue.length) return;
    if (!acces || acces.administrateur || acces.acces_tous_etablissements) {
      this.establishments.set(catalogue);
      return;
    }
    this.establishments.set(catalogue.filter((item) => item.workspaceId && acces.etablissement_ids.includes(item.workspaceId)));
  });
  readonly instituteName = signal('Institut');
  readonly connectedUserName = signal('');
  readonly subscriptionLoading = signal(false);
  readonly subscriptionDurationDays = signal(30);
  readonly subscriptionSaving = signal(false);
  readonly subscriptionInterruptModalOpen = signal(false);
  readonly subscriptionStatus = signal<string | null>(null);
  readonly subscriptionDaysRemaining = signal<number | null>(null);
  readonly subscriptionInvoices = signal<FactureSouscriptionInstitut[]>([]);
  readonly subscriptionInvoicesSource = new MatTableDataSource<FactureSouscriptionInstitut & { etat_paiement: string }>();
  readonly subscriptionError = signal<string | null>(null);
  readonly subscriptionSuccess = signal<string | null>(null);
  readonly backendRefreshing = signal(false);
  readonly selectedSubscriptionType = signal<SubscriptionType | null>(null);
  readonly activeEstablishmentsCount = computed(() => this.establishments().filter((item) => item.active).length);
  readonly activeEstablishments = computed(() => this.establishments().filter((item) => item.active));
  readonly subscriptionInvoicesColumns: ColumnDefinition[] = [
    { def: 'numero', label: 'Référence', type: 'text', visible: true, sortable: true },
    { def: 'montant_ttc', label: 'Montant', type: 'number', visible: true, sortable: true },
    { def: 'emise_at', label: 'Émise le', type: 'date', visible: true, sortable: true },
    { def: 'echeance_at', label: 'Échéance', type: 'date', visible: true, sortable: true },
    { def: 'etat_paiement', label: 'État', type: 'status', visible: true, sortable: true, statusBadgeMap: { Payé: 'badge badge-solid-green', 'À régler': 'badge badge-solid-red' } },
  ];

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
  readonly usersLoading = signal(false);
  readonly accountCandidateRows = signal<CompteCandidatRow[]>([]);
  readonly accountCandidateDataSource = new MatTableDataSource<CompteCandidatRow>([]);
  readonly accountCandidateCategory = signal<'all' | 'teachers' | 'staff' | 'guardians' | 'learners'>('all');
  readonly selectedAccountCandidates = signal<CompteCandidatRow[]>([]);
  readonly userCreationOpen = signal(false);
  readonly userCandidatesLoading = signal(false);
  readonly userCreationSaving = signal(false);
  readonly staffDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.staffRows);
  readonly teacherDataSource = new MatTableDataSource<InstituteDirectoryRow>(this.teacherRows);
  readonly membresEquipe = signal<MembreEquipeInstitut[]>([]);
  readonly subscriptionFeatureDataSource = new MatTableDataSource<FonctionnaliteSouscription>([]);
  readonly subscriptionFeatureColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', sortable: false },
    { def: 'libelle', label: 'Fonctionnalité', type: 'text', sortable: true },
    { def: 'code', label: 'Référence', type: 'text', sortable: true },
    { def: 'prix_unitaire_jour', label: 'Par jour (F CFA)', type: 'number', sortable: true },
    { def: 'prix_unitaire_eleve', label: 'Par élève (F CFA)', type: 'number', sortable: true },
    { def: 'prix_unitaire_personnel', label: 'Par collaborateur (F CFA)', type: 'number', sortable: true },
  ];
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
  readonly userCampusAccessIds = signal<string[]>([]);
  readonly userEstablishmentAccessIds = signal<string[]>([]);
  readonly passwordResetSent = signal(false);
  readonly userAssignedRoles = signal<string[]>([]);
  readonly userRoleAssignmentDraft = signal('');
  readonly userDirectPermissions = signal<string[]>([]);
  readonly selectedUserRolePermissionsId = signal<string | null>(null);
  readonly userDirectPermissionDataSource = new MatTableDataSource<PermissionDefinition>([]);
  readonly userRolePermissionsDataSource = new MatTableDataSource<PermissionDefinition>([]);
  readonly userScopeSaving = signal(false);
  readonly userSecuritySaving = signal(false);
  readonly activationResendSaving = signal(false);
  readonly roleManagementTab = signal<'roles' | 'permissions'>('roles');
  readonly roleFormOpen = signal(false);
  readonly roleSaving = signal(false);
  roleForm = { code: '', libelle: '', description: '' };
  readonly selectedRole = signal<InstituteRole | null>(null);
  readonly permissionSyncMessage = signal('Catalogue synchronisé le 28 août 2026 · 10:45');
  readonly permissionSpace = signal('all');
  readonly rolePermissionSpace = signal('all');
  readonly permissionCatalogue = signal<PermissionDefinition[]>([]);
  readonly permissionDataSource = new MatTableDataSource<PermissionDefinition>(this.permissionCatalogue());
  readonly rolePermissionDataSource = new MatTableDataSource<PermissionDefinition>(this.permissionCatalogue());
  readonly permissionSpaces = computed(() => ['all', ...Array.from(new Set(this.permissionCatalogue().map((permission) => permission.module).filter(Boolean))).sort((a, b) => a.localeCompare(b))]);
  readonly instituteRoles = signal<InstituteRole[]>([]);
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
    { def: 'matricule', label: 'Référence', type: 'text', visible: true },
    { def: 'identifier', label: 'Identifiant', type: 'text', visible: true },
    { def: 'name', label: 'Utilisateur', type: 'nameWithImage', visible: true },
    { def: 'type', label: 'Type', type: 'text', visible: true },
    { def: 'role', label: 'Rôle', type: 'text', visible: true },
    { def: 'scope', label: 'Périmètre', type: 'text', visible: true },
    { def: 'status', label: 'Statut', type: 'status', visible: true, statusBadgeMap: { Actif: 'badge badge-solid-green', 'Invitation envoyée': 'badge badge-solid-blue', 'Désactivé': 'badge badge-solid-red' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly permissionColumns: ColumnDefinition[] = [
    { def: 'label', label: 'Permission', type: 'text', visible: true, sortable: true },
    { def: 'module', label: 'Espace', type: 'text', visible: true, sortable: true },
    { def: 'description', label: 'Description', type: 'text', visible: true },
  ];
  readonly rolePermissionColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    ...this.permissionColumns,
  ];
  readonly userDirectPermissionColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    ...this.permissionColumns,
  ];
  readonly accountCandidateColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Référence', type: 'text', visible: true },
    { def: 'name', label: 'Profil', type: 'nameWithImage', visible: true },
    { def: 'type', label: 'Type', type: 'text', visible: true },
    { def: 'phone', label: 'Téléphone / identifiant', type: 'phone', visible: true },
    { def: 'status', label: 'Éligibilité', type: 'status', visible: true, statusBadgeMap: { 'Prêt à créer': 'badge badge-solid-green', 'Téléphone à renseigner': 'badge badge-solid-orange' } },
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
  readonly subscriptionPackages = signal<PackageSouscription[]>([]);
  readonly selectedPackageVersionId = signal<string | null>(null);
  readonly subscriptionMode = signal<'package' | 'custom'>('package');
  readonly selectedPackage = computed(() => this.subscriptionPackages()
    .find((item) => item.version_id === this.selectedPackageVersionId()) ?? null);

  readonly activeSubscriptionCount = computed(
    () => this.subscriptionTypes().flatMap((item) => item.functionalities).filter((item) => item.selectionnee).length,
  );
  readonly subscriptionCustomDailyAmount = computed(() => this.subscriptionTypes()
    .flatMap((type) => type.functionalities)
    .filter((feature) => feature.selectionnee)
    .reduce((total, feature) => total + feature.prix_unitaire_jour, 0));
  readonly subscriptionCustomLearnerAmount = computed(() => this.subscriptionTypes()
    .reduce((total, type) => total + type.functionalities
      .filter((feature) => feature.selectionnee)
      .reduce((subtotal, feature) => subtotal + (feature.prix_unitaire_eleve * type.learnerCount), 0), 0));
  readonly subscriptionCustomStaffAmount = computed(() => this.subscriptionTypes()
    .reduce((total, type) => total + type.functionalities
      .filter((feature) => feature.selectionnee)
      .reduce((subtotal, feature) => subtotal + (feature.prix_unitaire_personnel * type.staffCount), 0), 0));
  readonly subscriptionEstimatedTotal = computed(() => {
    const packageSouscription = this.selectedPackage();
    if (this.subscriptionMode() === 'package' && packageSouscription) {
      return packageSouscription.montant_estime;
    }
    return (this.subscriptionCustomDailyAmount() * this.subscriptionDurationDays())
      + this.subscriptionCustomLearnerAmount()
      + this.subscriptionCustomStaffAmount();
  });
  readonly subscriptionBillableLearners = computed(() => {
    const packageSouscription = this.selectedPackage();
    if (this.subscriptionMode() === 'package' && packageSouscription) return packageSouscription.nombre_eleves;
    return this.subscriptionTypes()
      .filter((type) => type.functionalities.some((feature) => feature.selectionnee))
      .reduce((total, type) => total + type.learnerCount, 0);
  });
  readonly subscriptionBillableStaff = computed(() => {
    const packageSouscription = this.selectedPackage();
    if (this.subscriptionMode() === 'package' && packageSouscription) return packageSouscription.nombre_personnels;
    return this.subscriptionTypes()
      .filter((type) => type.functionalities.some((feature) => feature.selectionnee))
      .reduce((total, type) => total + type.staffCount, 0);
  });
  readonly subscriptionCalculationLabel = computed(() => {
    const jours = this.subscriptionMode() === 'package'
      ? (this.selectedPackage()?.duree_jours ?? this.subscriptionDurationDays())
      : this.subscriptionDurationDays();
    const eleves = this.subscriptionBillableLearners();
    const collaborateurs = this.subscriptionBillableStaff();
    if (this.subscriptionMode() === 'package') {
      return `Calculé pour ${eleves} élève(s) et ${collaborateurs} enseignant(s) / personnel(s), avec un accès de ${jours} jours.`;
    }
    return `Inclut ${jours} jour(s) d’accès, les tarifs appliqués à ${eleves} élève(s) et à ${collaborateurs} enseignant(s) / personnel(s).`;
  });

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
    if (!this.workspace.subscriptionValidated() && !['overview', 'establishments', 'campuses', 'subscription', 'subscription-invoices'].includes(this.activeView())) {
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
        this.establishmentsCatalogue.set(espace.etablissements.map((item) => this.presenterEtablissement(item)));
        this.chargerSalles();
        this.chargerEquipe();
        this.chargerUtilisateurs();
        this.chargerRolesPermissions();
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

  private chargerEquipe(): void {
    this.api.equipeInstitut().subscribe({
      next: ({ data }) => {
        this.membresEquipe.set(data);
        const personnel = data.filter((membre) => !membre.est_enseignant).map((membre) => this.presenterMembreEquipe(membre));
        const enseignants = data.filter((membre) => membre.est_enseignant).map((membre) => this.presenterMembreEquipe(membre));
        this.staffRows.splice(0, this.staffRows.length, ...personnel);
        this.teacherRows.splice(0, this.teacherRows.length, ...enseignants);
        this.staffDataSource.data = personnel;
        this.teacherDataSource.data = enseignants;
      },
      error: (erreur: HttpErrorResponse) => {
        if (erreur.status !== 401 && erreur.status !== 419) this.subscriptionError.set('La liste de l’équipe est momentanément indisponible.');
      },
    });
  }

  private chargerUtilisateurs(): void {
    this.usersLoading.set(true);
    this.api.utilisateursInstitut().subscribe({
      next: ({ data }) => {
        this.userRows.splice(0, this.userRows.length, ...data.map((item) => this.presenterUtilisateur(item)));
        this.selectUserCategory(this.userCategory());
        this.usersLoading.set(false);
      },
      error: () => {
        this.usersLoading.set(false);
        // Les données de démonstration restent visibles si le répertoire est temporairement indisponible.
      },
    });
  }

  private presenterUtilisateur(item: UtilisateurInstitutApi): InstituteDirectoryRow {
    const statut: Record<string, string> = {
      actif: 'Actif',
      en_attente_activation: 'Invitation envoyée',
      suspendu: 'Désactivé',
    };
    return {
      id: item.id,
      matricule: item.matricule ?? undefined,
      identifier: item.identifiant ?? undefined,
      name: `${item.prenom ?? ''} ${item.nom ?? ''}`.trim(),
      firstName: item.prenom,
      lastName: item.nom,
      email: item.email ?? undefined,
      phone: item.telephone ?? undefined,
      type: item.type,
      role: item.role,
      scope: item.scope,
      status: statut[item.statut] ?? item.statut,
    };
  }

  private chargerRolesPermissions(): void {
    this.api.rolesPermissionsInstitut().subscribe({
      next: ({ roles, permissions }) => {
        this.permissionCatalogue.set(permissions.map((permission: PermissionInstitutApi) => ({
          id: permission.id, code: permission.code, label: permission.libelle, module: permission.module, description: permission.description,
        })));
        this.instituteRoles.set(roles.map((role: RoleInstitutApi) => ({
          id: role.id, code: role.code, label: role.libelle, description: role.description, users: role.users, permissions: role.permissions,
        })));
        this.selectPermissionSpace(this.permissionSpace());
        this.selectRolePermissionSpace(this.rolePermissionSpace());
        this.actualiserTablesPermissionsUtilisateur();
      },
      error: () => { /* conserver le catalogue embarqué si le service est indisponible */ },
    });
  }

  private permissionsDeEspace(espace: string): PermissionDefinition[] {
    return espace === 'all'
      ? this.permissionCatalogue()
      : this.permissionCatalogue().filter((permission) => permission.module === espace);
  }

  selectPermissionSpace(espace: string): void {
    this.permissionSpace.set(espace);
    this.permissionDataSource.data = this.permissionsDeEspace(espace);
  }

  selectRolePermissionSpace(espace: string): void {
    this.rolePermissionSpace.set(espace);
    this.rolePermissionDataSource.data = this.permissionsDeEspace(espace);
  }

  permissionSpaceCount(espace: string): number {
    return espace === 'all' ? this.permissionCatalogue().length : this.permissionCatalogue().filter((permission) => permission.module === espace).length;
  }

  selectedRolePermissions(): PermissionDefinition[] {
    const role = this.selectedRole();
    return role ? this.permissionCatalogue().filter((permission) => role.permissions.includes(permission.code)) : [];
  }

  selectedRolePermissionsForCurrentSpace(): PermissionDefinition[] {
    const permissions = this.selectedRolePermissions();
    return this.rolePermissionSpace() === 'all'
      ? permissions
      : permissions.filter((permission) => permission.module === this.rolePermissionSpace());
  }

  setRolePermissionSelection(selection: PermissionDefinition[]): void {
    const role = this.selectedRole();
    if (!role) return;
    const visibles = this.permissionsDeEspace(this.rolePermissionSpace()).map((permission) => permission.code);
    const permissions = [
      ...role.permissions.filter((code) => !visibles.includes(code)),
      ...selection.map((permission) => permission.code),
    ];
    const next = { ...role, permissions: [...new Set(permissions)] };
    this.instituteRoles.update((roles) => roles.map((item) => item.id === role.id ? next : item));
    this.selectedRole.set(next);
  }

  enregistrerPermissionsRole(): void {
    const role = this.selectedRole();
    if (!role) return;
    this.api.enregistrerPermissionsRoleInstitut(role.id, role.permissions).subscribe({
      next: (result) => this.toast.success(result.message),
      error: () => this.toast.error('Les permissions du rôle n’ont pas pu être enregistrées.'),
    });
  }

  ouvrirFormulaireRole(): void {
    this.roleForm = { code: '', libelle: '', description: '' };
    this.roleFormOpen.set(true);
  }

  fermerFormulaireRole(): void { this.roleFormOpen.set(false); }

  creerRole(): void {
    if (!this.roleForm.code.trim() || !this.roleForm.libelle.trim() || this.roleSaving()) return;
    this.roleSaving.set(true);
    this.api.creerRoleInstitut({ code: this.roleForm.code.trim().toLowerCase(), libelle: this.roleForm.libelle.trim(), description: this.roleForm.description.trim() || undefined }).subscribe({
      next: (result) => { this.roleSaving.set(false); this.roleFormOpen.set(false); this.chargerRolesPermissions(); this.toast.success(result.message); },
      error: (error) => { this.roleSaving.set(false); this.toast.error(error?.error?.message ?? 'Le rôle n’a pas pu être créé.'); },
    });
  }

  private presenterMembreEquipe(membre: MembreEquipeInstitut): InstituteDirectoryRow {
    const rattachements = membre.rattachements ?? [];
    return {
      id: membre.id,
      matricule: membre.matricule,
      name: `${membre.prenom} ${membre.nom}`.trim(),
      firstName: membre.prenom,
      lastName: membre.nom,
      email: membre.email ?? undefined,
      phone: membre.telephone ?? undefined,
      address: membre.adresse ?? undefined,
      gender: membre.sexe ?? undefined,
      birthDate: membre.date_naissance ?? undefined,
      birthPlace: membre.lieu_naissance ?? undefined,
      hireDate: membre.date_embauche ?? undefined,
      contractType: membre.type_contrat ?? undefined,
      emergencyContact: membre.contact_urgence_nom ?? undefined,
      emergencyPhone: membre.contact_urgence_telephone ?? undefined,
      function: membre.fonction ?? undefined,
      subject: membre.specialite ?? membre.fonction ?? undefined,
      diploma: membre.diplome ?? undefined,
      experience: membre.experience_annees ?? null,
      salaryMode: membre.type_remuneration === 'horaire' ? 'Horaire' : 'Mensuel',
      salary: membre.montant_mensuel ?? null,
      hourlyRate: membre.montant_heure ?? null,
      establishment: [...new Set(rattachements.map((rattachement) => rattachement.type))].join(' · '),
      campus: [...new Set(rattachements.map((rattachement) => rattachement.campus))].join(' · '),
      scope: rattachements.map((rattachement) => `${rattachement.type} · ${rattachement.campus}`).join(' | '),
      status: membre.statut === 'actif' ? 'Actif' : membre.statut === 'conge' ? 'En congé' : membre.statut === 'suspendu' ? 'Suspendu' : membre.statut,
      campusIds: rattachements.map((rattachement) => rattachement.campus_id),
      establishmentIds: rattachements.map((rattachement) => rattachement.etablissement_id),
    };
  }

  private chargerSouscription(): void {
    this.api.souscriptionInstitut().subscribe({
      next: (souscription) => {
        const types = souscription.types.map((item) => this.presenterSouscription(item));
        this.subscriptionTypes.set(types);
        this.subscriptionPackages.set(souscription.packages ?? []);
        this.subscriptionStatus.set(souscription.statut);
        this.subscriptionDaysRemaining.set(souscription.jours_restants ?? null);
        this.selectedPackageVersionId.set(souscription.version_forfait_id ?? null);
        this.subscriptionMode.set(souscription.version_forfait_id
          ? 'package'
          : souscription.abonnement_id
            ? 'custom'
            : souscription.packages?.length
              ? 'package'
              : 'custom');
        if (souscription.duree_jours) this.subscriptionDurationDays.set(souscription.duree_jours);
        this.selectedSubscriptionType.set(
          types.find((item) => item.enabled && item.functionalities.length > 0) ?? null,
        );
        this.rafraichirTableFonctionnalites();
        this.workspace.configureSubscriptionAccess(souscription.validee, souscription.fonctionnalites_actives);
        this.chargerFacturesSouscription();
        if (!souscription.validee && this.activeView() !== 'subscription') {
          void this.router.navigateByUrl(this.workspace.cheminVue('subscription'), { replaceUrl: true });
        }
        this.subscriptionLoading.set(false);
        if (this.backendRefreshing()) {
          this.backendRefreshing.set(false);
          this.subscriptionSuccess.set('Les informations ont été réactualisées.');
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

  private chargerFacturesSouscription(): void {
    this.api.facturesSouscriptionsInstitut().subscribe({
      next: ({ data }) => {
        this.subscriptionInvoices.set(data);
        this.subscriptionInvoicesSource.data = data.map((facture) => ({
          ...facture,
          etat_paiement: facture.statut === 'reglee' ? 'Payé' : 'À régler',
        }));
      },
      error: () => { this.subscriptionInvoicesSource.data = []; },
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
      workspaceId: item.etablissement_id,
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
      learnerCount: item.nombre_eleves ?? 0,
      staffCount: item.nombre_personnels ?? 0,
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
      const campusId = this.primaryWorkspace.selectedCampusId();
      void this.router.navigateByUrl(campusId ? `${path}?campus=${encodeURIComponent(campusId)}` : path);
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

  openUserAccountCreation(): void {
    this.userCreationOpen.set(true);
    this.selectedAccountCandidates.set([]);
    this.loadAccountCandidates();
  }

  closeUserAccountCreation(): void {
    this.userCreationOpen.set(false);
    this.selectedAccountCandidates.set([]);
  }

  private loadAccountCandidates(): void {
    this.userCandidatesLoading.set(true);
    this.api.candidatsComptesInstitut().subscribe({
      next: ({ data }) => {
        this.accountCandidateRows.set(data.map((candidate) => this.presenterCompteCandidat(candidate)));
        this.selectAccountCandidateCategory(this.accountCandidateCategory());
        this.userCandidatesLoading.set(false);
      },
      error: () => { this.userCandidatesLoading.set(false); this.toast.error('Les profils sans compte ne sont pas disponibles pour le moment.'); },
    });
  }

  selectAccountCandidateCategory(category: 'all' | 'teachers' | 'staff' | 'guardians' | 'learners'): void {
    this.accountCandidateCategory.set(category);
    const type = category === 'teachers' ? 'enseignant' : category === 'staff' ? 'personnel' : category === 'guardians' ? 'tuteur' : category === 'learners' ? 'eleve' : null;
    this.accountCandidateDataSource.data = type
      ? this.accountCandidateRows().filter((candidate) => candidate.candidateType === type)
      : this.accountCandidateRows();
  }

  accountCandidateCount(category: 'all' | 'teachers' | 'staff' | 'guardians' | 'learners'): number {
    const type = category === 'teachers' ? 'enseignant' : category === 'staff' ? 'personnel' : category === 'guardians' ? 'tuteur' : category === 'learners' ? 'eleve' : null;
    return type ? this.accountCandidateRows().filter((candidate) => candidate.candidateType === type).length : this.accountCandidateRows().length;
  }

  setSelectedAccountCandidates(rows: CompteCandidatRow[]): void {
    this.selectedAccountCandidates.set(rows.filter((row) => row.eligible));
  }

  createSelectedAccounts(): void {
    const rows = this.selectedAccountCandidates();
    if (!rows.length || this.userCreationSaving()) return;
    this.userCreationSaving.set(true);
    this.api.creerComptesInstitut(rows.map((row) => ({ id: row.id!, type: row.candidateType }))).subscribe({
      next: (result) => {
        this.userCreationSaving.set(false);
        this.closeUserAccountCreation();
        this.chargerUtilisateurs();
        this.toast.success(result.message);
        if (result.erreurs.length) this.toast.error(result.erreurs[0].message);
      },
      error: (error) => { this.userCreationSaving.set(false); this.toast.error(error?.error?.message ?? 'Les comptes n’ont pas pu être créés.'); },
    });
  }

  private presenterCompteCandidat(candidate: CompteCandidatInstitut): CompteCandidatRow {
    const labels: Record<CompteCandidatInstitut['type'], string> = { personnel: 'Personnel', enseignant: 'Enseignant', tuteur: 'Tuteur', eleve: 'Élève' };
    return {
      id: candidate.id, matricule: candidate.matricule, name: `${candidate.prenom} ${candidate.nom}`.trim(),
      firstName: candidate.prenom, lastName: candidate.nom, email: candidate.email ?? undefined,
      phone: candidate.telephone ?? undefined, type: labels[candidate.type], candidateType: candidate.type,
      eligible: candidate.eligible, status: candidate.eligible ? 'Prêt à créer' : 'Téléphone à renseigner',
    };
  }

  viewUser(record: InstituteDirectoryRow): void {
    this.selectedUserRecord.set(record);
    this.userRecordTab.set('roles');
    this.passwordResetSent.set(false);
    this.userRole.set(record.role || 'Gestionnaire d’établissement');
    this.userRoleAssignmentDraft.set('');
    this.userDirectPermissions.set([]);
    this.userAssignedRoles.set([]);
    this.userCampusAccessIds.set([]);
    this.userEstablishmentAccessIds.set([]);
    this.selectedUserRolePermissionsId.set(null);
    this.actualiserTablesPermissionsUtilisateur();
    this.setView('user-detail');
    if (!record.id) return;
    this.api.accesUtilisateurInstitut(record.id).subscribe({
      next: ({ data }) => {
        this.userAssignedRoles.set(data.role_ids);
        this.userDirectPermissions.set(data.permission_codes);
        this.userCampusAccessIds.set(data.campus_ids);
        this.userEstablishmentAccessIds.set(data.etablissement_ids);
        this.actualiserTablesPermissionsUtilisateur();
      },
      error: (error) => this.toast.error(error?.error?.message ?? 'Les autorisations de cet utilisateur n’ont pas pu être chargées.'),
    });
  }

  setUserRecordTab(tab: UserRecordTab): void {
    this.userRecordTab.set(tab);
  }

  assignRoleToUser(): void {
    const roleId = this.userRoleAssignmentDraft();
    if (!roleId) return;
    this.userAssignedRoles.update((roles) => roles.includes(roleId) ? roles : [...roles, roleId]);
    this.userRoleAssignmentDraft.set('');
    this.actualiserTablesPermissionsUtilisateur();
    this.enregistrerAccesUtilisateur();
  }

  removeRoleFromUser(roleId: string): void {
    this.userAssignedRoles.update((roles) => roles.filter((item) => item !== roleId));
    if (this.selectedUserRolePermissionsId() === roleId) this.selectedUserRolePermissionsId.set(null);
    this.actualiserTablesPermissionsUtilisateur();
    this.enregistrerAccesUtilisateur();
  }

  private enregistrerAccesUtilisateur(): void {
    const user = this.selectedUserRecord();
    if (!user?.id) return;
    this.api.enregistrerAccesUtilisateurInstitut(user.id, this.userAssignedRoles(), this.userDirectPermissions()).subscribe({
      next: () => this.toast.success('Les accès de l’utilisateur ont été enregistrés.'),
      error: () => this.toast.error('Les accès de l’utilisateur n’ont pas pu être enregistrés.'),
    });
  }

  private actualiserTablesPermissionsUtilisateur(): void {
    this.userDirectPermissionDataSource.data = this.permissionCatalogue();
    const roleId = this.selectedUserRolePermissionsId();
    this.userRolePermissionsDataSource.data = roleId ? this.permissionsForRole(roleId) : [];
  }

  afficherPermissionsRoleUtilisateur(roleId: string): void {
    this.selectedUserRolePermissionsId.set(roleId);
    this.actualiserTablesPermissionsUtilisateur();
  }

  readonly permissionHeriteeParRole = (permission: PermissionDefinition): boolean =>
    this.userAssignedRoles().some((roleId) => this.permissionsForRole(roleId).some((item) => item.code === permission.code));

  selectedUserDirectPermissions(): PermissionDefinition[] {
    return this.permissionCatalogue().filter((permission) => this.userDirectPermissions().includes(permission.code));
  }

  setUserDirectPermissionSelection(selection: PermissionDefinition[]): void {
    this.userDirectPermissions.set(selection
      .filter((permission) => !this.permissionHeriteeParRole(permission))
      .map((permission) => permission.code));
    this.enregistrerAccesUtilisateur();
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
    this.selectRolePermissionSpace('all');
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
    this.chargerRolesPermissions();
    this.permissionSyncMessage.set('Catalogue synchronisé maintenant');
  }

  toggleUserCampus(campusId: string): void {
    this.userCampusAccessIds.update((campuses) => campuses.includes(campusId)
      ? campuses.filter((item) => item !== campusId)
      : [...campuses, campusId]);
  }

  toggleUserEstablishment(establishmentId: string): void {
    this.userEstablishmentAccessIds.update((establishments) => establishments.includes(establishmentId)
      ? establishments.filter((item) => item !== establishmentId)
      : [...establishments, establishmentId]);
  }

  enregistrerPerimetreUtilisateur(): void {
    const user = this.selectedUserRecord();
    if (!user?.id || this.userScopeSaving()) return;
    this.userScopeSaving.set(true);
    this.api.enregistrerPerimetreUtilisateurInstitut(user.id, this.userAssignedRoles(), this.userDirectPermissions(), this.userCampusAccessIds(), this.userEstablishmentAccessIds()).subscribe({
      next: (result) => { this.userScopeSaving.set(false); this.toast.success(result.message); },
      error: (error) => { this.userScopeSaving.set(false); this.toast.error(error?.error?.message ?? 'Le périmètre d’accès n’a pas pu être enregistré.'); },
    });
  }

  changerStatutUtilisateur(statut: 'actif' | 'suspendu'): void {
    const user = this.selectedUserRecord();
    if (!user?.id || this.userSecuritySaving()) return;
    this.userSecuritySaving.set(true);
    this.api.changerStatutUtilisateurInstitut(user.id, statut).subscribe({
      next: (result) => {
        this.userSecuritySaving.set(false);
        const status = statut === 'actif' ? 'Actif' : 'Désactivé';
        const misAJour = { ...user, status };
        this.selectedUserRecord.set(misAJour);
        const index = this.userRows.findIndex((row) => row.id === user.id);
        if (index >= 0) this.userRows.splice(index, 1, misAJour);
        this.selectUserCategory(this.userCategory());
        this.toast.success(result.message);
      },
      error: (error) => { this.userSecuritySaving.set(false); this.toast.error(error?.error?.message ?? 'L’état du compte n’a pas pu être modifié.'); },
    });
  }

  renvoyerActivationUtilisateur(): void {
    const user = this.selectedUserRecord();
    if (!user?.id || this.activationResendSaving() || user.status !== 'Invitation envoyée') return;
    this.activationResendSaving.set(true);
    this.api.renvoyerActivationUtilisateurInstitut(user.id).subscribe({
      next: (result) => { this.activationResendSaving.set(false); this.toast.success(result.message); },
      error: (error) => { this.activationResendSaving.set(false); this.toast.error(error?.error?.message ?? 'Le code d’activation n’a pas pu être envoyé.'); },
    });
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
    this.staffForm = record ? { ...record, campusIds: record.campusIds ?? [], establishmentIds: record.establishmentIds ?? [] } : this.emptyStaffForm();
    this.selectedStaffRecord.set(null);
    this.staffEditorOpen.set(true);
    if (this.activeView() === 'staff-detail') this.setView('staff');
  }

  saveStaff(): void {
    if (!this.staffForm.firstName?.trim() || !this.staffForm.lastName?.trim() || !this.staffForm.function?.trim() || !this.staffForm.campusIds?.length || !this.staffForm.establishmentIds?.length) return;
    this.enregistrerMembreEquipe(this.staffForm, false);
  }

  private enregistrerMembreEquipe(form: InstituteDirectoryRow, estEnseignant: boolean): void {
    const prenom = form.firstName?.trim() || form.name.trim().split(/\s+/).shift() || '';
    const nom = form.lastName?.trim() || form.name.trim().split(/\s+/).slice(1).join(' ') || prenom;
    const rattachements = (form.establishmentIds ?? []).flatMap((etablissement_id) => (form.campusIds ?? []).map((campus_id) => ({ etablissement_id, campus_id })));
    this.api.enregistrerMembreEquipe({
      id: form.id, est_enseignant: estEnseignant, matricule: form.matricule, prenom, nom,
      sexe: form.gender, date_naissance: form.birthDate, lieu_naissance: form.birthPlace,
      telephone: form.phone, email: form.email, adresse: form.address, fonction: form.function,
      date_embauche: form.hireDate, type_contrat: form.contractType, statut: this.statutApi(form.status),
      contact_urgence_nom: form.emergencyContact, contact_urgence_telephone: form.emergencyPhone,
      specialite: form.subject, diplome: form.diploma, experience_annees: form.experience,
      type_remuneration: form.salaryMode === 'Horaire' ? 'horaire' : 'mensuelle', salaire_mensuel: form.salary,
      montant_heure: form.hourlyRate, rattachements,
    }).subscribe({
      next: () => { this.staffEditorOpen.set(false); this.teacherEditorOpen.set(false); this.chargerEquipe(); this.toast.success('Dossier enregistré.'); },
      error: (error) => this.toast.error(error?.error?.message ?? 'Le dossier n’a pas pu être enregistré.'),
    });
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

  saveStaffAssignments(record: InstituteDirectoryRow): void {
    this.saveAssignments(record);
  }

  startTeacherForm(record?: InstituteDirectoryRow): void {
    this.teacherForm = record ? { ...record, campusIds: record.campusIds ?? [], establishmentIds: record.establishmentIds ?? [] } : this.emptyTeacherForm();
    this.selectedTeacherRecord.set(null);
    this.teacherEditorOpen.set(true);
    if (this.activeView() === 'teacher-detail') this.setView('teachers');
  }

  saveTeacher(): void {
    if (!this.teacherForm.firstName?.trim() || !this.teacherForm.lastName?.trim() || !this.teacherForm.subject?.trim() || !this.teacherForm.campusIds?.length || !this.teacherForm.establishmentIds?.length) return;
    this.enregistrerMembreEquipe(this.teacherForm, true);
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

  saveTeacherAssignments(record: InstituteDirectoryRow): void {
    this.saveAssignments(record);
  }

  private saveAssignments(record: InstituteDirectoryRow): void {
    if (!record.id || !record.campusIds?.length || !record.establishmentIds?.length) return;
    const rattachements = record.establishmentIds.flatMap((etablissement_id) =>
      (record.campusIds ?? []).map((campus_id) => ({ etablissement_id, campus_id })));
    this.api.enregistrerRattachementsEquipe(record.id, rattachements).subscribe({
      next: () => { this.chargerEquipe(); this.toast.success('Les rattachements ont été enregistrés.'); },
      error: (error) => this.toast.error(error?.error?.message ?? 'Les rattachements n’ont pas pu être enregistrés.'),
    });
  }

  setStaffRecordTab(tab: StaffRecordTab): void {
    this.staffRecordTab.set(tab);
  }

  setTeacherRecordTab(tab: TeacherRecordTab): void {
    this.teacherRecordTab.set(tab);
  }

  private emptyStaffForm(): InstituteDirectoryRow {
    return { matricule: '', name: '', firstName: '', lastName: '', email: '', phone: '', function: '', campus: '', status: 'Actif', salaryMode: 'Mensuel', campusIds: [], establishmentIds: [] };
  }

  private emptyTeacherForm(): InstituteDirectoryRow {
    return { matricule: '', name: '', firstName: '', lastName: '', email: '', phone: '', establishment: '', subject: '', campus: '', status: 'Actif', salaryMode: 'Mensuel', campusIds: [], establishmentIds: [] };
  }

  private statutApi(statut: string): 'actif' | 'conge' | 'suspendu' {
    return statut === 'En congé' ? 'conge' : statut === 'Suspendu' ? 'suspendu' : 'actif';
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
      default: return 'Nouvel utilisateur';
    }
  }

  openDirectoryForm(): void {
    if (this.activeView() === 'users') this.openUserAccountCreation();
    if (this.activeView() === 'staff') this.startStaffForm();
    if (this.activeView() === 'teachers') this.startTeacherForm();
  }

  refreshDirectory(): void {
    this.chargerUtilisateurs();
  }

  userCategoryCount(category: 'all' | 'teachers' | 'staff' | 'guardians' | 'learners'): number {
    const type = category === 'teachers' ? 'Enseignant' : category === 'staff' ? 'Personnel' : category === 'guardians' ? 'Tuteur' : category === 'learners' ? 'Élève' : null;
    return type ? this.userRows.filter((user) => user.type === type).length : this.userRows.length;
  }

  breadcrumbActive(): string {
    const labels: Record<InstituteView, string> = {
      overview: 'Tableau de bord',
      establishments: 'Établissements',
      campuses: 'Campus',
      'student-transfers': 'Transferts d’élèves',
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
      'subscription-invoices': 'Factures',
      settings: 'Paramètres',
    };
    return labels[this.activeView()];
  }

  ouvrirFonctionnalites(type: SubscriptionType): void {
    if (!type.enabled) return;
    this.selectedSubscriptionType.set(type);
    this.rafraichirTableFonctionnalites();
  }

  ouvrirPremierTypeActif(): void {
    const type = this.subscriptionTypes().find((item) => item.enabled);
    if (type) this.ouvrirFonctionnalites(type);
  }

  basculerFonctionnalite(fonctionnaliteId: string): void {
    const type = this.selectedSubscriptionType();
    if (!type) return;
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    this.subscriptionTypes.update((types) => types.map((item) => item.typeId !== type.typeId ? item : {
      ...item,
      functionalities: item.functionalities.map((fonctionnalite) => fonctionnalite.id === fonctionnaliteId
        ? { ...fonctionnalite, selectionnee: !fonctionnalite.selectionnee }
        : fonctionnalite),
    }));
    this.selectedSubscriptionType.set(this.subscriptionTypes().find((item) => item.typeId === type.typeId) ?? null);
    this.rafraichirTableFonctionnalites();
    this.selectedPackageVersionId.set(null);
    this.subscriptionMode.set('custom');
  }

  selectionnerToutesFonctionnalites(type: SubscriptionType, selectionnee: boolean): void {
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    this.subscriptionTypes.update((types) => types.map((item) => item.typeId !== type.typeId ? item : {
      ...item,
      functionalities: item.functionalities.map((fonctionnalite) => ({ ...fonctionnalite, selectionnee })),
    }));
    this.selectedSubscriptionType.set(
      this.subscriptionTypes().find((item) => item.typeId === type.typeId) ?? null,
    );
    this.rafraichirTableFonctionnalites();
    this.selectedPackageVersionId.set(null);
    this.subscriptionMode.set('custom');
  }

  fonctionnalitesSelectionneesDuType(type: SubscriptionType): FonctionnaliteSouscription[] {
    return type.functionalities.filter((fonctionnalite) => fonctionnalite.selectionnee);
  }

  choisirPackage(packageSouscription: PackageSouscription): void {
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    const fonctionnalites = new Set(packageSouscription.fonctionnalites_types_ids);
    this.subscriptionTypes.update((types) => types.map((type) => ({
      ...type,
      functionalities: type.functionalities.map((fonctionnalite) => ({
        ...fonctionnalite,
        selectionnee: fonctionnalites.has(fonctionnalite.id),
      })),
    })));
    this.selectedPackageVersionId.set(packageSouscription.version_id);
    this.subscriptionMode.set('package');
    this.subscriptionDurationDays.set(packageSouscription.duree_jours);
    this.selectedSubscriptionType.set(this.subscriptionTypes().find((type) => packageSouscription.type_etablissement_ids.includes(type.typeId)) ?? null);
    this.rafraichirTableFonctionnalites();
  }

  afficherPackages(): void {
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    this.subscriptionMode.set('package');
  }

  choisirOffreSurMesure(): void {
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    this.subscriptionMode.set('custom');
    this.selectedPackageVersionId.set(null);
    this.selectedSubscriptionType.set(
      this.subscriptionTypes().find((type) => type.enabled && type.functionalities.length > 0) ?? null,
    );
    this.rafraichirTableFonctionnalites();
  }

  synchroniserSelectionFonctionnalites(selection: FonctionnaliteSouscription[]): void {
    const type = this.selectedSubscriptionType();
    if (!type) return;

    const fonctionnalitesSelectionnees = new Set(selection.map((fonctionnalite) => fonctionnalite.id));
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    this.subscriptionTypes.update((types) => types.map((item) => item.typeId !== type.typeId ? item : {
      ...item,
      functionalities: item.functionalities.map((fonctionnalite) => ({
        ...fonctionnalite,
        selectionnee: fonctionnalitesSelectionnees.has(fonctionnalite.id),
      })),
    }));
    this.selectedSubscriptionType.set(this.subscriptionTypes().find((item) => item.typeId === type.typeId) ?? null);
    this.selectedPackageVersionId.set(null);
    this.subscriptionMode.set('custom');
    this.rafraichirTableFonctionnalites();
  }

  private rafraichirTableFonctionnalites(): void {
    this.subscriptionFeatureDataSource.data = this.selectedSubscriptionType()?.functionalities ?? [];
  }

  fonctionnalitesDuPackage(packageSouscription: PackageSouscription): string[] {
    const fonctionnalitesIds = new Set(packageSouscription.fonctionnalites_types_ids);
    return [...new Set(this.subscriptionTypes()
      .flatMap((type) => type.functionalities)
      .filter((feature) => fonctionnalitesIds.has(feature.id))
      .map((feature) => feature.libelle))];
  }

  nombreFonctionnalitesSelectionnees(type: SubscriptionType): number {
    return type.functionalities.filter((feature) => feature.selectionnee).length;
  }

  enregistrerSouscription(): void {
    if (this.subscriptionSaving()) return;
    this.subscriptionSaving.set(true);
    this.subscriptionError.set(null);
    this.subscriptionSuccess.set(null);
    if (this.subscriptionMode() === 'package' && !this.selectedPackageVersionId()) {
      this.subscriptionError.set('Choisissez un package avant de valider votre souscription.');
      this.subscriptionSaving.set(false);
      return;
    }
    const selection = this.subscriptionTypes()
      .flatMap((type) => type.functionalities)
      .filter((fonctionnalite) => fonctionnalite.selectionnee)
      .map((fonctionnalite) => fonctionnalite.id);

    if (!selection.length) {
      this.subscriptionError.set('Sélectionnez au moins une fonctionnalité commercialisée avant de valider.');
      this.subscriptionSaving.set(false);
      return;
    }

    const versionForfaitId = this.subscriptionMode() === 'package' ? this.selectedPackageVersionId() : null;
    this.api.enregistrerSouscriptionInstitut(selection, this.subscriptionDurationDays(), versionForfaitId).subscribe({
      next: (souscription) => {
          const types = souscription.types.map((item) => this.presenterSouscription(item));
          this.subscriptionTypes.set(types);
          this.subscriptionPackages.set(souscription.packages ?? []);
          this.subscriptionStatus.set(souscription.statut);
          this.subscriptionDaysRemaining.set(souscription.jours_restants ?? null);
          this.selectedPackageVersionId.set(souscription.version_forfait_id ?? null);
          this.subscriptionMode.set(souscription.version_forfait_id ? 'package' : 'custom');
          const selected = this.selectedSubscriptionType();
          this.selectedSubscriptionType.set(
            types.find((item) => item.typeId === selected?.typeId && item.enabled && item.functionalities.length > 0)
              ?? types.find((item) => item.enabled && item.functionalities.length > 0)
              ?? null,
          );
          this.workspace.configureSubscriptionAccess(souscription.validee, souscription.fonctionnalites_actives);
          this.subscriptionSuccess.set('Votre souscription est active. La facture sera générée à son échéance ou si vous l’interrompez.');
          this.subscriptionSaving.set(false);
      },
      error: (response: unknown) => {
        this.subscriptionError.set(this.subscriptionErrorMessage(response, 'La sauvegarde de votre souscription a échoué.'));
        this.subscriptionSaving.set(false);
      },
    });
  }

  interrompreSouscription(): void {
    if (this.subscriptionSaving() || this.subscriptionStatus() !== 'actif') return;
    this.subscriptionInterruptModalOpen.set(true);
  }

  confirmerInterruptionSouscription(): void {
    if (this.subscriptionSaving() || this.subscriptionStatus() !== 'actif') return;
    this.subscriptionSaving.set(true);
    this.subscriptionError.set(null);
    this.api.interrompreSouscriptionInstitut().subscribe({
      next: (souscription) => {
        this.subscriptionInterruptModalOpen.set(false);
        this.subscriptionStatus.set(souscription.statut);
        this.subscriptionDaysRemaining.set(null);
        this.workspace.configureSubscriptionAccess(false, []);
        this.subscriptionSuccess.set((souscription as SouscriptionInstitut & { message?: string }).message ?? 'Souscription interrompue.');
        this.subscriptionSaving.set(false);
        this.chargerSouscription();
      },
      error: (response: unknown) => {
        this.subscriptionError.set(this.subscriptionErrorMessage(response, 'La souscription n’a pas pu être interrompue.'));
        this.subscriptionSaving.set(false);
      },
    });
  }

  hasActiveFeature(code: string): boolean {
    return this.workspace.hasFeature(code);
  }

  subscriptionApproachingExpiration(): boolean {
    const jours = this.subscriptionDaysRemaining();
    return this.subscriptionStatus() === 'actif' && jours !== null && jours <= 5;
  }

  private subscriptionErrorMessage(response: unknown, fallback: string): string {
    return (response as { error?: { message?: string } })?.error?.message ?? fallback;
  }

  formatPrice(value: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(value)} F`;
  }
}
