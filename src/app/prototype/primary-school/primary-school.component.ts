import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { concat, toArray } from 'rxjs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  ColumnDefinition,
  MasterTableComponent,
} from '@shared/components/master-table/master-table.component';
import {
  PrimaryLocale,
  PrimaryView,
  PrimaryWorkspaceService,
} from './primary-workspace.service';
import {
  AnneeScolaireInstitut,
  ClasseEtablissementApi,
  ClasseEtablissementPayload,
  CandidatInscriptionApi,
  CentralApiService,
  DossiersEtablissementApi,
  EmploiTempsEtablissementApi,
  EvaluationEtablissementApi,
  SeanceEtablissementApi,
  FinancesEtablissementApi,
  OperationInscriptionApi,
  PedagogieEtablissementApi,
  PersonnelEtablissementApi,
  SerieLyceeEtablissementApi,
} from '../central-api.service';
import { AppToastService } from '@core/service/app-toast.service';

type AttendanceStatus = 'P' | 'A' | 'R';
type SubjectGradeKind = 'homework1' | 'homework2' | 'composition';
type GradeWeightKind = 'homeworkWeight' | 'compositionWeight';
type GuardianMode = 'existing' | 'new';
type PortalAccountStatus = 'Actif' | 'Invitation envoyée' | 'Non créé' | 'Désactivé';
type StudentRecordTab = 'identity' | 'schooling' | 'payments' | 'attendance' | 'access';
type TeacherRecordTab = 'profile' | 'teaching' | 'timetable' | 'salaries' | 'access';
type GuardianRecordTab = 'identity' | 'children' | 'access';
type TeacherSalaryMode = 'Mensuel' | 'Horaire';
type WorkforceImportKind = 'teacher' | 'staff';
type SessionStatus = 'Planifiée' | 'À compléter' | 'Terminée';
type SessionSortKey = 'date' | 'subject' | 'teacher' | 'status';
type AssessmentKind = 'Devoir' | 'Évaluation formative' | 'Contrôle' | 'Essai' | 'Composition';
type ReportAppreciation = 'Excellent' | 'Félicitations' | 'Encouragements' | 'Tableau d’honneur' | 'Passable, peut mieux faire' | 'Insuffisant';
type TimetableDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

interface TimetableCell {
  subject: string;
  teacherId: number | null;
  roomId: string | null;
}

interface TimetableRow {
  id: number;
  startTime: string;
  endTime: string;
  cells: Record<TimetableDay, TimetableCell>;
}

interface SchoolSession {
  id: string;
  classId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: number | null;
  status: SessionStatus;
  description: string;
  lessonTitle: string;
  programUnit: string;
  programProgress: number;
}

interface SessionGenerationForm {
  startDate: string;
  endDate: string;
  includeHolidays: boolean;
}

interface AssessmentAttachment {
  id: string;
  name: string;
  size: string;
}

interface AssessmentResult {
  studentId: number;
  participated: boolean;
  score: number | null;
  appreciation: string;
  attachments: AssessmentAttachment[];
}

interface PrimaryAssessment {
  id: string;
  title: string;
  type: AssessmentKind;
  trimester: string;
  classId: string;
  subject: string;
  evaluationDomainId: string;
  componentId: string;
  date: string;
  scale: number;
  teacherId: number | null;
  status: 'Brouillon' | 'À corriger' | 'Corrigée';
  results: AssessmentResult[];
}

interface SubjectGrade {
  homework1: number | null;
  homework2: number | null;
  composition: number | null;
}

interface GradeCalculationRule {
  homeworkWeight: number;
  compositionWeight: number;
}

interface PrimaryEvaluationComponent {
  id: string;
  label: string;
  shortLabel: string;
  category: 'Ressources' | 'Compétences' | 'Activité';
  scale: number;
}

interface PrimaryEvaluationDomain {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  components: PrimaryEvaluationComponent[];
}

type PrimaryEvaluationScores = Record<string, number | null>;

interface StudentPrimaryDomainSummary {
  domain: PrimaryEvaluationDomain;
  scores: PrimaryEvaluationScores;
  earned: number;
  scale: number;
  percentage: number;
}

interface PrimaryGrandTotal {
  earned: number;
  scale: number;
  percentage: number;
  hasScores: boolean;
}

interface ReportCardRow {
  domain: PrimaryEvaluationDomain;
  component: PrimaryEvaluationComponent;
  score: number | null;
}

interface UploadedReportTemplate {
  name: string;
  type: string;
  size: string;
  previewUrl: string | null;
}

interface StudentSubjectGradeSummary {
  subject: string;
  grade: SubjectGrade;
  homeworkAverage: string;
  subjectAverage: string;
  subjectAverageValue: number;
}

interface StudentAssessmentSummary {
  assessment: PrimaryAssessment;
  result: AssessmentResult;
}

interface TeacherTimetableCell {
  subject: string;
  className: string;
  room: string;
}

interface TeacherTimetableRow {
  id: number;
  startTime: string;
  endTime: string;
  cells: Record<TimetableDay, TeacherTimetableCell | null>;
}

interface SchoolRoom {
  id: string;
  campusId: string;
  name: string;
}

interface Campus {
  id: string;
  name: string;
  shortName: string;
  learners: number;
  classes: number;
  teachers: number;
  attendance: string;
  collected: string;
}

interface PrimaryLevelSetting {
  id: number | string;
  code: string;
  label: string;
}

interface TrimesterSetting {
  id: number | string;
  label: string;
  startDate: string;
  endDate: string;
}

interface PrimaryClass {
  id: string;
  campusId: string;
  name: string;
  level: string;
  enrolled: number;
  registrationFee: string;
  monthlyFee: string;
  seriesId?: string | null;
}

interface ClassFormModel {
  id: string | null;
  level: string;
  name: string;
  registrationFee: string;
  monthlyFee: string;
  seriesId: string;
}

interface ClassProposal {
  key: string;
  classId: string | null;
  enabled: boolean;
  level: string;
  name: string;
  registrationFee: string;
  monthlyFee: string;
  seriesId: string;
}

interface HighSchoolSeries {
  id: string;
  code: string;
  label: string;
  description: string;
  color: string;
  active: boolean;
}

interface HighSchoolSeriesForm {
  id: string | null;
  code: string;
  label: string;
  description: string;
  color: string;
  active: boolean;
}

interface ClassFeeConfiguration {
  academicYear: string;
  classId: string;
  registrationFee: string;
  monthlyFee: string;
}

type AdditionalFeeFrequency = 'Paiement unique' | 'Mensuel';

type ExpenseFrequency = 'Unique' | 'Mensuel';
type ExpenseTarget = 'Personnel' | 'Enseignants' | 'Personnel et enseignants';

interface ExpenseType {
  id: string;
  backendId?: string;
  label: string;
  frequency: ExpenseFrequency;
  target: ExpenseTarget;
  defaultAmount: number;
  active: boolean;
}

interface SchoolExpense {
  id: string;
  typeId: string;
  personnelId: string | null;
  label: string;
  category: string;
  frequency: ExpenseFrequency;
  amount: number;
  date: string;
  paymentDate: string | null;
  status: 'Prévue' | 'Payée' | 'Brouillon';
  beneficiary: string;
  staffIds: number[];
  notes: string;
}

interface ExpenseFormModel {
  id: string | null;
  typeId: string;
  label: string;
  frequency: ExpenseFrequency;
  amount: number;
  date: string;
  status: SchoolExpense['status'];
  beneficiary: string;
  notes: string;
}

interface ExpensePayee {
  key: string;
  backendId: string;
  name: string;
  reference: string;
  role: string;
  salary: number;
  salaryMode: TeacherSalaryMode;
  hourlyRate: number;
}

type FinanceDirection = 'Entrée' | 'Sortie';
type FinanceStatus = 'Validée' | 'En attente' | 'Annulée';
type FinancePaymentMethod = 'Espèces' | 'Wave' | 'Orange Money' | 'Virement' | 'Chèque';

interface FinanceEntry {
  id: string | number;
  campusId: string;
  amount: number;
  reason: string;
  direction: FinanceDirection;
  date: string;
  paymentMethod: FinancePaymentMethod;
  thirdParty: string;
  reference: string;
  status: FinanceStatus;
  source: 'Encaissements' | 'Dépenses' | 'Saisie manuelle';
  notes: string;
}

interface FinanceTableRow extends FinanceEntry {
  dateLabel: string;
  incomingAmount: string;
  outgoingAmount: string;
  canToggleStatus: boolean;
}

interface ConfirmationDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  icon: string;
  tone: 'danger' | 'warning';
}

interface FinanceEntryForm {
  direction: FinanceDirection;
  reason: string;
  amount: number;
  date: string;
  paymentMethod: FinancePaymentMethod;
  thirdParty: string;
  reference: string;
  status: FinanceStatus;
  notes: string;
}

interface AdditionalSchoolFee {
  id: string | number;
  academicYear: string;
  classId: string;
  label: string;
  amount: string;
  frequency: AdditionalFeeFrequency;
  required: boolean;
}

interface AdditionalFeeFormModel {
  classId: string;
  label: string;
  amount: string;
  frequency: AdditionalFeeFrequency;
  required: boolean;
}

interface CollectionFeeOption {
  id: string;
  label: string;
  amount: string;
  frequency: AdditionalFeeFrequency;
  required: boolean;
}

type MonthlyPaymentRecords = Record<string, Record<number, Record<string, string | null>>>;
type OneTimePaymentRecords = Record<string, Record<number, string | null>>;
type EnrollmentOperation = 'registration' | 'reenrollment' | 'transfer';

interface EnrollmentCandidateRow {
  backendId: string;
  name: string;
  matricule: string;
  gender: 'F' | 'M';
  birthDate: string;
  guardianName: string;
  guardianPhone: string;
  sourceClassId: string;
  sourceClassName: string;
  sourceYear: string;
  status: string;
  img: string;
}

type SubjectId = string | number;

interface PrimarySubject {
  id: SubjectId;
  name: string;
  code: string;
  domain: string;
  scale: number;
  levels: string[];
  teachers: number;
  color: string;
  francoArabic?: boolean;
}

interface SubjectFormModel {
  id: SubjectId | null;
  name: string;
  code: string;
  domain: string;
  scale: number;
  levels: string[];
  color: string;
}

type CurriculumPeriod = string;
type CurriculumLessonStatus = 'À faire' | 'En cours' | 'Terminée';

interface CurriculumLesson {
  id: string;
  title: string;
  estimatedSessions: number;
  status: CurriculumLessonStatus;
  progress: number;
}

interface CurriculumChapter {
  id: string;
  classId: string;
  subjectId: SubjectId;
  title: string;
  objective: string;
  period: CurriculumPeriod;
  order: number;
  lessons: CurriculumLesson[];
}

interface CurriculumChapterFormModel {
  title: string;
  objective: string;
  period: CurriculumPeriod;
  estimatedSessions: number;
}

interface CurriculumLessonRow {
  chapterId: string;
  objective: string;
  period: CurriculumPeriod;
  order: number;
  lesson: CurriculumLesson;
}

interface Student {
  id: number;
  backendId?: string;
  campusId: string;
  classId: string;
  matricule: string;
  name: string;
  gender: 'F' | 'M';
  birthDate: string;
  parentPhone: string;
  guardianId?: number;
  parentName?: string;
  status?: 'Actif' | 'En attente';
  birthPlace?: string;
  nationality?: string;
  parentRelationship?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentProfession?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  regime?: string;
  transport?: boolean;
  canteen?: boolean;
  attachments?: string[];
  portalAccount?: PortalAccountStatus;
}

interface StudentFormModel {
  id: number | null;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: 'F' | 'M';
  birthDate: string;
  birthPlace: string;
  nationality: string;
  guardianMode: GuardianMode;
  guardianId: number | null;
  parentFirstName: string;
  parentLastName: string;
  parentRelationship: string;
  parentProfession: string;
  parentPhone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  bloodGroup: string;
  medicalNotes: string;
  regime: string;
  transport: boolean;
  canteen: boolean;
  attachments: string[];
}

interface Guardian {
  id: number;
  backendId?: string;
  campusId: string;
  firstName: string;
  lastName: string;
  name: string;
  profession: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  childrenCount: number;
  accountStatus: PortalAccountStatus;
}

interface GuardianFormModel {
  id: number | null;
  firstName: string;
  lastName: string;
  profession: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
}

interface Teacher {
  id: number;
  backendId?: string;
  /** Identifiant métier utilisé par les emplois du temps. */
  teachingBackendId?: string;
  campusId: string;
  matricule: string;
  name: string;
  gender: 'F' | 'M';
  email: string;
  phone: string;
  subject: string;
  degree: string;
  hireDate: string;
  status: 'Actif' | 'En congé';
  contractType: string;
  address: string;
  birthDate: string;
  birthPlace?: string;
  emergencyContact: string;
  emergencyPhone: string;
  experience: string;
  salary: string;
  hourlyRate: string;
  salaryMode?: TeacherSalaryMode;
  attachments?: string[];
  portalAccount?: PortalAccountStatus;
}

interface TeacherFormModel {
  id: number | null;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: 'F' | 'M';
  birthDate: string;
  birthPlace: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  degree: string;
  specialization: string;
  hireDate: string;
  contractType: string;
  status: 'Actif' | 'En congé';
  experience: string;
  salary: string;
  hourlyRate: string;
  salaryMode: TeacherSalaryMode;
  attachments: string[];
}

interface SchoolStaff {
  id: number;
  backendId?: string;
  campusId: string;
  matricule: string;
  name: string;
  gender: 'F' | 'M';
  email: string;
  phone: string;
  function: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  hireDate: string;
  contractType: string;
  status: 'Actif' | 'En congé' | 'Suspendu';
  salary: string;
  hourlyRate: string;
  emergencyContact: string;
  emergencyPhone: string;
  attachments?: string[];
  portalAccount?: PortalAccountStatus;
}

interface SchoolStaffFormModel {
  id: number | null;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: 'F' | 'M';
  birthDate: string;
  birthPlace: string;
  email: string;
  phone: string;
  address: string;
  function: string;
  hireDate: string;
  contractType: string;
  status: 'Actif' | 'En congé' | 'Suspendu';
  salary: string;
  hourlyRate: string;
  emergencyContact: string;
  emergencyPhone: string;
  attachments: string[];
}

type StaffRecordTab = 'profile' | 'employment' | 'access';

type StaffAbsencePersonType = 'Enseignant' | 'Personnel';

interface StaffAbsence {
  id: number;
  campusId: string;
  personType: StaffAbsencePersonType;
  personId: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface StaffAbsenceFormModel {
  personType: StaffAbsencePersonType;
  personId: number | null;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface StaffAbsencePerson {
  id: number;
  type: StaffAbsencePersonType;
  name: string;
  role: string;
  matricule: string;
}

interface TranslationSet {
  [key: string]: string;
}

@Component({
  selector: 'app-primary-school',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MasterTableComponent,
  ],
  templateUrl: './primary-school.component.html',
  styleUrl: './primary-school.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimarySchoolComponent {
  private readonly workspace = inject(PrimaryWorkspaceService);
  private readonly snackBar = inject(AppToastService);
  private readonly centralApi = inject(CentralApiService);
  private readonly router = inject(Router);
  private dossiersRequestKey = '';
  private pedagogieRequestKey = '';
  private emploiTempsRequestKey = '';
  private seancesRequestKey = '';
  private evaluationsRequestKey = '';

  readonly activeView = this.workspace.activeView;
  readonly locale = this.workspace.locale;
  readonly selectedCampusId = this.workspace.selectedCampusId;
  readonly isHighSchool = computed(() => this.workspace.establishmentType() === 'lycee');
  readonly isCollege = computed(() => this.workspace.establishmentType() !== 'primary');
  readonly establishmentHomeLink = computed(() =>
    this.isHighSchool()
      ? '/institut/etablissements/lycee'
      : this.workspace.establishmentType() === 'college'
        ? '/institut/etablissements/college'
        : '/institut/etablissements/primaire',
  );
  readonly selectedClassId = signal('cm2-a-km');
  readonly selectedClassSubjectIds = signal<string[]>([]);
  readonly enrollmentOperation = signal<EnrollmentOperation>('registration');
  readonly enrollmentSourceClassId = signal('non-affectee');
  readonly enrollmentTargetClassId = signal('cm2-a-km');
  readonly enrollmentSelectedStudentIds = signal<string[]>([]);
  readonly enrollmentCandidates = signal<EnrollmentCandidateRow[]>([]);
  readonly enrollmentSourceOptions = signal<Array<{ id: string; label: string; year: string }>>([]);
  readonly enrollmentLoading = signal(false);
  readonly enrollmentSaving = signal(false);
  readonly dossiersLoading = signal(false);
  readonly financesLoading = signal(false);
  readonly schoolYearsLoading = signal(false);
  readonly schoolSettingsLoading = signal(false);
  readonly studentImportOpen = signal(false);
  readonly studentImportFile = signal<File | null>(null);
  readonly workforceImportKind = signal<WorkforceImportKind | null>(null);
  readonly workforceImportFile = signal<File | null>(null);
  readonly dossierSaving = signal(false);
  readonly selectedRoomId = signal('room-11-km');
  readonly selectedAcademicYear = this.workspace.selectedAcademicYear;
  readonly selectedTrimester = this.workspace.selectedPeriod;
  readonly selectedSubject = signal('Mathématiques');
  readonly anneesScolairesDisponibles = signal<AnneeScolaireInstitut[]>([]);
  readonly selectedCentralAcademicYearId = signal('');
  readonly isSelectedSchoolYearArchived = computed(() =>
    this.anneesScolairesDisponibles().some((annee) =>
      annee.id === this.selectedCentralAcademicYearId() && annee.statut === 'archivee',
    ),
  );
  schoolYearSettings = {
    centralYearId: '',
    label: '2026–2027',
    startDate: '2026-10-05',
    endDate: '2027-06-30',
  };
  schoolLevelSettings: PrimaryLevelSetting[] = [
    { id: 1, code: 'CI', label: 'Cours d’initiation' },
    { id: 2, code: 'CP', label: 'Cours préparatoire' },
    { id: 3, code: 'CE1', label: 'Cours élémentaire 1re année' },
    { id: 4, code: 'CE2', label: 'Cours élémentaire 2e année' },
    { id: 5, code: 'CM1', label: 'Cours moyen 1re année' },
    { id: 6, code: 'CM2', label: 'Cours moyen 2e année' },
  ];
  trimesterSettings: TrimesterSetting[] = [
    { id: 1, label: 'Trimestre 1', startDate: '2026-10-05', endDate: '2026-12-23' },
    { id: 2, label: 'Trimestre 2', startDate: '2027-01-04', endDate: '2027-03-31' },
    { id: 3, label: 'Trimestre 3', startDate: '2027-04-12', endDate: '2027-06-30' },
  ];
  readonly selectedEvaluationDomainId = signal('mathematics');
  readonly reportCardBuilderOpen = signal(false);
  readonly reportPreviewOpen = signal(false);
  readonly selectedReportStudentId = signal(1);
  readonly reportTemplateSource = signal<'default' | 'custom'>('default');
  readonly uploadedReportTemplate = signal<UploadedReportTemplate | null>(null);
  readonly includeReportAttendance = signal(true);
  readonly includeReportAppreciations = signal(true);
  readonly includeReportSignatures = signal(true);
  readonly selectedReportAppreciation = signal<ReportAppreciation | null>(null);
  readonly reportAppreciations: readonly ReportAppreciation[] = [
    'Excellent',
    'Félicitations',
    'Encouragements',
    'Tableau d’honneur',
    'Passable, peut mieux faire',
    'Insuffisant',
  ];
  readonly reportTemplateVariables = [
    '{{student_name}}',
    '{{class_name}}',
    '{{period}}',
    '{{results_table}}',
    '{{attendance}}',
    '{{signatures}}',
  ];
  readonly reportCardSections: ReadonlyArray<{
    category: PrimaryEvaluationComponent['category'];
    label: string;
    description: string;
  }> = [
    {
      category: 'Ressources',
      label: 'Contrôle des ressources',
      description: 'Connaissances et savoir-faire mobilisés',
    },
    {
      category: 'Compétences',
      label: 'Contrôle des compétences',
      description: 'Situations d’intégration et résolution de problèmes',
    },
    {
      category: 'Activité',
      label: 'Activités artistiques et sportives',
      description: 'Pratique, créativité et engagement',
    },
  ];
  get feeAcademicYears(): string[] {
    return this.workspace.academicYears();
  }
  readonly currentFeeAcademicYear = '2026–2027';
  readonly selectedFeeAcademicYear = signal(this.currentFeeAcademicYear);
  readonly selectedFeeClassId = signal('all');
  readonly selectedAdditionalFeeClassId = signal('');
  readonly feeEditorOpen = signal(false);
  readonly classFeeConfigurations = signal<ClassFeeConfiguration[]>([]);
  readonly additionalSchoolFees = signal<AdditionalSchoolFee[]>([]);
  additionalFeeForm: AdditionalFeeFormModel = {
    classId: 'cm2-a-km',
    label: '',
    amount: '',
    frequency: 'Paiement unique',
    required: false,
  };
  paymentMonths = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  readonly selectedCollectionAcademicYear = signal(this.currentFeeAcademicYear);
  readonly selectedCollectionFeeId = signal('monthlyFee');
  readonly collectionUnpaidOnly = signal(false);
  readonly expenseEditorOpen = signal(false);
  readonly selectedExpenseTypeId = signal('staff-salary');
  readonly selectedExpensePeriod = signal('2026-08');
  readonly selectedExpenseAcademicYear = signal(this.currentFeeAcademicYear);
  readonly expenseUnpaidOnly = signal(false);
  readonly expenseTypes = signal<ExpenseType[]>([]);
  readonly expenseTypeEditorOpen = signal(false);
  expenseTypeDraft: Pick<ExpenseType, 'label' | 'frequency' | 'target' | 'defaultAmount'> = { label: '', frequency: 'Unique', target: 'Personnel', defaultAmount: 0 };
  readonly expenses = signal<SchoolExpense[]>([]);
  readonly salaryPaymentRecords = signal<Record<string, string | null>>({});
  readonly salaryHourRecords = signal<Record<string, number>>({});
  expenseForm: ExpenseFormModel = this.createEmptyExpenseForm();
  readonly financeEntries = signal<FinanceEntry[]>([
    { id: 1, campusId: 'keur-massar', amount: 35000, reason: 'Mensualité', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Wave', thirdParty: 'Aïssatou Ndiaye · CM2 A', reference: 'ENC-260821-014', status: 'Validée', source: 'Encaissements', notes: 'Mensualité août' },
    { id: 2, campusId: 'keur-massar', amount: 50000, reason: 'Inscription', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Espèces', thirdParty: 'Mamadou Diallo · CI A', reference: 'ENC-260821-013', status: 'Validée', source: 'Encaissements', notes: 'Inscription 2026–2027' },
    { id: 3, campusId: 'keur-massar', amount: 325000, reason: 'Salaires du personnel', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Moussa Kane', reference: 'DEC-260820-008', status: 'Validée', source: 'Dépenses', notes: 'Salaire août' },
    { id: 4, campusId: 'keur-massar', amount: 118500, reason: 'Facture d’électricité', direction: 'Sortie', date: '2026-08-16', paymentMethod: 'Virement', thirdParty: 'Senelec', reference: 'DEC-260816-006', status: 'Validée', source: 'Dépenses', notes: 'Compteur principal' },
    { id: 6, campusId: 'keur-massar', amount: 78500, reason: 'Facture d’eau', direction: 'Sortie', date: '2026-08-18', paymentMethod: 'Chèque', thirdParty: 'Sen’Eau', reference: 'DEC-260818-007', status: 'En attente', source: 'Dépenses', notes: 'En attente de signature' },
    { id: 7, campusId: 'keur-massar', amount: 35000, reason: 'Mensualité', direction: 'Entrée', date: '2026-08-14', paymentMethod: 'Espèces', thirdParty: 'Ibrahima Fall · CM2 A', reference: 'ENC-260814-038', status: 'Validée', source: 'Encaissements', notes: '' },
    { id: 8, campusId: 'keur-massar', amount: 450000, reason: 'Loyer des locaux', direction: 'Sortie', date: '2026-08-01', paymentMethod: 'Virement', thirdParty: 'Bailleur du campus', reference: 'DEC-260801-001', status: 'Validée', source: 'Dépenses', notes: 'Loyer août' },
    { id: 9, campusId: 'keur-massar', amount: 40000, reason: 'Mensualité', direction: 'Entrée', date: '2026-07-29', paymentMethod: 'Wave', thirdParty: 'Mariama Ba · CM1 A', reference: 'ENC-260729-112', status: 'Validée', source: 'Encaissements', notes: 'Mensualité juillet' },
    { id: 10, campusId: 'plateau', amount: 330000, reason: 'Salaires du personnel', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Mame Sow', reference: 'DEC-260820-009', status: 'Validée', source: 'Dépenses', notes: '' },
  ]);
  readonly selectedFinanceAcademicYear = signal(this.currentFeeAcademicYear);
  readonly selectedFinancePeriod = signal('all');
  readonly selectedFinanceDirection = signal<'Tous' | FinanceDirection>('Tous');
  readonly selectedFinanceReason = signal('all');
  readonly financeEditorOpen = signal(false);
  readonly confirmationDialog = signal<ConfirmationDialogState | null>(null);
  private pendingConfirmationAction: (() => void) | null = null;
  financeEntryForm: FinanceEntryForm = this.createEmptyFinanceEntryForm();
  readonly financeColumns: ColumnDefinition[] = [
    { def: 'date', label: 'Date', type: 'dateCard', visible: true },
    { def: 'reference', label: 'Référence', type: 'text', visible: true },
    { def: 'reason', label: 'Motif', type: 'text', visible: true },
    { def: 'source', label: 'Origine', type: 'text', visible: true },
    { def: 'thirdParty', label: 'Tiers concerné', type: 'text', visible: true },
    { def: 'paymentMethod', label: 'Mode', type: 'text', visible: true },
    { def: 'incomingAmount', label: 'Entrée', type: 'text', visible: true },
    { def: 'outgoingAmount', label: 'Sortie', type: 'text', visible: true },
    {
      def: 'status', label: 'Statut', type: 'status', visible: true,
      statusBadgeMap: {
        Validée: 'badge badge-solid-green',
        'En attente': 'badge badge-solid-orange',
        Annulée: 'badge badge-solid-red',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly financeDataSource = new MatTableDataSource<FinanceTableRow>([]);
  readonly monthlyPaymentRecords = signal<MonthlyPaymentRecords>({
    '2026–2027::cm2-a-km::monthlyFee': {
      1: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
      2: { Oct: '2026-10-06', Nov: '2026-11-08', Déc: null, Jan: null },
      3: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
      4: { Oct: '2026-10-09', Nov: null, Déc: null, Jan: null },
      5: { Oct: '2026-10-05', Nov: '2026-11-07', Déc: '2026-12-08', Jan: null },
      6: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
    },
  });
  readonly oneTimePaymentRecords = signal<OneTimePaymentRecords>({
    '2026–2027::cm2-a-km::registrationFee': {
      1: '2026-09-12',
      2: '2026-09-14',
      3: '2026-09-14',
      4: null,
      5: '2026-09-18',
      6: '2026-09-19',
    },
    '2026–2027::cm2-a-km::additional-1': {
      1: '2027-01-10',
      2: null,
      3: '2027-01-12',
      4: null,
      5: null,
      6: null,
    },
  });
  private readonly financeTariffIds = new Map<string, string>();
  private financesRequestKey = '';
  readonly selectedStudentId = signal<number | null>(null);
  readonly selectedGuardianId = signal<number | null>(null);
  readonly selectedTeacherId = signal<number | null>(null);
  readonly studentRecordTab = signal<StudentRecordTab>('identity');
  readonly guardianRecordTab = signal<GuardianRecordTab>('identity');
  readonly teacherRecordTab = signal<TeacherRecordTab>('profile');
  readonly selectedSessionId = signal<string | null>(null);
  readonly selectedAssessmentId = signal<string | null>(null);
  readonly sessionGeneratorOpen = signal(false);
  readonly sessionStatusFilter = signal<'Toutes' | SessionStatus>('Toutes');
  readonly sessionSearch = signal('');
  readonly sessionSortKey = signal<SessionSortKey>('date');
  readonly sessionSortDirection = signal<'asc' | 'desc'>('asc');
  readonly sessionPage = signal(1);
  readonly sessionPageSize = signal(10);
  readonly classCurriculumOpen = signal(false);
  readonly selectedCurriculumSubjectId = signal<SubjectId | null>(null);
  readonly curriculumChapterEditorOpen = signal(false);
  readonly excludedSessionDates = signal<string[]>([]);
  excludedSessionDate = '';
  sessionDescriptionDraft = '';
  sessionLessonDraft = '';
  attendanceNotes: Record<number, string> = {};
  sessionGenerationForm: SessionGenerationForm = {
    startDate: '2026-10-05',
    endDate: '2026-10-16',
    includeHolidays: false,
  };
  curriculumChapterForm: CurriculumChapterFormModel = this.createEmptyCurriculumChapterForm();

  readonly campuses = computed<Campus[]>(() => this.centralApi.campusInstitut()
    .filter((campus) => campus.statut === 'actif')
    .map((campus) => ({
      id: campus.id,
      name: campus.nom,
      shortName: campus.nom.replace(/^Campus\s+/i, ''),
      learners: 0,
      classes: 0,
      teachers: 0,
      attendance: '—',
      collected: '0 F',
    })));

  readonly rooms = signal<SchoolRoom[]>([]);
  readonly roomsLoading = signal(false);
  readonly timetableLoading = signal(false);
  readonly sessionsLoading = signal(false);
  readonly assessmentsLoading = signal(false);
  readonly assessmentSaving = signal(false);
  readonly assessmentEditorOpen = signal(false);
  assessmentForm = { title: '', type: 'controle', date: '', period: '', domainId: '', componentId: '', teacherId: '' };

  readonly classes = signal<PrimaryClass[]>([
    { id: 'ci-a-km', campusId: 'keur-massar', name: 'CI A', level: 'CI', enrolled: 42, registrationFee: '25000', monthlyFee: '18000' },
    { id: 'cp-a-km', campusId: 'keur-massar', name: 'CP A', level: 'CP', enrolled: 41, registrationFee: '25000', monthlyFee: '18000' },
    { id: 'ce1-a-km', campusId: 'keur-massar', name: 'CE1 A', level: 'CE1', enrolled: 39, registrationFee: '27500', monthlyFee: '20000' },
    { id: 'ce2-a-km', campusId: 'keur-massar', name: 'CE2 A', level: 'CE2', enrolled: 40, registrationFee: '27500', monthlyFee: '20000' },
    { id: 'cm1-a-km', campusId: 'keur-massar', name: 'CM1 A', level: 'CM1', enrolled: 38, registrationFee: '30000', monthlyFee: '22000' },
    { id: 'cm2-a-km', campusId: 'keur-massar', name: 'CM2 A', level: 'CM2', enrolled: 41, registrationFee: '30000', monthlyFee: '22000' },
    { id: 'ci-a-dp', campusId: 'plateau', name: 'CI A', level: 'CI', enrolled: 40, registrationFee: '25000', monthlyFee: '18000' },
    { id: 'ce1-a-dp', campusId: 'plateau', name: 'CE1 A', level: 'CE1', enrolled: 41, registrationFee: '27500', monthlyFee: '20000' },
    { id: 'cm2-a-dp', campusId: 'plateau', name: 'CM2 A', level: 'CM2', enrolled: 39, registrationFee: '30000', monthlyFee: '22000' },
    { id: 'ci-a-ru', campusId: 'rufisque', name: 'CI A', level: 'CI', enrolled: 38, registrationFee: '25000', monthlyFee: '18000' },
    { id: 'ce2-a-ru', campusId: 'rufisque', name: 'CE2 A', level: 'CE2', enrolled: 36, registrationFee: '27500', monthlyFee: '20000' },
    { id: 'cm2-a-ru', campusId: 'rufisque', name: 'CM2 A', level: 'CM2', enrolled: 37, registrationFee: '30000', monthlyFee: '22000' },
  ]);

  readonly students = signal<Student[]>([
    { id: 1, campusId: 'keur-massar', classId: 'cm2-a-km', matricule: 'PRI-260041', name: 'Aïssatou Ba', gender: 'F', birthDate: '14/04/2015', birthPlace: 'Dakar', nationality: 'Sénégalaise', guardianId: 1, parentName: 'Mariama Ba', parentFirstName: 'Mariama', parentLastName: 'Ba', parentRelationship: 'Mère', parentProfession: 'Commerçante', parentPhone: '77 842 10 24', secondaryPhone: '76 410 20 15', email: 'mariama.ba@example.sn', address: 'Unité 11, Keur Massar', bloodGroup: 'O+', regime: 'Demi-pensionnaire', canteen: true, transport: false, attachments: ['extrait-naissance.pdf', 'certificat-medical.pdf'], portalAccount: 'Actif' },
    { id: 2, campusId: 'keur-massar', classId: 'cm2-a-km', matricule: 'PRI-260042', name: 'Mamadou Diop', gender: 'M', birthDate: '02/09/2014', birthPlace: 'Pikine', nationality: 'Sénégalaise', guardianId: 2, parentName: 'Oumar Diop', parentFirstName: 'Oumar', parentLastName: 'Diop', parentRelationship: 'Père', parentProfession: 'Technicien', parentPhone: '76 221 48 07', address: 'Cité Gendarmerie, Keur Massar', regime: 'Externe', portalAccount: 'Invitation envoyée' },
    { id: 3, campusId: 'keur-massar', classId: 'cm2-a-km', matricule: 'PRI-260043', name: 'Fatou Kiné Sow', gender: 'F', birthDate: '21/12/2014', guardianId: 3, parentName: 'Ndeye Awa Sow', parentFirstName: 'Ndeye Awa', parentLastName: 'Sow', parentRelationship: 'Mère', parentProfession: 'Enseignante', parentPhone: '78 330 19 65', address: 'Keur Massar Nord', regime: 'Externe', portalAccount: 'Actif' },
    { id: 4, campusId: 'keur-massar', classId: 'cm2-a-km', matricule: 'PRI-260044', name: 'Ibrahima Fall', gender: 'M', birthDate: '10/01/2015', guardianId: 4, parentName: 'Abdou Fall', parentFirstName: 'Abdou', parentLastName: 'Fall', parentRelationship: 'Père', parentProfession: 'Chauffeur', parentPhone: '77 904 62 18', address: 'Malika', regime: 'Externe', portalAccount: 'Non créé' },
    { id: 5, campusId: 'keur-massar', classId: 'cm2-a-km', matricule: 'PRI-260045', name: 'Marième Ndiaye', gender: 'F', birthDate: '27/06/2014', guardianId: 5, parentName: 'Astou Ndiaye', parentFirstName: 'Astou', parentLastName: 'Ndiaye', parentRelationship: 'Tuteur', parentProfession: 'Couturière', parentPhone: '76 840 41 33', address: 'Jaxaay', regime: 'Demi-pensionnaire', canteen: true, portalAccount: 'Actif' },
    { id: 6, campusId: 'keur-massar', classId: 'cm2-a-km', matricule: 'PRI-260046', name: 'Ousmane Kane', gender: 'M', birthDate: '05/03/2015', guardianId: 6, parentName: 'Moussa Kane', parentFirstName: 'Moussa', parentLastName: 'Kane', parentRelationship: 'Père', parentProfession: 'Comptable', parentPhone: '78 144 28 92', address: 'Parcelles Assainies', regime: 'Externe', portalAccount: 'Actif' },
    { id: 7, campusId: 'plateau', classId: 'cm2-a-dp', matricule: 'PRI-260201', name: 'Khady Fall', gender: 'F', birthDate: '12/07/2014', guardianId: 7, parentName: 'Mame Fall', parentPhone: '77 602 77 14', portalAccount: 'Actif' },
    { id: 8, campusId: 'rufisque', classId: 'cm2-a-ru', matricule: 'PRI-260305', name: 'Samba Cissé', gender: 'M', birthDate: '17/11/2014', guardianId: 8, parentName: 'Aly Cissé', parentPhone: '76 559 08 21', portalAccount: 'Invitation envoyée' },
    { id: 9, campusId: 'keur-massar', classId: '', matricule: 'PRI-260047', name: 'Rokhaya Diallo', gender: 'F', birthDate: '18/08/2015', parentName: 'Moussa Diallo', parentPhone: '77 118 42 60', status: 'En attente', portalAccount: 'Non créé' },
    { id: 10, campusId: 'keur-massar', classId: '', matricule: 'PRI-260048', name: 'Cheikh Anta Faye', gender: 'M', birthDate: '06/02/2015', guardianId: 2, parentName: 'Oumar Diop', parentPhone: '76 221 48 07', status: 'Actif', portalAccount: 'Invitation envoyée' },
    { id: 11, campusId: 'keur-massar', classId: 'cm1-a-km', matricule: 'PRI-260049', name: 'Moussa Mbaye', gender: 'M', birthDate: '10/05/2015', guardianId: 1, parentName: 'Mariama Ba', parentPhone: '77 842 10 24', status: 'Actif', portalAccount: 'Actif' },
    { id: 12, campusId: 'keur-massar', classId: 'cm1-a-km', matricule: 'PRI-260050', name: 'Nabou Sarr', gender: 'F', birthDate: '11/11/2015', guardianId: 3, parentName: 'Ndeye Awa Sow', parentPhone: '78 330 19 65', status: 'Actif', portalAccount: 'Non créé' },
  ]);

  readonly guardians = signal<Guardian[]>([
    { id: 1, campusId: 'keur-massar', firstName: 'Mariama', lastName: 'Ba', name: 'Mariama Ba', profession: 'Commerçante', phone: '77 842 10 24', secondaryPhone: '76 410 20 15', email: 'mariama.ba@example.sn', address: 'Unité 11, Keur Massar', childrenCount: 2, accountStatus: 'Actif' },
    { id: 2, campusId: 'keur-massar', firstName: 'Oumar', lastName: 'Diop', name: 'Oumar Diop', profession: 'Technicien', phone: '76 221 48 07', secondaryPhone: '', email: 'oumar.diop@example.sn', address: 'Cité Gendarmerie, Keur Massar', childrenCount: 1, accountStatus: 'Invitation envoyée' },
    { id: 3, campusId: 'keur-massar', firstName: 'Ndeye Awa', lastName: 'Sow', name: 'Ndeye Awa Sow', profession: 'Enseignante', phone: '78 330 19 65', secondaryPhone: '', email: 'awa.sow@example.sn', address: 'Keur Massar Nord', childrenCount: 3, accountStatus: 'Actif' },
    { id: 4, campusId: 'keur-massar', firstName: 'Abdou', lastName: 'Fall', name: 'Abdou Fall', profession: 'Chauffeur', phone: '77 904 62 18', secondaryPhone: '', email: '', address: 'Malika', childrenCount: 1, accountStatus: 'Non créé' },
    { id: 5, campusId: 'keur-massar', firstName: 'Astou', lastName: 'Ndiaye', name: 'Astou Ndiaye', profession: 'Couturière', phone: '76 840 41 33', secondaryPhone: '', email: '', address: 'Jaxaay', childrenCount: 1, accountStatus: 'Actif' },
    { id: 6, campusId: 'keur-massar', firstName: 'Moussa', lastName: 'Kane', name: 'Moussa Kane', profession: 'Comptable', phone: '78 144 28 92', secondaryPhone: '', email: 'moussa.kane@example.sn', address: 'Parcelles Assainies', childrenCount: 2, accountStatus: 'Actif' },
    { id: 7, campusId: 'plateau', firstName: 'Mame', lastName: 'Fall', name: 'Mame Fall', profession: 'Juriste', phone: '77 602 77 14', secondaryPhone: '', email: 'mame.fall@example.sn', address: 'Dakar Plateau', childrenCount: 1, accountStatus: 'Actif' },
    { id: 8, campusId: 'rufisque', firstName: 'Aly', lastName: 'Cissé', name: 'Aly Cissé', profession: 'Entrepreneur', phone: '76 559 08 21', secondaryPhone: '', email: 'aly.cisse@example.sn', address: 'Rufisque', childrenCount: 1, accountStatus: 'Invitation envoyée' },
  ]);

  readonly attendance = signal<Record<number, AttendanceStatus>>({
    1: 'P',
    2: 'P',
    3: 'A',
    4: 'P',
    5: 'R',
    6: 'P',
  });

  readonly subjectGrades = signal<Record<string, Record<number, SubjectGrade>>>({
    'Trimestre 1::cm2-a-km::Mathématiques': {
      1: { homework1: 16, homework2: 14, composition: 15 },
      2: { homework1: 12, homework2: 13, composition: 13 },
      3: { homework1: 17, homework2: 18, composition: 16 },
      4: { homework1: null, homework2: null, composition: 11 },
      5: { homework1: 14, homework2: 15, composition: 15 },
      6: { homework1: 9, homework2: null, composition: null },
    },
    'Trimestre 1::cm2-a-km::Français': {
      1: { homework1: 17, homework2: 15, composition: 16 },
      2: { homework1: 12, homework2: 11, composition: 12 },
      3: { homework1: 16, homework2: 17, composition: 16 },
      4: { homework1: 10, homework2: 12, composition: 11 },
      5: { homework1: 15, homework2: 14, composition: 15 },
      6: { homework1: 11, homework2: 10, composition: 12 },
    },
    'Trimestre 1::cm2-a-km::Étude du milieu': {
      1: { homework1: 15, homework2: 16, composition: 16 },
      2: { homework1: 13, homework2: 12, composition: 13 },
      3: { homework1: 17, homework2: 16, composition: 17 },
      4: { homework1: 11, homework2: null, composition: 12 },
      5: { homework1: 14, homework2: 15, composition: 14 },
      6: { homework1: 10, homework2: 11, composition: 11 },
    },
  });
  readonly gradeCalculationRule = signal<GradeCalculationRule>({
    homeworkWeight: 1,
    compositionWeight: 1,
  });

  readonly primaryEvaluationDomains: PrimaryEvaluationDomain[] = [
    {
      id: 'language-communication',
      label: 'Langue et communication (Français)',
      shortLabel: 'Langue & Communication',
      color: '#2f80ed',
      components: [
        { id: 'text-questions', label: 'Texte suivi de questions', shortLabel: 'Texte + questions', category: 'Ressources', scale: 40 },
        { id: 'dictation', label: 'Dictée', shortLabel: 'Dictée', category: 'Ressources', scale: 10 },
        { id: 'written-production', label: 'Production d’écrit', shortLabel: 'Production écrite', category: 'Compétences', scale: 40 },
      ],
    },
    {
      id: 'mathematics',
      label: 'Mathématiques',
      shortLabel: 'Mathématiques',
      color: '#7b61c9',
      components: [
        { id: 'math-resources', label: 'Activités numériques et géométriques', shortLabel: 'Ressources', category: 'Ressources', scale: 40 },
        { id: 'math-problem', label: 'Résolution de problème complexe', shortLabel: 'Compétences', category: 'Compétences', scale: 40 },
      ],
    },
    {
      id: 'esvs',
      label: 'Éducation à la Science et à la Vie Sociale (ESVS)',
      shortLabel: 'Sciences & Vie Sociale',
      color: '#36a37c',
      components: [
        { id: 'history', label: 'Histoire', shortLabel: 'Histoire', category: 'Ressources', scale: 10 },
        { id: 'geography', label: 'Géographie', shortLabel: 'Géographie', category: 'Ressources', scale: 10 },
        { id: 'science-technology', label: 'Initiation scientifique et technologique', shortLabel: 'IST', category: 'Ressources', scale: 10 },
        { id: 'living-education', label: 'Éducation civique et religieuse', shortLabel: 'Éducation civique', category: 'Ressources', scale: 10 },
        { id: 'esvs-integration', label: 'Situation d’intégration en ESVS', shortLabel: 'Intégration', category: 'Compétences', scale: 40 },
      ],
    },
    {
      id: 'epsa',
      label: 'Éducation Physique, Sportive et Artistique (EPSA)',
      shortLabel: 'Arts & Sports',
      color: '#d66f57',
      components: [
        { id: 'artistic-education', label: 'Éducation artistique', shortLabel: 'Arts', category: 'Activité', scale: 10 },
        { id: 'physical-education', label: 'Éducation physique et sportive', shortLabel: 'EPS', category: 'Activité', scale: 10 },
      ],
    },
  ];

  readonly primaryEvaluationGrades = signal<Record<string, Record<number, PrimaryEvaluationScores>>>({
    'Trimestre 1::cm2-a-km::language-communication': {
      1: { 'text-questions': 33, dictation: 9, 'written-production': 34 },
      2: { 'text-questions': 25, dictation: 7, 'written-production': 27 },
      3: { 'text-questions': 35, dictation: 9, 'written-production': 36 },
      4: { 'text-questions': 24, dictation: 6, 'written-production': 25 },
      5: { 'text-questions': 31, dictation: 8, 'written-production': 32 },
      6: { 'text-questions': 27, dictation: 7, 'written-production': 29 },
    },
    'Trimestre 1::cm2-a-km::mathematics': {
      1: { 'math-resources': 34, 'math-problem': 31 },
      2: { 'math-resources': 27, 'math-problem': 24 },
      3: { 'math-resources': 36, 'math-problem': 35 },
      4: { 'math-resources': 24, 'math-problem': 20 },
      5: { 'math-resources': 30, 'math-problem': 29 },
      6: { 'math-resources': 25, 'math-problem': null },
    },
    'Trimestre 1::cm2-a-km::esvs': {
      1: { history: 8, geography: 8, 'science-technology': 9, 'living-education': 9, 'esvs-integration': 33 },
      2: { history: 7, geography: 6, 'science-technology': 7, 'living-education': 8, 'esvs-integration': 25 },
      3: { history: 9, geography: 9, 'science-technology': 9, 'living-education': 9, 'esvs-integration': 35 },
      4: { history: 6, geography: 6, 'science-technology': 5, 'living-education': 7, 'esvs-integration': 23 },
      5: { history: 8, geography: 7, 'science-technology': 8, 'living-education': 8, 'esvs-integration': 30 },
      6: { history: 6, geography: 7, 'science-technology': 6, 'living-education': 8, 'esvs-integration': 26 },
    },
    'Trimestre 1::cm2-a-km::epsa': {
      1: { 'artistic-education': 8, 'physical-education': 9 },
      2: { 'artistic-education': 7, 'physical-education': 7 },
      3: { 'artistic-education': 9, 'physical-education': 9 },
      4: { 'artistic-education': 6, 'physical-education': 7 },
      5: { 'artistic-education': 8, 'physical-education': 8 },
      6: { 'artistic-education': 7, 'physical-education': 8 },
    },
  });

  readonly assessments = signal<PrimaryAssessment[]>([
    {
      id: 'eval-math-devoir-1',
      title: 'Contrôle des ressources 1',
      type: 'Contrôle',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Mathématiques',
      evaluationDomainId: 'mathematics',
      componentId: 'math-resources',
      date: '2026-10-22',
      scale: 40,
      teacherId: 1,
      status: 'Corrigée',
      results: this.buildAssessmentResults([32, 24, 34, 20, 28, 18], [1, 2, 3, 5], 40),
    },
    {
      id: 'eval-math-formative-1',
      title: 'Évaluation formative 1',
      type: 'Évaluation formative',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Mathématiques',
      evaluationDomainId: 'mathematics',
      componentId: 'math-resources',
      date: '2026-11-12',
      scale: 40,
      teacherId: 1,
      status: 'Corrigée',
      results: this.buildAssessmentResults([30, 26, 36, null, 24, 22], [1, 3, 6], 40),
    },
    {
      id: 'eval-math-composition-t1',
      title: 'Situation d’intégration mathématique',
      type: 'Composition',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Mathématiques',
      evaluationDomainId: 'mathematics',
      componentId: 'math-problem',
      date: '2026-12-11',
      scale: 40,
      teacherId: 1,
      status: 'À corriger',
      results: this.buildAssessmentResults([31, 24, 35, 20, 29, null], [1, 2, 3, 4, 5], 40),
    },
    {
      id: 'eval-fr-controle-lecture',
      title: 'Contrôle de lecture',
      type: 'Contrôle',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Français',
      evaluationDomainId: 'language-communication',
      componentId: 'text-questions',
      date: '2026-11-19',
      scale: 40,
      teacherId: 2,
      status: 'Corrigée',
      results: this.buildAssessmentResults([33, 25, 35, 24, 31, 27], [1, 3, 5], 40),
    },
    {
      id: 'eval-fr-essai-1',
      title: 'Essai de fin d’étape',
      type: 'Essai',
      trimester: 'Trimestre 2',
      classId: 'cm2-a-km',
      subject: 'Français',
      evaluationDomainId: 'language-communication',
      componentId: 'written-production',
      date: '2027-03-08',
      scale: 40,
      teacherId: 2,
      status: 'Brouillon',
      results: this.buildAssessmentResults([null, null, null, null, null, null], [], 40),
    },
    {
      id: 'eval-fr-dictation-t1',
      title: 'Dictée du premier trimestre',
      type: 'Contrôle',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Français',
      evaluationDomainId: 'language-communication',
      componentId: 'dictation',
      date: '2026-12-03',
      scale: 10,
      teacherId: 2,
      status: 'Corrigée',
      results: this.buildAssessmentResults([9, 7, 9, 6, 8, 7], [1, 2, 3], 10),
    },
    {
      id: 'eval-esvs-resources-t1',
      title: 'Contrôle d’histoire',
      type: 'Contrôle',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Histoire',
      evaluationDomainId: 'esvs',
      componentId: 'history',
      date: '2026-11-26',
      scale: 10,
      teacherId: 3,
      status: 'Corrigée',
      results: this.buildAssessmentResults([8, 7, 9, 6, 8, 6], [1, 3, 5], 10),
    },
    {
      id: 'eval-esvs-integration-t1',
      title: 'Situation d’intégration ESVS',
      type: 'Composition',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Étude du milieu',
      evaluationDomainId: 'esvs',
      componentId: 'esvs-integration',
      date: '2026-12-14',
      scale: 40,
      teacherId: 3,
      status: 'À corriger',
      results: this.buildAssessmentResults([33, 25, 35, 23, 30, 26], [1, 2, 3, 4], 40),
    },
    {
      id: 'eval-eps-t1',
      title: 'Évaluation d’éducation physique',
      type: 'Évaluation formative',
      trimester: 'Trimestre 1',
      classId: 'cm2-a-km',
      subject: 'Éducation physique et sportive',
      evaluationDomainId: 'epsa',
      componentId: 'physical-education',
      date: '2026-12-07',
      scale: 10,
      teacherId: 4,
      status: 'Corrigée',
      results: this.buildAssessmentResults([9, 7, 9, 7, 8, 8], [1, 3], 10),
    },
  ]);

  readonly primaryLevels = ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
  readonly subjectCatalog = [
    'Français',
    'Mathématiques',
    'Éducation à la science et à la vie sociale',
    'Éducation au développement durable',
    'Éducation physique et sportive',
    'Éducation artistique',
    'Langue nationale',
    'Langue arabe',
    'Éducation islamique',
    'Coran',
    'Hadith',
  ];
  readonly primarySubjectDomains = [
    'Langue et communication',
    'Mathématiques',
    'Éducation à la science et à la vie sociale',
    'Éducation physique, sportive et artistique',
    'Éducation au développement durable',
    'Langues nationales',
    'Enseignement franco-arabe',
  ];
  readonly collegeSubjectDomains = [
    'Langues et lettres',
    'Mathématiques',
    'Sciences et technologie',
    'Sciences humaines et sociales',
    'Éducation civique',
    'Éducation physique, sportive et artistique',
    'Enseignement franco-arabe',
  ];
  readonly highSchoolSubjectDomains = [
    'Langues et lettres',
    'Mathématiques',
    'Sciences expérimentales',
    'Sciences humaines et sociales',
    'Économie et gestion',
    'Sciences et techniques',
    'Éducation physique et sportive',
    'Enseignement franco-arabe',
  ];
  readonly predefinedPrimarySubjects: PrimarySubject[] = [
    { id: 'proposition-fr', name: 'Français', code: 'FR', domain: 'Langue et communication', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#2f80ed' },
    { id: 'proposition-math', name: 'Mathématiques', code: 'MATH', domain: 'Mathématiques', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#7b61c9' },
    { id: 'proposition-esvs', name: 'Éducation à la science et à la vie sociale', code: 'ESVS', domain: 'Éducation à la science et à la vie sociale', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#36a37c' },
    { id: 'proposition-edd', name: 'Éducation au développement durable', code: 'EDD', domain: 'Éducation au développement durable', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#34a089' },
    { id: 'proposition-eps', name: 'Éducation physique et sportive', code: 'EPS', domain: 'Éducation physique, sportive et artistique', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#d66f57' },
    { id: 'proposition-art', name: 'Éducation artistique', code: 'ART', domain: 'Éducation physique, sportive et artistique', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#e3a34b' },
    { id: 'proposition-ln', name: 'Langue nationale', code: 'LN', domain: 'Langues nationales', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#4b8e8b' },
    { id: 'proposition-ar', name: 'Langue arabe', code: 'AR', domain: 'Enseignement franco-arabe', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#2779b9', francoArabic: true },
    { id: 'proposition-ei', name: 'Éducation islamique', code: 'EI', domain: 'Enseignement franco-arabe', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#607d5b', francoArabic: true },
    { id: 'proposition-coran', name: 'Coran', code: 'CORAN', domain: 'Enseignement franco-arabe', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#3d8b6d', francoArabic: true },
    { id: 'proposition-hadith', name: 'Hadith', code: 'HAD', domain: 'Enseignement franco-arabe', scale: 20, levels: this.primaryLevels, teachers: 0, color: '#8a6d3b', francoArabic: true },
  ];
  readonly collegeLevels = ['6e', '5e', '4e', '3e'];
  readonly predefinedCollegeSubjects: PrimarySubject[] = [
    { id: 'proposition-col-fr', name: 'Français', code: 'FR', domain: 'Langues et lettres', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#2f80ed' },
    { id: 'proposition-col-math', name: 'Mathématiques', code: 'MATH', domain: 'Mathématiques', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#7b61c9' },
    { id: 'proposition-col-ang', name: 'Anglais', code: 'ANG', domain: 'Langues et lettres', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#36a37c' },
    { id: 'proposition-col-hg', name: 'Histoire-Géographie', code: 'HG', domain: 'Sciences humaines et sociales', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#e28b4f' },
    { id: 'proposition-col-svt', name: 'Sciences de la vie et de la Terre', code: 'SVT', domain: 'Sciences et technologie', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#2779b9' },
    { id: 'proposition-col-pc', name: 'Sciences physiques', code: 'PC', domain: 'Sciences et technologie', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#d66f57' },
    { id: 'proposition-col-tech', name: 'Technologie', code: 'TECH', domain: 'Sciences et technologie', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#546e7a' },
    { id: 'proposition-col-ec', name: 'Éducation civique', code: 'EC', domain: 'Éducation civique', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#e3a34b' },
    { id: 'proposition-col-eps', name: 'Éducation physique et sportive', code: 'EPS', domain: 'Éducation physique, sportive et artistique', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#c65f5f' },
    { id: 'proposition-col-art', name: 'Éducation artistique', code: 'ART', domain: 'Éducation physique, sportive et artistique', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#af7ac5' },
    { id: 'proposition-col-info', name: 'Informatique', code: 'INFO', domain: 'Sciences et technologie', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#4b8e8b' },
    { id: 'proposition-col-esp', name: 'Espagnol', code: 'ESP', domain: 'Langues et lettres', scale: 20, levels: ['4e', '3e'], teachers: 0, color: '#ef8354' },
    { id: 'proposition-col-all', name: 'Allemand', code: 'ALL', domain: 'Langues et lettres', scale: 20, levels: ['4e', '3e'], teachers: 0, color: '#6c757d' },
    { id: 'proposition-col-ar', name: 'Langue arabe', code: 'AR', domain: 'Enseignement franco-arabe', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#258262', francoArabic: true },
    { id: 'proposition-col-ei', name: 'Éducation islamique', code: 'EI', domain: 'Enseignement franco-arabe', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#607d5b', francoArabic: true },
    { id: 'proposition-col-coran', name: 'Coran', code: 'CORAN', domain: 'Enseignement franco-arabe', scale: 20, levels: this.collegeLevels, teachers: 0, color: '#3d8b6d', francoArabic: true },
  ];
  readonly highSchoolLevels = ['2nde', '1re', 'Tle'];
  readonly predefinedHighSchoolSubjects: PrimarySubject[] = [
    { id: 'proposition-lyc-fr', name: 'Français', code: 'FR', domain: 'Langues et lettres', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#2f80ed' },
    { id: 'proposition-lyc-philo', name: 'Philosophie', code: 'PHILO', domain: 'Sciences humaines et sociales', scale: 20, levels: ['1re', 'Tle'], teachers: 0, color: '#7357a8' },
    { id: 'proposition-lyc-math', name: 'Mathématiques', code: 'MATH', domain: 'Mathématiques', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#7b61c9' },
    { id: 'proposition-lyc-ang', name: 'Anglais', code: 'ANG', domain: 'Langues et lettres', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#36a37c' },
    { id: 'proposition-lyc-hg', name: 'Histoire-Géographie', code: 'HG', domain: 'Sciences humaines et sociales', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#e28b4f' },
    { id: 'proposition-lyc-svt', name: 'Sciences de la vie et de la Terre', code: 'SVT', domain: 'Sciences expérimentales', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#2779b9' },
    { id: 'proposition-lyc-pc', name: 'Physique-Chimie', code: 'PC', domain: 'Sciences expérimentales', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#d66f57' },
    { id: 'proposition-lyc-ses', name: 'Sciences économiques et sociales', code: 'SES', domain: 'Économie et gestion', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#258262' },
    { id: 'proposition-lyc-gest', name: 'Économie et gestion', code: 'GEST', domain: 'Économie et gestion', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#3b8c88' },
    { id: 'proposition-lyc-tech', name: 'Sciences et techniques industrielles', code: 'STI', domain: 'Sciences et techniques', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#c06a3b' },
    { id: 'proposition-lyc-info', name: 'Informatique', code: 'INFO', domain: 'Sciences et techniques', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#4b8e8b' },
    { id: 'proposition-lyc-eps', name: 'Éducation physique et sportive', code: 'EPS', domain: 'Éducation physique et sportive', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#c65f5f' },
    { id: 'proposition-lyc-esp', name: 'Espagnol', code: 'ESP', domain: 'Langues et lettres', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#ef8354' },
    { id: 'proposition-lyc-all', name: 'Allemand', code: 'ALL', domain: 'Langues et lettres', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#6c757d' },
    { id: 'proposition-lyc-ar', name: 'Langue arabe', code: 'AR', domain: 'Enseignement franco-arabe', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#258262', francoArabic: true },
    { id: 'proposition-lyc-ei', name: 'Éducation islamique', code: 'EI', domain: 'Enseignement franco-arabe', scale: 20, levels: this.highSchoolLevels, teachers: 0, color: '#607d5b', francoArabic: true },
  ];
  readonly predefinedSubjects = computed<readonly PrimarySubject[]>(() =>
    this.workspace.establishmentType() === 'primary'
      ? this.predefinedPrimarySubjects
      : this.workspace.establishmentType() === 'college'
        ? this.predefinedCollegeSubjects
        : this.predefinedHighSchoolSubjects,
  );
  readonly subjectDomains = computed<readonly string[]>(() =>
    this.workspace.establishmentType() === 'primary'
      ? this.primarySubjectDomains
      : this.workspace.establishmentType() === 'college'
        ? this.collegeSubjectDomains
        : this.highSchoolSubjectDomains,
  );
  readonly subjectProposalTitle = computed(() =>
    this.workspace.establishmentType() === 'primary'
      ? 'Matières du primaire sénégalais'
      : this.workspace.establishmentType() === 'college'
        ? 'Matières du collège sénégalais'
        : 'Matières du lycée sénégalais',
  );
  readonly subjectProposalDescription = computed(() =>
    this.workspace.establishmentType() === 'primary'
      ? 'Cochez les matières enseignées dans votre établissement. Les enseignements franco-arabes sont clairement identifiés.'
      : 'Sélectionnez le socle commun et les matières optionnelles enseignées dans votre établissement. Les enseignements franco-arabes sont clairement identifiés.',
  );
  readonly defaultSubjectProposalCodes = computed<readonly string[]>(() =>
    this.workspace.establishmentType() === 'primary'
      ? ['FR', 'MATH', 'ESVS', 'EDD', 'EPS', 'ART', 'LN']
      : this.workspace.establishmentType() === 'college'
        ? ['FR', 'MATH', 'ANG', 'HG', 'SVT', 'PC', 'EC', 'EPS']
        : ['FR', 'PHILO', 'MATH', 'ANG', 'HG', 'SVT', 'PC', 'EPS'],
  );
  readonly selectedSubjectProposalCodes = signal<string[]>([...this.defaultSubjectProposalCodes()]);
  readonly subjects = signal<PrimarySubject[]>([]);
  readonly subjectsLoading = signal(false);
  readonly subjectsSaving = signal(false);
  readonly classSubjectsSaving = signal(false);
  readonly curriculumSaving = signal(false);
  readonly curriculumLessonSavingIds = signal<string[]>([]);
  readonly classSubjectAssignments = signal<Record<string, SubjectId[]>>({});
  readonly collegeSubjectSettings = signal<Record<string, { coefficient: number | null; teacherId: number | null; maxScore: number }>>({});

  readonly curriculumChapters = signal<CurriculumChapter[]>([]);

  readonly teachers = signal<Teacher[]>([
    { id: 1, campusId: 'keur-massar', matricule: 'ENS-26001', name: 'Moussa Kane', gender: 'M', email: 'm.kane@joyau.sn', phone: '77 221 45 66', subject: 'Polyvalent', degree: 'CAEM', hireDate: '05/10/2021', status: 'Actif', contractType: 'Permanent', address: 'Keur Massar', birthDate: '18/03/1986', emergencyContact: 'Aminata Kane', emergencyPhone: '77 410 20 15', experience: '12', salary: '325000', hourlyRate: '' },
    { id: 2, campusId: 'keur-massar', matricule: 'ENS-26002', name: 'Awa Ba', gender: 'F', email: 'a.ba@joyau.sn', phone: '76 904 17 23', subject: 'Polyvalente', degree: 'CAP', hireDate: '03/10/2020', status: 'Actif', contractType: 'Permanent', address: 'Yeumbeul', birthDate: '06/11/1989', emergencyContact: 'Mamadou Ba', emergencyPhone: '76 310 44 18', experience: '10', salary: '310000', hourlyRate: '' },
    { id: 3, campusId: 'keur-massar', matricule: 'ENS-26003', name: 'Ibrahima Fall', gender: 'M', email: 'i.fall@joyau.sn', phone: '78 510 66 09', subject: 'Polyvalent', degree: 'CAP', hireDate: '06/10/2022', status: 'Actif', contractType: 'Contractuel', address: 'Malika', birthDate: '22/08/1991', emergencyContact: 'Fatou Fall', emergencyPhone: '78 210 66 02', experience: '8', salary: '285000', hourlyRate: '' },
    { id: 4, campusId: 'keur-massar', matricule: 'ENS-26004', name: 'Coumba Sarr', gender: 'F', email: 'c.sarr@joyau.sn', phone: '77 416 22 87', subject: 'Polyvalente', degree: 'CEAP', hireDate: '04/10/2023', status: 'Actif', contractType: 'Contractuelle', address: 'Keur Massar', birthDate: '15/01/1994', emergencyContact: 'Samba Sarr', emergencyPhone: '77 906 13 45', experience: '6', salary: '', hourlyRate: '5000', salaryMode: 'Horaire' },
    { id: 5, campusId: 'plateau', matricule: 'ENS-26005', name: 'Mame Sow', gender: 'F', email: 'm.sow@joyau.sn', phone: '77 640 18 32', subject: 'Polyvalente', degree: 'CAP', hireDate: '05/10/2019', status: 'Actif', contractType: 'Permanente', address: 'Dakar Plateau', birthDate: '09/05/1987', emergencyContact: 'Alioune Sow', emergencyPhone: '77 540 18 22', experience: '13', salary: '330000', hourlyRate: '' },
    { id: 6, campusId: 'plateau', matricule: 'ENS-26006', name: 'Abdou Seck', gender: 'M', email: 'a.seck@joyau.sn', phone: '76 511 08 74', subject: 'Polyvalent', degree: 'CEAP', hireDate: '07/10/2022', status: 'Actif', contractType: 'Contractuel', address: 'Médina', birthDate: '12/02/1990', emergencyContact: 'Mame Seck', emergencyPhone: '76 311 08 70', experience: '7', salary: '275000', hourlyRate: '' },
    { id: 7, campusId: 'rufisque', matricule: 'ENS-26007', name: 'Mariama Gueye', gender: 'F', email: 'm.gueye@joyau.sn', phone: '78 466 31 20', subject: 'Polyvalente', degree: 'CAP', hireDate: '05/10/2020', status: 'Actif', contractType: 'Permanente', address: 'Rufisque', birthDate: '24/07/1988', emergencyContact: 'Ibrahima Gueye', emergencyPhone: '78 266 31 11', experience: '11', salary: '315000', hourlyRate: '' },
    { id: 8, campusId: 'rufisque', matricule: 'ENS-26008', name: 'Moussa Cissé', gender: 'M', email: 'm.cisse@joyau.sn', phone: '77 388 52 01', subject: 'Polyvalent', degree: 'CEAP', hireDate: '06/10/2023', status: 'En congé', contractType: 'Contractuel', address: 'Rufisque', birthDate: '02/12/1992', emergencyContact: 'Ndeye Cissé', emergencyPhone: '77 188 52 09', experience: '5', salary: '260000', hourlyRate: '' },
  ]);

  readonly schoolStaff = signal<SchoolStaff[]>([
    { id: 1, campusId: 'keur-massar', matricule: 'PER-26001', name: 'Fatou Diop', gender: 'F', email: 'f.diop@joyau.sn', phone: '77 321 45 80', function: 'Secrétaire scolaire', birthDate: '12/06/1988', birthPlace: 'Dakar', address: 'Keur Massar', hireDate: '05/10/2021', contractType: 'Permanent', status: 'Actif', salary: '240000', hourlyRate: '', emergencyContact: 'Mamadou Diop', emergencyPhone: '77 410 20 15', attachments: ['contrat-fatou-diop.pdf'], portalAccount: 'Actif' },
    { id: 2, campusId: 'keur-massar', matricule: 'PER-26002', name: 'Abdoulaye Sarr', gender: 'M', email: '', phone: '76 212 34 90', function: 'Agent d’entretien', birthDate: '03/11/1979', birthPlace: 'Pikine', address: 'Malika', hireDate: '02/10/2022', contractType: 'Contractuel', status: 'Actif', salary: '160000', hourlyRate: '2500', emergencyContact: 'Awa Sarr', emergencyPhone: '76 312 34 90', attachments: ['piece-identite-sarr.jpg'], portalAccount: 'Non créé' },
    { id: 3, campusId: 'keur-massar', matricule: 'PER-26003', name: 'Aminata Fall', gender: 'F', email: 'a.fall@joyau.sn', phone: '78 505 11 42', function: 'Responsable de vie scolaire', birthDate: '27/01/1985', birthPlace: 'Rufisque', address: 'Yeumbeul', hireDate: '04/10/2020', contractType: 'Permanent', status: 'Actif', salary: '280000', hourlyRate: '', emergencyContact: 'Ibrahima Fall', emergencyPhone: '78 205 11 40', attachments: ['cv-aminata-fall.pdf'], portalAccount: 'Invitation envoyée' },
    { id: 4, campusId: 'plateau', matricule: 'PER-26004', name: 'Moussa Gueye', gender: 'M', email: 'm.gueye@joyau.sn', phone: '77 640 10 22', function: 'Assistant administratif', birthDate: '08/09/1990', birthPlace: 'Dakar', address: 'Dakar Plateau', hireDate: '06/10/2023', contractType: 'Contractuel', status: 'Actif', salary: '210000', hourlyRate: '', emergencyContact: 'Ndeye Gueye', emergencyPhone: '77 540 10 20', attachments: [], portalAccount: 'Non créé' },
  ]);
  readonly staffAbsenceFilter = signal<'Tous' | StaffAbsencePersonType>('Tous');
  readonly staffAbsenceEditorOpen = signal(false);
  readonly staffAbsences = signal<StaffAbsence[]>([
    { id: 1, campusId: 'keur-massar', personType: 'Enseignant', personId: 2, date: '2026-11-18', startTime: '08:00', endTime: '12:15', reason: 'Consultation médicale' },
    { id: 2, campusId: 'keur-massar', personType: 'Personnel', personId: 1, date: '2026-11-20', startTime: '13:00', endTime: '17:00', reason: 'Autorisation exceptionnelle' },
  ]);
  staffAbsenceForm: StaffAbsenceFormModel = {
    personType: 'Enseignant', personId: 1, date: '2026-11-24', startTime: '08:00', endTime: '12:00', reason: '',
  };

  readonly timetableDays: Array<{ key: TimetableDay; label: string }> = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
  ];
  readonly timetableRows = signal<TimetableRow[]>([
    this.createTimetableRow(1, '08:00', '09:00', [
      ['Français', 1], ['Mathématiques', 2], ['Français', 1],
      ['Mathématiques', 2], ['Français', 1], ['Arabe', 4],
    ]),
    this.createTimetableRow(2, '09:00', '10:00', [
      ['Mathématiques', 2], ['Français', 1], ['Mathématiques', 2],
      ['Français', 1], ['Mathématiques', 2], ['Français', 1],
    ]),
    this.createTimetableRow(3, '10:00', '10:15', [
      ['Pause', null], ['Pause', null], ['Pause', null],
      ['Pause', null], ['Pause', null], ['Pause', null],
    ]),
    this.createTimetableRow(4, '10:15', '11:15', [
      ['Étude du milieu', 3], ['Arabe', 4], ['Éducation civique et morale', 3],
      ['Étude du milieu', 3], ['Arabe', 4], ['Éducation physique et sportive', 4],
    ]),
    this.createTimetableRow(5, '11:15', '12:15', [
      ['Français', 1], ['Mathématiques', 2], ['Étude du milieu', 3],
      ['Français', 1], ['Éducation physique et sportive', 4], ['Mathématiques', 2],
    ]),
  ]);
  readonly teacherTimetableRows: TeacherTimetableRow[] = [
    this.createTeacherTimetableRow(1, '08:00', '09:00', [
      ['Français', 'CM2 A', 'Salle 11'], null, ['Français', 'CM2 A', 'Salle 11'],
      null, ['Français', 'CM2 A', 'Salle 11'], null,
    ]),
    this.createTeacherTimetableRow(2, '09:00', '10:00', [
      null, ['Français', 'CM2 A', 'Salle 11'], null,
      ['Français', 'CM2 A', 'Salle 11'], null, ['Français', 'CM2 A', 'Salle 11'],
    ]),
    this.createTeacherTimetableRow(3, '10:15', '11:15', [
      null, null, null, null, ['Mathématiques', 'CE2 A', 'Salle 07'], null,
    ]),
    this.createTeacherTimetableRow(4, '11:15', '12:15', [
      ['Mathématiques', 'CE2 A', 'Salle 07'], null, null, null, null, null,
    ]),
  ];
  timetableDraftRows = this.cloneTimetableRows(this.timetableRows());
  /**
   * Une matière est affectée une seule fois à un enseignant pour la classe
   * sélectionnée. Les cellules gardent l'identifiant pour l'affichage et les
   * séances, mais ne demandent plus ce choix à chaque créneau.
   */
  timetableTeacherAssignments: Record<string, number | null> =
    this.affectationsEnseignantsDepuisEmploiTemps(this.timetableDraftRows);

  readonly sessions = signal<SchoolSession[]>([
    {
      id: 'session-cm2-a-km-2026-07-28-1', classId: 'cm2-a-km', roomId: 'room-11-km',
      date: '2026-07-28', startTime: '08:00', endTime: '09:00', subject: 'Français',
      teacherId: 1, status: 'Terminée',
      description: 'Lecture expressive du texte, repérage des personnages et correction collective des questions de compréhension.',
      lessonTitle: 'Comprendre un texte narratif', programUnit: 'Lecture et compréhension', programProgress: 68,
    },
    {
      id: 'session-cm2-a-km-2026-07-28-2', classId: 'cm2-a-km', roomId: 'room-11-km',
      date: '2026-07-28', startTime: '09:00', endTime: '10:00', subject: 'Mathématiques',
      teacherId: 2, status: 'À compléter', description: '', lessonTitle: 'La division décimale',
      programUnit: 'Activités numériques', programProgress: 61,
    },
    {
      id: 'session-cm2-a-km-2026-07-29-1', classId: 'cm2-a-km', roomId: 'room-11-km',
      date: '2026-07-29', startTime: '08:00', endTime: '09:00', subject: 'Français',
      teacherId: 1, status: 'Planifiée', description: '', lessonTitle: 'Le groupe nominal',
      programUnit: 'Grammaire', programProgress: 52,
    },
    {
      id: 'session-cm2-a-km-2026-07-29-4', classId: 'cm2-a-km', roomId: 'room-11-km',
      date: '2026-07-29', startTime: '10:15', endTime: '11:15', subject: 'Éducation civique et morale',
      teacherId: 3, status: 'Planifiée', description: '', lessonTitle: 'Les droits et devoirs de l’enfant',
      programUnit: 'Vivre ensemble', programProgress: 45,
    },
  ]);
  readonly sessionAttendance = signal<Record<string, Record<number, AttendanceStatus>>>({
    'session-cm2-a-km-2026-07-28-1': { 1: 'P', 2: 'P', 3: 'A', 4: 'P', 5: 'R', 6: 'P' },
  });
  readonly sessionAttendanceNotes = signal<Record<string, Record<number, string>>>({});
  readonly schoolHolidays = [
    { date: '2026-12-25', label: 'Noël' },
    { date: '2027-01-01', label: 'Jour de l’An' },
    { date: '2027-04-04', label: 'Fête de l’Indépendance' },
    { date: '2027-05-01', label: 'Fête du Travail' },
  ];

  readonly recentRegistrations = [
    { name: 'Adama Sy', className: 'CI A', date: '28 juil. 2026', status: 'Dossier complet' },
    { name: 'Nafissatou Dia', className: 'CP A', date: '27 juil. 2026', status: 'Pièce manquante' },
    { name: 'Cheikh Tidiane Ba', className: 'CE1 A', date: '27 juil. 2026', status: 'Dossier complet' },
  ];

  readonly transactions = [
    { label: 'Mensualités · Janvier', category: 'Scolarité', amount: '+ 2 840 000 F', date: '28 juil.', positive: true },
    { label: 'Fournitures pédagogiques', category: 'Dépense', amount: '− 185 000 F', date: '27 juil.', positive: false },
    { label: 'Frais d’inscription', category: 'Inscription', amount: '+ 420 000 F', date: '27 juil.', positive: true },
    { label: 'Entretien des salles', category: 'Dépense', amount: '− 95 000 F', date: '26 juil.', positive: false },
  ];

  readonly currentCampus = computed<Campus>(() =>
    this.campuses().find((campus) => campus.id === this.selectedCampusId())
      ?? this.campuses()[0]
      ?? { id: '', name: 'Aucun campus', shortName: 'Aucun campus', learners: 0, classes: 0, teachers: 0, attendance: '—', collected: '0 F' },
  );
  readonly campusClasses = computed(() =>
    this.classes().filter((item) => item.campusId === this.selectedCampusId()),
  );
  readonly unassignedStudents = computed(() =>
    this.students().filter(
      (student) => student.campusId === this.selectedCampusId() && !student.classId,
    ),
  );
  readonly visibleStudents = computed(() => {
    const classId = this.selectedClassId();
    return this.students().filter(
      (student) =>
        student.campusId === this.selectedCampusId() &&
        (classId === 'unassigned' ? !student.classId : student.classId === classId),
    );
  });
  readonly enrollmentSourceStudents = computed(() => this.enrollmentCandidates()
    .filter((student) => student.sourceClassId === this.enrollmentSourceClassId()));
  readonly enrollmentSourceLabel = computed(
    () => this.enrollmentSourceOptions().find((item) => item.id === this.enrollmentSourceClassId())?.label
      ?? 'Classe non définie',
  );
  readonly enrollmentTargetClass = computed(
    () => this.classes().find((item) => item.id === this.enrollmentTargetClassId()) ?? null,
  );
  readonly enrollmentSelectedRows = computed(() => {
    const selectedIds = new Set(this.enrollmentSelectedStudentIds());
    return this.enrollmentSourceStudents().filter((student) => selectedIds.has(student.backendId));
  });
  readonly selectedClass = computed(
    () =>
      this.classes().find((item) => item.id === this.selectedClassId()) ??
      this.campusClasses()[0],
  );
  readonly compatibleCurriculumSubjects = computed(() => {
    const level = this.selectedClass()?.level;
    return this.subjects().filter((subject) => subject.levels.includes(level));
  });
  readonly assignedCurriculumSubjects = computed(() => {
    const assignedIds = this.classSubjectAssignments()[this.selectedClassId()] ?? [];
    return this.compatibleCurriculumSubjects().filter((subject) => assignedIds.includes(subject.id));
  });
  readonly selectedClassSubjectClasses = computed(() => {
    const selectedIds = new Set(this.selectedClassSubjectIds());
    return this.campusClasses().filter((classroom) => selectedIds.has(classroom.id));
  });
  readonly selectedClassSubjectSubjects = computed(() => {
    const classIds = this.selectedClassSubjectClasses().map((classroom) => classroom.id);
    return this.subjects().filter((subject) => classIds.some((classId) =>
      (this.classSubjectAssignments()[classId] ?? []).includes(subject.id),
    ));
  });
  readonly selectedCurriculumSubject = computed(() =>
    this.subjects().find((subject) => subject.id === this.selectedCurriculumSubjectId()) ?? null,
  );
  readonly selectedCurriculumChapters = computed(() =>
    this.curriculumChapters()
      .filter((chapter) =>
        chapter.classId === this.selectedClassId() &&
        chapter.subjectId === this.selectedCurriculumSubjectId(),
      )
      .sort((first, second) => first.order - second.order),
  );
  readonly selectedCurriculumLessons = computed<CurriculumLessonRow[]>(() =>
    this.selectedCurriculumChapters().flatMap((chapter) =>
      chapter.lessons.map((lesson, lessonIndex) => ({
        chapterId: chapter.id,
        objective: chapter.objective,
        period: chapter.period,
        order: chapter.order * 100 + lessonIndex,
        lesson,
      })),
    ).sort((first, second) => first.order - second.order),
  );
  readonly curriculumStats = computed(() => {
    const lessons = this.selectedCurriculumLessons().map((row) => row.lesson);
    const completed = lessons.filter((lesson) => lesson.status === 'Terminée').length;
    const inProgress = lessons.filter((lesson) => lesson.status === 'En cours').length;
    const plannedSessions = lessons.reduce((total, lesson) => total + lesson.estimatedSessions, 0);
    return {
      lessons: lessons.length,
      completed,
      inProgress,
      remaining: lessons.length - completed,
      plannedSessions,
      progress: lessons.length
        ? Math.round(lessons.reduce((total, lesson) => total + lesson.progress, 0) / lessons.length)
        : 0,
    };
  });
  readonly visibleSessions = computed(() => {
    const classId = this.selectedClassId();
    const status = this.sessionStatusFilter();
    return this.sessions()
      .filter((session) => session.classId === classId && (status === 'Toutes' || session.status === status))
      .sort((first, second) =>
        `${first.date}-${first.startTime}`.localeCompare(`${second.date}-${second.startTime}`),
      );
  });
  readonly filteredSessionTableRows = computed(() => {
    const search = this.sessionSearch().trim().toLocaleLowerCase('fr');
    const direction = this.sessionSortDirection() === 'asc' ? 1 : -1;
    const key = this.sessionSortKey();
    return this.visibleSessions()
      .filter((session) => !search || [session.subject, this.teacherName(session.teacherId), this.sessionClassName(session), this.sessionRoomName(session), session.status, session.date]
        .join(' ').toLocaleLowerCase('fr').includes(search))
      .sort((first, second) => {
        const firstValue = key === 'date' ? `${first.date}-${first.startTime}` : key === 'subject' ? first.subject : key === 'teacher' ? this.teacherName(first.teacherId) : first.status;
        const secondValue = key === 'date' ? `${second.date}-${second.startTime}` : key === 'subject' ? second.subject : key === 'teacher' ? this.teacherName(second.teacherId) : second.status;
        return firstValue.localeCompare(secondValue, 'fr') * direction;
      });
  });
  readonly sessionPageCount = computed(() => Math.max(1, Math.ceil(this.filteredSessionTableRows().length / this.sessionPageSize())));
  readonly pagedSessions = computed(() => {
    const page = Math.min(this.sessionPage(), this.sessionPageCount());
    const start = (page - 1) * this.sessionPageSize();
    return this.filteredSessionTableRows().slice(start, start + this.sessionPageSize());
  });
  readonly selectedSession = computed(() =>
    this.sessions().find((session) => session.id === this.selectedSessionId()) ?? null,
  );
  readonly sessionStats = computed(() => {
    const sessions = this.sessions().filter((session) => session.classId === this.selectedClassId());
    return {
      total: sessions.length,
      completed: sessions.filter((session) => session.status === 'Terminée').length,
      pending: sessions.filter((session) => session.status === 'À compléter').length,
      planned: sessions.filter((session) => session.status === 'Planifiée').length,
    };
  });
  readonly filteredAssessments = computed(() =>
    this.assessments()
      .filter((assessment) =>
        assessment.classId === this.selectedClassId() &&
        assessment.trimester === this.selectedTrimester() &&
        (this.isCollege()
          ? assessment.subject === this.selectedSubject()
          : assessment.evaluationDomainId === this.selectedEvaluationDomainId()),
      )
      .sort((first, second) => second.date.localeCompare(first.date)),
  );
  readonly selectedAssessment = computed(() =>
    this.assessments().find((assessment) => assessment.id === this.selectedAssessmentId()) ?? null,
  );
  readonly campusRooms = computed(() =>
    this.rooms().filter((room) => room.campusId === this.selectedCampusId()),
  );
  readonly selectedRoom = computed(
    () =>
      this.rooms().find((room) => room.id === this.selectedRoomId()) ??
      this.campusRooms()[0] ??
      { id: '', campusId: this.selectedCampusId(), name: 'Salle non définie' },
  );
  readonly campusTeachers = computed(() =>
    this.teachers().filter((teacher) =>
      teacher.campusId === this.selectedCampusId()
      && teacher.status === 'Actif'
      && Boolean(teacher.teachingBackendId),
    ),
  );
  readonly campusStaff = computed(() =>
    this.schoolStaff().filter((person) => person.campusId === this.selectedCampusId()),
  );
  readonly campusGuardians = computed(() =>
    this.guardians().filter((guardian) => guardian.campusId === this.selectedCampusId()),
  );
  /** Indicateurs calculés uniquement à partir des dossiers réellement chargés. */
  readonly campusGuardianLearnersCount = computed(() =>
    this.campusGuardians().reduce((total, guardian) => total + guardian.childrenCount, 0),
  );
  readonly campusActiveGuardianAccountsCount = computed(() =>
    this.campusGuardians().filter((guardian) => guardian.accountStatus === 'Actif').length,
  );
  readonly selectedStudent = computed(() =>
    this.students().find((student) => student.id === this.selectedStudentId()) ??
    this.visibleStudents()[0],
  );
  readonly selectedGuardian = computed(() =>
    this.guardians().find((guardian) => guardian.id === this.selectedGuardianId()) ??
    this.campusGuardians()[0],
  );
  readonly selectedGuardianChildren = computed(() => {
    const guardianId = this.selectedGuardian()?.id;
    return this.students().filter((student) =>
      student.campusId === this.selectedCampusId() && student.guardianId === guardianId,
    );
  });
  readonly selectedTeacher = computed(() =>
    this.teachers().find((teacher) => teacher.id === this.selectedTeacherId()) ??
    this.campusTeachers()[0],
  );
  readonly selectedStaff = computed(() =>
    this.schoolStaff().find((person) => person.id === this.selectedStaffId()) ??
    this.campusStaff()[0],
  );
  readonly selectedStudentGuardian = computed(() => {
    const student = this.selectedStudent();
    return this.guardians().find((guardian) => guardian.id === student?.guardianId);
  });

  readonly studentColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true },
    {
      def: 'name',
      label: 'Prénom et nom',
      type: 'nameWithImage',
      visible: true,
    },
    {
      def: 'gender',
      label: 'Sexe',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        F: 'badge badge-solid-purple',
        M: 'badge badge-solid-green',
      },
    },
    { def: 'birthDate', label: 'Date de naissance', type: 'text', visible: true },
    { def: 'parentPhone', label: 'Téléphone tuteur', type: 'phone', visible: true },
    {
      def: 'status',
      label: 'Statut',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Actif: 'badge badge-solid-green',
        'En attente': 'badge badge-solid-orange',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  readonly studentDataSource = new MatTableDataSource<Student>([]);
  readonly sessionDataSource = new MatTableDataSource<SchoolSession>([]);
  readonly sessionColumns: ColumnDefinition[] = [
    { def: 'date', label: 'Date', type: 'dateCard', visible: true },
    { def: 'schedule', label: 'Créneau', type: 'time', visible: true },
    { def: 'subject', label: 'Matière', type: 'text', visible: true },
    { def: 'teacherName', label: 'Enseignant', type: 'text', visible: true },
    { def: 'roomName', label: 'Salle', type: 'text', visible: true },
    { def: 'status', label: 'Statut', type: 'status', visible: true, statusBadgeMap: { Planifiée: 'badge badge-solid-blue', 'À compléter': 'badge badge-solid-orange', Terminée: 'badge badge-solid-green' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly enrollmentDataSource = new MatTableDataSource<EnrollmentCandidateRow>([]);
  readonly enrollmentColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'name', label: 'Élève', type: 'nameWithImage', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true },
    { def: 'gender', label: 'Sexe', type: 'status', visible: true, statusBadgeMap: { F: 'badge badge-solid-purple', M: 'badge badge-solid-green' } },
    { def: 'sourceClassName', label: 'Classe de départ', type: 'text', visible: true },
    { def: 'guardianName', label: 'Tuteur', type: 'text', visible: true },
    { def: 'guardianPhone', label: 'Téléphone tuteur', type: 'phone', visible: true },
    { def: 'status', label: 'Statut', type: 'status', visible: true, statusBadgeMap: { Disponible: 'badge badge-solid-green', 'À réinscrire': 'badge badge-solid-orange' } },
  ];
  studentForm: StudentFormModel = this.createEmptyStudentForm();
  private studentAttachmentFiles: File[] = [];

  readonly guardianColumns: ColumnDefinition[] = [
    { def: 'name', label: 'Tuteur', type: 'nameWithImage', visible: true },
    { def: 'phone', label: 'Téléphone / WhatsApp', type: 'phone', visible: true },
    { def: 'profession', label: 'Profession', type: 'text', visible: true },
    { def: 'childrenCount', label: 'Apprenants liés', type: 'number', visible: true },
    {
      def: 'accountStatus',
      label: 'Compte famille',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Actif: 'badge badge-solid-green',
        'Invitation envoyée': 'badge badge-solid-blue',
        'Non créé': 'badge badge-solid-orange',
        Désactivé: 'badge badge-solid-red',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly guardianDataSource = new MatTableDataSource<Guardian>([]);
  guardianForm: GuardianFormModel = this.createEmptyGuardianForm();

  readonly classEditorOpen = signal(false);
  readonly classProposals = signal<ClassProposal[]>([]);
  readonly classProposalsCampusId = signal<string | null>(null);
  readonly classProposalsSaved = signal(false);
  readonly classesLoading = signal(false);
  readonly classesSaving = signal(false);
  readonly backendRefreshing = signal(false);
  readonly highSchoolSeries = signal<HighSchoolSeries[]>([]);
  readonly seriesLoading = signal(false);
  readonly seriesSaving = signal(false);
  readonly seriesEditorOpen = signal(false);
  seriesForm: HighSchoolSeriesForm = this.createEmptySeriesForm();
  classForm: ClassFormModel = this.createEmptyClassForm();
  readonly subjectEditorOpen = signal(false);
  subjectForm: SubjectFormModel = this.createEmptySubjectForm();
  readonly teacherEditorOpen = signal(false);
  readonly teacherColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true },
    { def: 'name', label: 'Enseignant', type: 'nameWithImage', visible: true },
    { def: 'subject', label: 'Spécialité', type: 'text', visible: true },
    { def: 'phone', label: 'Téléphone', type: 'phone', visible: true },
    { def: 'email', label: 'E-mail', type: 'email', visible: false },
    {
      def: 'status',
      label: 'Statut',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Actif: 'badge badge-solid-green',
        'En congé': 'badge badge-solid-orange',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly teacherDataSource = new MatTableDataSource<Teacher>([]);
  teacherForm: TeacherFormModel = this.createEmptyTeacherForm();
  private teacherAttachmentFiles: File[] = [];
  readonly staffEditorOpen = signal(false);
  readonly staffRecordTab = signal<StaffRecordTab>('profile');
  readonly selectedStaffId = signal<number | null>(null);
  readonly staffColumns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true },
    { def: 'name', label: 'Personnel', type: 'nameWithImage', visible: true },
    { def: 'function', label: 'Fonction', type: 'text', visible: true },
    { def: 'phone', label: 'Téléphone', type: 'phone', visible: true },
    { def: 'email', label: 'E-mail', type: 'email', visible: false },
    {
      def: 'status',
      label: 'Statut',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Actif: 'badge badge-solid-green',
        'En congé': 'badge badge-solid-orange',
        Suspendu: 'badge badge-solid-red',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly staffDataSource = new MatTableDataSource<SchoolStaff>([]);
  staffForm: SchoolStaffFormModel = this.createEmptyStaffForm();
  private staffAttachmentFiles: File[] = [];

  readonly breadcrumbItems = computed(() => {
    const view = this.activeView();

    if (view === 'registrations') {
      return this.studentForm.id
        ? [this.t('studentRecords'), this.t('studentRecord')]
        : [this.t('studentRecords')];
    }
    if (view === 'enrollments') {
      return [this.t('studentRecords')];
    }
    if (view === 'students') {
      return [this.t('studentRecords')];
    }
    if (view === 'student-detail') {
      return [this.t('studentRecords'), this.t('studentList')];
    }
    if (view === 'guardians') {
      return [this.t('studentRecords')];
    }
    if (view === 'classes' && this.classEditorOpen()) {
      return [this.t('classes')];
    }
    if (view === 'classes' && this.classCurriculumOpen()) {
      return [this.t('classes')];
    }
    if (view === 'curriculum') {
      return [this.t('subjects')];
    }
    if (view === 'class-subjects') {
      return [this.t('subjects')];
    }
    if (view === 'subjects' && this.subjectEditorOpen()) {
      return [this.t('subjects')];
    }
    if (view === 'teachers' && this.teacherEditorOpen()) {
      return [this.t('teachers')];
    }
    if (view === 'teacher-detail') {
      return [this.t('teachers')];
    }
    if (view === 'staff' && this.staffEditorOpen()) {
      return [this.t('staff')];
    }
    if (view === 'staff-detail') {
      return [this.t('staff')];
    }
    if (view === 'assessments' && this.selectedAssessment()) {
      return [this.t('assessments')];
    }

    return [];
  });

  readonly breadcrumbActive = computed(() => {
    const view = this.activeView();

    if (view === 'registrations') {
      return this.studentForm.id ? this.t('edit') : this.t('addStudent');
    }
    if (view === 'enrollments') {
      return this.t('enrollments');
    }
    if (view === 'students') {
      return this.t('studentList');
    }
    if (view === 'student-detail') {
      return this.t('studentDetail');
    }
    if (view === 'guardians') {
      return this.t('guardians');
    }
    if (view === 'classes' && this.classEditorOpen()) {
      return this.classForm.id ? this.t('editClass') : this.t('newClass');
    }
    if (view === 'classes' && this.classCurriculumOpen()) {
      return this.t('classCurriculum');
    }
    if (view === 'curriculum') {
      return this.t('classCurriculum');
    }
    if (view === 'class-subjects') {
      return this.workspace.translate('Matières par classe');
    }
    if (view === 'subjects' && this.subjectEditorOpen()) {
      return this.subjectForm.id ? this.t('editSubject') : this.t('newSubject');
    }
    if (view === 'teachers' && this.teacherEditorOpen()) {
      return this.teacherForm.id ? this.t('editTeacher') : this.t('newTeacher');
    }
    if (view === 'teacher-detail') {
      return this.t('teacherDetail');
    }
    if (view === 'staff' && this.staffEditorOpen()) {
      return this.staffForm.id ? this.t('editStaff') : this.t('newStaff');
    }
    if (view === 'staff-detail') {
      return this.t('staffDetail');
    }
    if (view === 'assessments' && this.selectedAssessment()) {
      return this.t('assessmentDetail');
    }

    return this.t(view);
  });

  private readonly translations: Record<PrimaryLocale, TranslationSet> = {
    fr: {
      dashboard: 'Tableau de bord',
      registrations: 'Dossiers élèves',
      enrollments: 'Inscriptions, réinscriptions & transferts',
      'staff-attendance': 'Absences du personnel',
      students: 'Élèves',
      'student-detail': 'Détails de l’élève',
      guardians: 'Tuteurs',
      classes: 'Classes',
      classesDescription: 'Préparez les classes du campus puis configurer les paiements',
      series: 'Séries',
      subjects: 'Matières',
      curriculum: 'Programmes & leçons',
      teachers: 'Enseignants',
      'teacher-detail': 'Détails de l’enseignant',
      staff: 'Personnel',
      'staff-detail': 'Détails du personnel',
      'timetable-builder': 'Configurer l’emploi du temps',
      timetable: 'Emploi du temps',
      attendance: 'Séances',
      assessments: 'Évaluations',
      assessmentDetail: 'Détail de l’évaluation',
      reports: 'Notes et bulletins',
      fees: 'Tarification scolaire',
      payments: 'Encaissements',
      'expense-settings': 'Paramétrage des dépenses',
      expenses: 'Dépenses',
      finance: 'Finances',
      settings: 'Paramètres',
      academic: 'SCOLARITÉ',
      teaching: 'PÉDAGOGIE',
      billing: 'FINANCES',
      configuration: 'CONFIGURATION',
      campus: 'Campus actif',
      parentSpace: 'Retour à l’institut',
      studentRecords: 'Dossiers élèves',
      studentList: 'Liste des élèves',
      addStudent: 'Ajout élève',
      studentRecord: 'Dossier élève',
      studentDetail: 'Détails élève',
      teacherDetail: 'Dossier enseignant',
      edit: 'Modifier',
      newClass: 'Nouvelle classe',
      editClass: 'Modifier la classe',
      newSubject: 'Nouvelle matière',
      editSubject: 'Modifier la matière',
      newTeacher: 'Nouvel enseignant',
      editTeacher: 'Modifier l’enseignant',
      newStaff: 'Nouveau membre du personnel',
      editStaff: 'Modifier le membre du personnel',
      classCurriculum: 'Programmes & leçons',
    },
    wo: {
      dashboard: 'Xool bu ëpp',
      registrations: 'Dosye taalibé yi',
      enrollments: 'Bind, bindaat ak soppi kalaas yi',
      'staff-attendance': 'Ñàkk ci nit ñi ci ekool',
      students: 'Taalibé yi',
      'student-detail': 'Xibaaru taalibe bi',
      guardians: 'Kilifa yi',
      classes: 'Kalaas yi',
      classesDescription: 'Waajal kalaas yi ci campus bi, te defaralal fay yi',
      series: 'Sëri yi',
      subjects: 'Mbaar yi',
      curriculum: 'Porogaraam ak njàngat yi',
      teachers: 'Jàngalekat yi',
      'teacher-detail': 'Xibaaru jàngalekat bi',
      staff: 'Nit ñi ci ekool',
      'staff-detail': 'Xibaaru nit ki',
      'timetable-builder': 'Tëral waxtaanu njàng',
      timetable: 'Waxtaanu njàng',
      attendance: 'Waxtuy njàng',
      assessments: 'Nattale yi',
      assessmentDetail: 'Xibaaru jéemantu bi',
      reports: 'Not ak bulletin yi',
      fees: 'Njëgu ekool',
      payments: 'Fay yi',
      'expense-settings': 'Tëralinu depans yi',
      expenses: 'Depans yi',
      finance: 'Xaalis',
      settings: 'Tëralin',
      academic: 'NJÀNG',
      teaching: 'NJÀNGALE',
      billing: 'XAALIS',
      configuration: 'TËRALIN',
      campus: 'Campus bi ñuy jëfandikoo',
      parentSpace: 'Dellusi ci institut bi',
      studentRecords: 'Dosye taalibé yi',
      studentList: 'Limu taalibé yi',
      addStudent: 'Yokk taalibé',
      studentRecord: 'Dosye taalibé',
      studentDetail: 'Xibaaru taalibé',
      teacherDetail: 'Dosye jàngalekat',
      edit: 'Soppi',
      newClass: 'Kalaas bu bees',
      editClass: 'Soppi kalaas bi',
      newSubject: 'Mbaar bu bees',
      editSubject: 'Soppi mbaar mi',
      newTeacher: 'Jàngalekat bu bees',
      editTeacher: 'Soppi jàngalekat bi',
      newStaff: 'Nit bu bees ci ekool',
      editStaff: 'Soppi nit ki ci ekool',
      classCurriculum: 'Porogaraam ak njàngat yi',
    },
    en: {
      dashboard: 'Dashboard',
      registrations: 'Student records',
      enrollments: 'Enrollments, re-enrollments & transfers',
      'staff-attendance': 'Staff absences',
      students: 'Students',
      'student-detail': 'Student details',
      guardians: 'Guardians',
      classes: 'Classes',
      classesDescription: 'Prepare the campus classes, then configure payments',
      series: 'Streams',
      subjects: 'Subjects',
      curriculum: 'Curricula & lessons',
      teachers: 'Teachers',
      'teacher-detail': 'Teacher details',
      staff: 'Staff',
      'staff-detail': 'Staff details',
      'timetable-builder': 'Configure timetable',
      timetable: 'Timetable',
      attendance: 'Sessions',
      assessments: 'Assessments',
      assessmentDetail: 'Assessment details',
      reports: 'Grades & report cards',
      fees: 'School fees',
      payments: 'Payments',
      'expense-settings': 'Expense settings',
      expenses: 'Expenses',
      finance: 'Finance',
      settings: 'Settings',
      academic: 'ACADEMIC',
      teaching: 'PEDAGOGY',
      billing: 'FINANCE',
      configuration: 'CONFIGURATION',
      campus: 'Active campus',
      parentSpace: 'Back to institute',
      studentRecords: 'Student records',
      studentList: 'Student list',
      addStudent: 'Add student',
      studentRecord: 'Student record',
      studentDetail: 'Student details',
      teacherDetail: 'Teacher record',
      edit: 'Edit',
      newClass: 'New class',
      editClass: 'Edit class',
      newSubject: 'New subject',
      editSubject: 'Edit subject',
      newTeacher: 'New teacher',
      editTeacher: 'Edit teacher',
      newStaff: 'New staff member',
      editStaff: 'Edit staff member',
      classCurriculum: 'Curricula & lessons',
    },
    ar: {
      dashboard: 'لوحة القيادة',
      registrations: 'ملفات التلاميذ',
      enrollments: 'التسجيل وإعادة التسجيل والتحويلات',
      'staff-attendance': 'غيابات الموظفين',
      students: 'التلاميذ',
      'student-detail': 'تفاصيل التلميذ',
      guardians: 'الأولياء',
      classes: 'الأقسام',
      classesDescription: 'حضّر أقسام الحرم ثم اضبط المدفوعات',
      series: 'الشُعب',
      subjects: 'المواد',
      curriculum: 'البرامج والدروس',
      teachers: 'المعلمون',
      'teacher-detail': 'تفاصيل المعلم',
      staff: 'الموظفون',
      'staff-detail': 'تفاصيل الموظف',
      'timetable-builder': 'إعداد جدول الحصص',
      timetable: 'جدول الحصص',
      attendance: 'الحصص',
      assessments: 'التقييمات',
      assessmentDetail: 'تفاصيل التقييم',
      reports: 'الدرجات وكشوف النتائج',
      fees: 'الرسوم المدرسية',
      payments: 'المدفوعات',
      'expense-settings': 'إعداد المصروفات',
      expenses: 'المصروفات',
      finance: 'المالية',
      settings: 'الإعدادات',
      academic: 'الدراسة',
      teaching: 'التربية',
      billing: 'المالية',
      configuration: 'الإعدادات',
      campus: 'الحرم النشط',
      parentSpace: 'العودة إلى المؤسسة',
      studentRecords: 'ملفات التلاميذ',
      studentList: 'قائمة التلاميذ',
      addStudent: 'إضافة تلميذ',
      studentRecord: 'ملف التلميذ',
      studentDetail: 'تفاصيل التلميذ',
      teacherDetail: 'ملف المعلم',
      edit: 'تعديل',
      newClass: 'قسم جديد',
      editClass: 'تعديل القسم',
      newSubject: 'مادة جديدة',
      editSubject: 'تعديل المادة',
      newTeacher: 'معلم جديد',
      editTeacher: 'تعديل المعلم',
      newStaff: 'موظف جديد',
      editStaff: 'تعديل الموظف',
      classCurriculum: 'البرامج والدروس',
    },
  };

  constructor() {
    // La synchronisation URL → espace est volontairement centralisée dans le
    // layout. La répéter ici reconstruisait le contexte métier pendant la
    // création de ce composant particulièrement riche en signaux et effets.
    // Les listes de démonstration sont remplacées dès l'entrée dans un espace
    // connecté afin de ne jamais présenter une donnée locale comme enregistrée.
    this.students.set([]);
    this.guardians.set([]);
    this.teachers.set([]);
    this.schoolStaff.set([]);
    this.sessions.set([]);
    this.assessments.set([]);
    this.financeEntries.set([]);
    this.monthlyPaymentRecords.set({});
    this.oneTimePaymentRecords.set({});
    this.initializeFeeConfigurations();
    this.preparerPropositionsClasses();
    this.ensureClassSubjectSelection();
    this.chargerAnneesScolaires();

    effect(() => {
      const campusId = this.selectedCampusId();
      const typeEtablissement = this.workspace.establishmentType();
      if (campusId && this.centralApi.estConnecte()) {
        this.chargerDossiers(typeEtablissement, campusId);
      }
    });

    effect(() => {
      const campusId = this.selectedCampusId();
      if (campusId && this.centralApi.estConnecte()) {
        this.chargerSalles(campusId);
      }
    });

    effect(() => {
      if (this.workspace.establishmentType() === 'lycee' && this.centralApi.estConnecte()) {
        this.chargerSeriesLycee();
      }
    });

    effect(() => {
      this.workspace.sessionListRequest();
      this.selectedSessionId.set(null);
      this.sessionGeneratorOpen.set(false);
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    });

    effect(() => {
      this.workspace.classListRequest();
      this.classEditorOpen.set(false);
      this.classCurriculumOpen.set(false);
      this.curriculumChapterEditorOpen.set(false);
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    });

    effect(() => {
      this.workspace.assessmentListRequest();
      this.selectedAssessmentId.set(null);
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    });

    effect(() => {
      const campusId = this.selectedCampusId();
      if (this.selectedClassId() === 'unassigned') {
        return;
      }
      const selectedClass = this.classes().find((item) => item.id === this.selectedClassId());
      if (selectedClass?.campusId !== campusId) {
        const firstClass = this.classes().find((item) => item.campusId === campusId);
        if (firstClass) {
          this.selectedClassId.set(firstClass.id);
        }
      }
    });

    effect(() => {
      const campusId = this.selectedCampusId();
      const selectedRoom = this.rooms().find((room) => room.id === this.selectedRoomId());
      if (selectedRoom?.campusId !== campusId) {
        const firstRoom = this.rooms().find((room) => room.campusId === campusId);
        this.selectedRoomId.set(firstRoom?.id ?? '');
      }
    });

    effect(() => {
      this.studentDataSource.data = this.visibleStudents().map((student, index) => ({
        ...student,
        status: student.status ?? 'Actif',
        img: `assets/images/user/user${(index % 9) + 1}.jpg`,
        className: this.studentClassName(student),
      }));
    });

    effect(() => {
      this.sessionDataSource.data = this.visibleSessions().map((session) => ({
        ...session,
        schedule: `${session.startTime} – ${session.endTime}`,
        teacherName: this.teacherName(session.teacherId),
        roomName: this.sessionRoomName(session),
      }));
    });

    effect(() => {
      this.enrollmentDataSource.data = [...this.enrollmentSourceStudents()];
    });

    effect(() => {
      const view = this.activeView();
      const campusId = this.selectedCampusId();
      const anneeId = this.selectedCentralAcademicYearId();
      this.enrollmentOperation();
      if (view === 'enrollments' && campusId && anneeId && this.centralApi.estConnecte()) {
        this.chargerCandidatsInscriptions();
      }
    });

    effect(() => {
      const view = this.activeView();
      const campusId = this.selectedCampusId();
      const anneeId = this.selectedCentralAcademicYearId();
      const classeId = this.selectedClassId();
      if (view === 'assessments' && campusId && anneeId && classeId && this.centralApi.estConnecte()) this.chargerEvaluations();
    });

    effect(() => {
      const view = this.activeView();
      const campusId = this.selectedCampusId();
      const anneeId = this.selectedCentralAcademicYearId();
      const classeId = this.selectedClassId();
      if (view === 'attendance' && campusId && anneeId && classeId && this.centralApi.estConnecte()) {
        this.chargerSeances();
      }
    });

    effect(() => {
      const view = this.activeView();
      const campusId = this.selectedCampusId();
      const anneeId = this.selectedCentralAcademicYearId();
      if (['subjects', 'class-subjects', 'curriculum', 'timetable', 'timetable-builder'].includes(view) && campusId && anneeId && this.centralApi.estConnecte()) {
        this.chargerPedagogie();
      }
    });

    effect(() => {
      const view = this.activeView();
      const campusId = this.selectedCampusId();
      const anneeId = this.selectedCentralAcademicYearId();
      const classeId = this.selectedClassId();
      if (['timetable', 'timetable-builder'].includes(view) && campusId && anneeId && classeId && this.centralApi.estConnecte()) {
        this.chargerEmploiTemps();
      }
    });

    effect(() => {
      const view = this.activeView();
      const campusId = this.selectedCampusId();
      this.anneesScolairesDisponibles();
      this.students();
      const annee = view === 'fees'
        ? this.selectedFeeAcademicYear()
        : view === 'payments'
          ? this.selectedCollectionAcademicYear()
          : view === 'expense-settings' || view === 'expenses'
            ? this.selectedExpenseAcademicYear()
            : this.selectedFinanceAcademicYear();
      if (['fees', 'payments', 'expense-settings', 'expenses', 'finance'].includes(view) && campusId && annee && this.centralApi.estConnecte()) {
        this.chargerFinances(annee);
      }
    });

    effect(() => {
      const campusId = this.selectedCampusId();
      this.teacherDataSource.data = this.teachers()
        .filter((teacher) => teacher.campusId === campusId)
        .map((teacher, index) => ({
          ...teacher,
          img: `assets/images/user/user${((index + 4) % 9) + 1}.jpg`,
        }));
    });

    effect(() => {
      const campusId = this.selectedCampusId();
      this.staffDataSource.data = this.schoolStaff()
        .filter((person) => person.campusId === campusId)
        .map((person, index) => ({
          ...person,
          img: `assets/images/user/user${((index + 6) % 9) + 1}.jpg`,
        }));
    });

    effect(() => {
      const campusId = this.selectedCampusId();
      this.guardianDataSource.data = this.guardians()
        .filter((guardian) => guardian.campusId === campusId)
        .map((guardian, index) => ({
          ...guardian,
          img: `assets/images/user/user${((index + 1) % 9) + 1}.jpg`,
        }));
    });

    effect(() => {
      this.financeDataSource.data = this.filteredFinanceEntries().map((entry) => ({
        ...entry,
        dateLabel: this.formatPaymentDate(entry.date),
        incomingAmount: entry.direction === 'Entrée' ? this.formatExpenseAmount(entry.amount) : '—',
        outgoingAmount: entry.direction === 'Sortie' ? this.formatExpenseAmount(entry.amount) : '—',
        canToggleStatus: entry.source === 'Saisie manuelle',
      }));
    });
  }

  requestConfirmation(
    state: Omit<ConfirmationDialogState, 'tone'> & { tone?: ConfirmationDialogState['tone'] },
    action: () => void,
  ): void {
    this.pendingConfirmationAction = action;
    this.confirmationDialog.set({ ...state, tone: state.tone ?? 'danger' });
  }

  closeConfirmation(): void {
    this.pendingConfirmationAction = null;
    this.confirmationDialog.set(null);
  }

  confirmPendingAction(): void {
    const action = this.pendingConfirmationAction;
    this.pendingConfirmationAction = null;
    this.confirmationDialog.set(null);
    action?.();
  }

  setView(view: PrimaryView): void {
    if (view === 'teachers') {
      this.teacherEditorOpen.set(false);
    }
    if (view === 'classes') {
      this.classEditorOpen.set(false);
      this.classCurriculumOpen.set(false);
    }
    if (view === 'series') {
      this.seriesEditorOpen.set(false);
    }
    if (view === 'subjects') {
      this.subjectEditorOpen.set(false);
    }
    if (view === 'staff') {
      this.staffEditorOpen.set(false);
    }
    this.workspace.selectView(view);
    const destination = this.workspace.cheminVue(view);
    const cheminActuel = this.router.url.split('?')[0].split('#')[0];
    if (cheminActuel !== destination) {
      void this.router.navigateByUrl(destination);
    }
  }

  setLocale(locale: PrimaryLocale): void {
    this.locale.set(locale);
  }

  isRtl(): boolean {
    return this.locale() === 'ar';
  }

  t(key: string): string {
    return this.translations[this.locale()][key]
      ?? this.translations.fr[key]
      ?? this.workspace.translate(key);
  }

  changeCampus(campusId: string): void {
    this.selectedCampusId.set(campusId);
    this.chargerClasses();
    const campusClasses = this.classes().filter((item) => item.campusId === campusId);
    const firstClass = campusClasses[0];
    if (firstClass) {
      this.selectedClassId.set(firstClass.id);
      this.enrollmentSourceClassId.set('non-affectee');
      this.enrollmentTargetClassId.set(campusClasses[1]?.id ?? firstClass.id);
      this.enrollmentSelectedStudentIds.set([]);
    }
  }

  selectClass(classId: string): void {
    this.selectedClassId.set(classId);
    this.selectedSessionId.set(null);
  }

  changeEnrollmentSource(classId: string): void {
    this.enrollmentSourceClassId.set(classId);
    this.enrollmentSelectedStudentIds.set([]);
  }

  changeEnrollmentOperation(operation: EnrollmentOperation): void {
    this.enrollmentOperation.set(operation);
    this.enrollmentSelectedStudentIds.set([]);
    this.enrollmentCandidates.set([]);
    this.enrollmentSourceOptions.set([]);
  }

  changeEnrollmentTarget(classId: string): void {
    this.enrollmentTargetClassId.set(classId);
  }

  setEnrollmentSelection(rows: EnrollmentCandidateRow[]): void {
    this.enrollmentSelectedStudentIds.set(rows.map((row) => row.backendId));
  }

  enrollmentActionLabel(): string {
    return this.enrollmentOperation() === 'registration'
      ? 'Inscrire et préparer l’encaissement'
      : this.enrollmentOperation() === 'reenrollment'
        ? 'Réinscrire et préparer l’encaissement'
        : 'Transférer vers la nouvelle classe';
  }

  applyEnrollmentAssignment(): void {
    const targetClass = this.enrollmentTargetClass();
    const selectedIds = this.enrollmentSelectedStudentIds();
    const anneeId = this.selectedCentralAcademicYearId();

    if (!targetClass || !selectedIds.length || !anneeId) {
      this.snackBar.open('Sélectionnez au moins un élève et une classe de destination.', 'Fermer', {
        duration: 2800,
      });
      return;
    }
    if (this.enrollmentOperation() === 'transfer' && this.enrollmentSourceClassId() === targetClass.id) {
      this.snackBar.error('La classe de départ et la classe de destination doivent être différentes.');
      return;
    }
    if (this.enrollmentSaving()) return;
    this.enrollmentSaving.set(true);
    const operation = this.operationInscriptionApi();
    this.centralApi.enregistrerInscriptionsEtablissement({
      type_etablissement: this.codeTypeEtablissementApi(),
      campus_id: this.selectedCampusId(),
      annee_scolaire_centrale_id: anneeId,
      operation,
      classe_source_id: this.enrollmentSourceClassId() || null,
      classe_cible_id: targetClass.id,
      eleve_ids: selectedIds,
    }).subscribe({
      next: (resultat) => {
        this.enrollmentSaving.set(false);
        this.enrollmentSelectedStudentIds.set([]);
        this.chargerClasses();
        this.chargerDossiers(this.workspace.establishmentType(), this.selectedCampusId());
        this.chargerCandidatsInscriptions();
        const creeFrais = operation === 'inscription' || operation === 'reinscription';
        const toast = this.snackBar.success(
          creeFrais ? `${resultat.message} Les frais d’inscription sont prêts à encaisser.` : resultat.message,
          creeFrais ? 'Voir encaissements' : 'Fermer',
        );
        if (creeFrais) toast.onAction().subscribe(() => this.setView('payments'));
      },
      error: (response) => {
        this.enrollmentSaving.set(false);
        this.snackBar.error(response.error?.message ?? 'L’opération d’inscription n’a pas pu être enregistrée.');
      },
    });
  }

  chargerCandidatsInscriptions(): void {
    const anneeId = this.selectedCentralAcademicYearId();
    if (!anneeId || !this.selectedCampusId()) return;
    this.enrollmentLoading.set(true);
    this.centralApi.candidatsInscriptionsEtablissement(
      this.codeTypeEtablissementApi(),
      this.selectedCampusId(),
      anneeId,
      this.operationInscriptionApi(),
    ).subscribe({
      next: (resultat) => {
        const candidats = resultat.data.map((item, index) => this.presenterCandidatInscription(item, index));
        this.enrollmentCandidates.set(candidats);
        this.enrollmentSourceOptions.set(resultat.classes_sources.map((source) => ({
          id: source.id,
          label: source.libelle,
          year: source.annee ?? '',
        })));
        const sourceActuelleExiste = resultat.classes_sources.some((source) => source.id === this.enrollmentSourceClassId());
        this.enrollmentSourceClassId.set(sourceActuelleExiste ? this.enrollmentSourceClassId() : resultat.classes_sources[0]?.id ?? '');
        this.enrollmentSelectedStudentIds.set([]);
        this.enrollmentLoading.set(false);
      },
      error: (response) => {
        this.enrollmentLoading.set(false);
        this.enrollmentCandidates.set([]);
        this.enrollmentSourceOptions.set([]);
        this.snackBar.error(response.error?.message ?? 'Impossible de charger les élèves disponibles.');
      },
    });
  }

  private operationInscriptionApi(): OperationInscriptionApi {
    return this.enrollmentOperation() === 'registration'
      ? 'inscription'
      : this.enrollmentOperation() === 'reenrollment'
        ? 'reinscription'
        : 'transfert';
  }

  private presenterCandidatInscription(item: CandidatInscriptionApi, index: number): EnrollmentCandidateRow {
    return {
      backendId: item.eleve_id,
      name: `${item.prenom} ${item.nom}`.trim(),
      matricule: item.matricule,
      gender: item.sexe === 'M' ? 'M' : 'F',
      birthDate: item.date_naissance ?? 'Non renseignée',
      guardianName: item.tuteur_nom ?? 'Tuteur à renseigner',
      guardianPhone: item.tuteur_telephone ?? 'Non renseigné',
      sourceClassId: item.classe_source_id,
      sourceClassName: item.classe_source,
      sourceYear: item.annee_source ?? '',
      status: item.statut,
      img: `assets/images/user/user${(index % 9) + 1}.jpg`,
    };
  }

  staffAbsencePeople(type = this.staffAbsenceForm.personType): StaffAbsencePerson[] {
    const campusId = this.selectedCampusId();
    if (type === 'Enseignant') {
      return this.teachers()
        .filter((teacher) => teacher.campusId === campusId)
        .map((teacher) => ({
          id: teacher.id,
          type: 'Enseignant' as const,
          name: teacher.name,
          role: teacher.subject,
          matricule: teacher.matricule,
        }));
    }
    return this.schoolStaff()
      .filter((person) => person.campusId === campusId)
      .map((person) => ({
        id: person.id,
        type: 'Personnel' as const,
        name: person.name,
        role: person.function,
        matricule: person.matricule,
      }));
  }

  visibleStaffAbsences(): StaffAbsence[] {
    const filter = this.staffAbsenceFilter();
    return this.staffAbsences()
      .filter((absence) => absence.campusId === this.selectedCampusId())
      .filter((absence) => filter === 'Tous' || absence.personType === filter)
      .sort((first, second) => `${second.date}-${second.startTime}`.localeCompare(`${first.date}-${first.startTime}`));
  }

  staffAbsencePerson(absence: StaffAbsence): StaffAbsencePerson | null {
    return this.staffAbsencePeople(absence.personType)
      .find((person) => person.id === absence.personId) ?? null;
  }

  selectStaffAbsenceFilter(filter: 'Tous' | StaffAbsencePersonType): void {
    this.staffAbsenceFilter.set(filter);
  }

  openStaffAbsenceEditor(): void {
    const people = this.staffAbsencePeople('Enseignant');
    this.staffAbsenceForm = {
      personType: 'Enseignant',
      personId: people[0]?.id ?? null,
      date: '2026-11-24',
      startTime: '08:00',
      endTime: '12:00',
      reason: '',
    };
    this.staffAbsenceEditorOpen.set(true);
  }

  closeStaffAbsenceEditor(): void {
    this.staffAbsenceEditorOpen.set(false);
  }

  changeStaffAbsencePersonType(type: StaffAbsencePersonType): void {
    this.staffAbsenceForm.personType = type;
    this.staffAbsenceForm.personId = this.staffAbsencePeople(type)[0]?.id ?? null;
  }

  saveStaffAbsence(): void {
    const form = this.staffAbsenceForm;
    if (!form.personId || !form.date || !form.startTime || !form.endTime || form.endTime <= form.startTime) {
      this.snackBar.open('Renseignez la personne, la date et un horaire valide.', 'Fermer', { duration: 3000 });
      return;
    }
    const id = Math.max(0, ...this.staffAbsences().map((absence) => absence.id)) + 1;
    this.staffAbsences.update((absences) => [
      {
        id,
        campusId: this.selectedCampusId(),
        personType: form.personType,
        personId: form.personId as number,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        reason: form.reason.trim() || 'Absence non motivée',
      },
      ...absences,
    ]);
    this.staffAbsenceEditorOpen.set(false);
    this.snackBar.open('Absence enregistrée.', 'Fermer', { duration: 2500 });
  }

  deleteStaffAbsence(absenceId: number): void {
    const absence = this.staffAbsences().find((item) => item.id === absenceId);
    const personName = absence ? this.staffAbsencePerson(absence)?.name : '';
    this.requestConfirmation({
      title: 'Supprimer cette absence ?',
      message: `L’absence${personName ? ` de ${personName}` : ''} sera définitivement retirée du registre.`,
      confirmLabel: 'Supprimer',
      icon: 'delete_outline',
    }, () => {
      this.staffAbsences.update((absences) => absences.filter((item) => item.id !== absenceId));
      this.snackBar.open('Absence supprimée.', 'Fermer', { duration: 2200 });
    });
  }

  selectedStudentListLabel(): string {
    return this.selectedClassId() === 'unassigned'
      ? 'Classe non définie'
      : this.selectedClass()?.name ?? 'Élèves';
  }

  openStudentImport(): void {
    this.studentImportFile.set(null);
    this.studentImportOpen.set(true);
  }

  closeStudentImport(): void {
    this.studentImportFile.set(null);
    this.studentImportOpen.set(false);
  }

  onStudentImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.studentImportFile.set(file);
    input.value = '';
  }

  downloadStudentImportTemplate(): void {
    const headers = [
      'matricule', 'prenom_eleve', 'nom_eleve', 'sexe', 'date_naissance',
      'lieu_naissance', 'nationalite', 'adresse_eleve', 'groupe_sanguin',
      'observations_medicales', 'regime', 'cantine', 'transport',
      'prenom_tuteur', 'nom_tuteur', 'telephone_tuteur',
      'telephone_secondaire_tuteur', 'email_tuteur', 'profession_tuteur',
      'adresse_tuteur', 'lien_tuteur',
    ];
    const example = [
      'PRI-260049', 'Awa', 'Ndiaye', 'F', '2015-03-12', 'Dakar', 'Sénégalaise',
      'Keur Massar', 'O+', '', 'Externe', 'non', 'non', 'Mariama', 'Ba',
      '77 842 10 24', '76 410 20 15', 'mariama.ba@example.sn', 'Commerçante',
      'Unité 11, Keur Massar', 'Mère',
    ];
    const blob = new Blob([`\ufeff${headers.join(';')}\n${example.join(';')}\n`], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'modele_import_eleves_e-scolarite.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async importStudents(): Promise<void> {
    const file = this.studentImportFile();
    if (!file) {
      this.snackBar.open('Sélectionnez le fichier CSV préparé à partir du modèle.', 'Fermer', { duration: 3000 });
      return;
    }

    try {
      const rows = this.parseStudentImportCsv(await file.text());
      const eleves = rows.flatMap((row) => {
        const firstName = this.studentImportValue(row, 'prenom_eleve', 'prenom', 'first_name');
        const lastName = this.studentImportValue(row, 'nom_eleve', 'nom', 'last_name');
        if (!firstName || !lastName) {
          return [];
        }
        const importedGender = this.studentImportValue(row, 'sexe', 'gender').toLowerCase();
        return [{
          matricule: this.studentImportValue(row, 'matricule') || null,
          prenom: firstName,
          nom: lastName,
          sexe: importedGender.startsWith('f') ? 'F' : 'M',
          date_naissance: this.studentImportValue(row, 'date_naissance', 'birth_date') || null,
          lieu_naissance: this.studentImportValue(row, 'lieu_naissance', 'birth_place') || null,
          nationalite: this.studentImportValue(row, 'nationalite') || 'Sénégalaise',
          adresse: this.studentImportValue(row, 'adresse_eleve', 'adresse') || null,
          telephone_tuteur: this.studentImportValue(row, 'telephone_tuteur', 'telephone', 'phone_tuteur') || null,
          prenom_tuteur: this.studentImportValue(row, 'prenom_tuteur', 'prenom_responsable', 'guardian_first_name') || null,
          nom_tuteur: this.studentImportValue(row, 'nom_tuteur', 'nom_responsable', 'guardian_last_name') || null,
          telephone_secondaire_tuteur: this.studentImportValue(row, 'telephone_secondaire_tuteur', 'second_phone_tuteur') || null,
          email_tuteur: this.studentImportValue(row, 'email_tuteur', 'guardian_email') || null,
          profession_tuteur: this.studentImportValue(row, 'profession_tuteur', 'guardian_profession') || null,
          adresse_tuteur: this.studentImportValue(row, 'adresse_tuteur', 'guardian_address') || null,
          lien_tuteur: this.studentImportValue(row, 'lien_tuteur', 'lien_parente', 'relation_tuteur') || null,
          groupe_sanguin: this.studentImportValue(row, 'groupe_sanguin') || null,
          notes_medicales: this.studentImportValue(row, 'observations_medicales', 'notes_medicales') || null,
          regime: this.studentImportValue(row, 'regime') || 'Externe',
          cantine: this.studentImportBoolean(row, 'cantine'),
          transport: this.studentImportBoolean(row, 'transport'),
        }];
      });

      if (!eleves.length) {
        this.snackBar.open('Aucun élève valide : renseignez au minimum prénom et nom.', 'Fermer', { duration: 3500 });
        return;
      }
      if (eleves.some((eleve) => !eleve.prenom_tuteur || !eleve.nom_tuteur || !eleve.telephone_tuteur)) {
        this.snackBar.open('Chaque ligne doit inclure le prénom, le nom et le téléphone du tuteur.', 'Fermer', { duration: 4000 });
        return;
      }
      if (this.dossierSaving()) return;
      this.dossierSaving.set(true);
      this.centralApi.importerElevesEtablissement({
        type_etablissement: this.codeTypeEtablissementApi(),
        campus_id: this.selectedCampusId(),
        eleves,
      }).subscribe({
        next: (resultat) => {
          this.dossierSaving.set(false);
          this.appliquerDossiersApi(resultat, this.selectedCampusId());
          this.selectClass('unassigned');
          this.closeStudentImport();
          const complement = resultat.tuteurs_crees || resultat.tuteurs_reutilises
            ? ` ${resultat.tuteurs_crees} tuteur${resultat.tuteurs_crees > 1 ? 's créés' : ' créé'} · ${resultat.tuteurs_reutilises} réutilisé${resultat.tuteurs_reutilises > 1 ? 's' : ''}.`
            : '';
          this.snackBar.open(`${resultat.message}${complement}`, 'Fermer', { duration: 4200 });
        },
        error: (response) => {
          this.dossierSaving.set(false);
          this.snackBar.open(response.error?.message ?? 'L’import des élèves a échoué.', 'Fermer', { duration: 4200 });
        },
      });
    } catch {
      this.snackBar.open('Le fichier ne peut pas être lu. Téléchargez le modèle puis enregistrez-le au format CSV.', 'Fermer', { duration: 4000 });
    }
  }

  private studentImportBoolean(row: Record<string, string>, ...keys: string[]): boolean {
    const value = this.studentImportValue(row, ...keys).trim().toLowerCase();
    return ['1', 'oui', 'o', 'true', 'vrai'].includes(value);
  }

  openWorkforceImport(kind: WorkforceImportKind): void {
    this.workforceImportFile.set(null);
    this.workforceImportKind.set(kind);
  }

  closeWorkforceImport(): void {
    this.workforceImportFile.set(null);
    this.workforceImportKind.set(null);
  }

  onWorkforceImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.workforceImportFile.set(input.files?.[0] ?? null);
    input.value = '';
  }

  workforceImportLabel(plural = false): string {
    if (this.workforceImportKind() === 'teacher') return plural ? 'enseignants' : 'enseignant';
    return plural ? 'membres du personnel' : 'personnel';
  }

  downloadWorkforceImportTemplate(): void {
    const teacher = this.workforceImportKind() === 'teacher';
    const commonHeaders = [
      'matricule', 'prenom', 'nom', 'sexe', 'date_naissance', 'lieu_naissance',
      'telephone', 'email', 'adresse', 'date_embauche', 'type_contrat', 'statut',
      'contact_urgence_nom', 'contact_urgence_telephone',
    ];
    const headers = teacher
      ? [...commonHeaders, 'specialite', 'diplome', 'experience_annees', 'type_remuneration', 'salaire_mensuel', 'montant_heure']
      : [...commonHeaders, 'fonction', 'salaire_mensuel'];
    const commonExample = [
      teacher ? 'ENS-260012' : 'PER-260018', 'Fatou', 'Ndiaye', 'F', '1990-05-14', 'Dakar',
      '77 123 45 67', 'fatou.ndiaye@example.sn', 'Keur Massar', '2026-09-01', 'Permanent', 'actif',
      'Moussa Ndiaye', '76 234 56 78',
    ];
    const example = teacher
      ? [...commonExample, 'Mathématiques', 'Licence', '6', 'mensuelle', '250000', '']
      : [...commonExample, 'Secrétaire scolaire', '180000'];
    const blob = new Blob([`\ufeff${headers.join(';')}\n${example.join(';')}\n`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = teacher ? 'modele_import_enseignants_e-scolarite.csv' : 'modele_import_personnels_e-scolarite.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async importWorkforce(): Promise<void> {
    const kind = this.workforceImportKind();
    const file = this.workforceImportFile();
    if (!kind || !file) {
      this.snackBar.error('Sélectionnez le fichier CSV préparé à partir du modèle.');
      return;
    }

    try {
      const rows = this.parseStudentImportCsv(await file.text());
      const personnes = rows.flatMap<Record<string, unknown>>((row): Array<Record<string, unknown>> => {
        const prenom = this.studentImportValue(row, 'prenom', 'first_name');
        const nom = this.studentImportValue(row, 'nom', 'last_name');
        if (!prenom || !nom) return [];
        const sexeBrut = this.studentImportValue(row, 'sexe', 'gender').toLowerCase();
        const statutBrut = this.studentImportValue(row, 'statut', 'status').toLowerCase();
        const commun: Record<string, unknown> = {
          matricule: this.studentImportValue(row, 'matricule') || null,
          prenom,
          nom,
          sexe: sexeBrut.startsWith('f') ? 'F' : sexeBrut.startsWith('m') ? 'M' : null,
          date_naissance: this.studentImportValue(row, 'date_naissance', 'birth_date') || null,
          lieu_naissance: this.studentImportValue(row, 'lieu_naissance', 'birth_place') || null,
          telephone: this.studentImportValue(row, 'telephone', 'phone') || null,
          email: this.studentImportValue(row, 'email') || null,
          adresse: this.studentImportValue(row, 'adresse', 'address') || null,
          date_embauche: this.studentImportValue(row, 'date_embauche', 'hire_date') || null,
          type_contrat: this.studentImportValue(row, 'type_contrat', 'contrat') || null,
          statut: statutBrut.includes('suspend') ? 'suspendu' : statutBrut.includes('cong') ? 'conge' : 'actif',
          contact_urgence_nom: this.studentImportValue(row, 'contact_urgence_nom', 'personne_a_contacter') || null,
          contact_urgence_telephone: this.studentImportValue(row, 'contact_urgence_telephone', 'telephone_urgence') || null,
          salaire_mensuel: this.workforceImportNumber(row, 'salaire_mensuel', 'salaire'),
        };
        if (kind === 'teacher') {
          const remuneration = this.studentImportValue(row, 'type_remuneration', 'mode_remuneration').toLowerCase();
          return [{
            ...commun,
            specialite: this.studentImportValue(row, 'specialite', 'matiere') || null,
            diplome: this.studentImportValue(row, 'diplome') || null,
            experience_annees: this.workforceImportNumber(row, 'experience_annees', 'experience'),
            type_remuneration: remuneration.startsWith('h') ? 'horaire' : 'mensuelle',
            montant_heure: this.workforceImportNumber(row, 'montant_heure', 'tarif_horaire'),
          }];
        }
        return [{ ...commun, fonction: this.studentImportValue(row, 'fonction') || null }];
      });

      if (!personnes.length) {
        this.snackBar.error('Aucun dossier valide : renseignez au minimum le prénom et le nom.');
        return;
      }
      if (kind === 'staff' && personnes.some((personne) => !personne['fonction'])) {
        this.snackBar.error('Chaque membre du personnel doit avoir une fonction.');
        return;
      }
      if (this.dossierSaving()) return;
      this.dossierSaving.set(true);
      const donnees = {
        type_etablissement: this.codeTypeEtablissementApi(),
        campus_id: this.selectedCampusId(),
        personnes,
      };
      const requete = kind === 'teacher'
        ? this.centralApi.importerEnseignantsEtablissement(donnees)
        : this.centralApi.importerPersonnelsEtablissement(donnees);
      requete.subscribe({
        next: (resultat) => {
          this.dossierSaving.set(false);
          this.appliquerDossiersApi(resultat, this.selectedCampusId());
          this.closeWorkforceImport();
          this.snackBar.success(`${resultat.message} ${resultat.crees} créé(s) · ${resultat.reutilises} dossier(s) existant(s) réutilisé(s).`);
        },
        error: (response) => {
          this.dossierSaving.set(false);
          this.snackBar.error(response.error?.message ?? `L’import des ${this.workforceImportLabel(true)} a échoué.`);
        },
      });
    } catch {
      this.snackBar.error('Le fichier ne peut pas être lu. Téléchargez le modèle puis conservez le format CSV.');
    }
  }

  private workforceImportNumber(row: Record<string, string>, ...keys: string[]): number | null {
    const value = this.studentImportValue(row, ...keys).replace(/\s/g, '').replace(',', '.');
    if (!value) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  openSessionGenerator(): void {
    this.selectedSessionId.set(null);
    this.sessionGeneratorOpen.set(true);
  }

  closeSessionGenerator(): void {
    this.sessionGeneratorOpen.set(false);
  }

  setSessionSearch(value: string): void {
    this.sessionSearch.set(value);
    this.sessionPage.set(1);
  }

  setSessionStatusFilter(value: 'Toutes' | SessionStatus): void {
    this.sessionStatusFilter.set(value);
    this.sessionPage.set(1);
  }

  toggleSessionSort(key: SessionSortKey): void {
    if (this.sessionSortKey() === key) {
      this.sessionSortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.sessionSortKey.set(key);
      this.sessionSortDirection.set('asc');
    }
    this.sessionPage.set(1);
  }

  sessionSortIcon(key: SessionSortKey): string {
    return this.sessionSortKey() !== key ? 'unfold_more' : this.sessionSortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  setSessionPage(page: number): void {
    this.sessionPage.set(Math.min(Math.max(1, page), this.sessionPageCount()));
  }

  setSessionPageSize(value: string): void {
    this.sessionPageSize.set(Number(value) || 10);
    this.sessionPage.set(1);
  }

  addExcludedSessionDate(): void {
    const value = this.excludedSessionDate;
    if (!value || this.excludedSessionDates().includes(value)) {
      return;
    }
    this.excludedSessionDates.update((dates) => [...dates, value].sort());
    this.excludedSessionDate = '';
  }

  removeExcludedSessionDate(date: string): void {
    this.excludedSessionDates.update((dates) => dates.filter((item) => item !== date));
  }

  generateSessions(): void {
    const { startDate, endDate, includeHolidays } = this.sessionGenerationForm;
    if (!startDate || !endDate || startDate > endDate) {
      this.snackBar.open('Veuillez saisir une période valide.', 'Fermer', {
        duration: 2800,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      return;
    }

    const start = this.parseIsoDate(startDate);
    const end = this.parseIsoDate(endDate);
    const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    if (dayCount > 366) {
      this.snackBar.open('La période ne peut pas dépasser une année.', 'Fermer', {
        duration: 2800,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      return;
    }

    const context = this.pedagogyContext();
    const classeId = this.selectedClassId();
    if (!context || !classeId) {
      this.snackBar.error('Sélectionnez une classe avant de générer les séances.');
      return;
    }
    const datesExclues = [
      ...this.excludedSessionDates(),
      ...(!includeHolidays ? this.schoolHolidays.map((holiday) => holiday.date) : []),
    ].filter((date, index, dates) => dates.indexOf(date) === index);
    this.sessionsLoading.set(true);
    this.centralApi.genererSeancesEtablissement(classeId, {
      ...context,
      date_debut: startDate,
      date_fin: endDate,
      dates_exclues: datesExclues,
    }).subscribe({
      next: (resultat) => {
        this.sessionsLoading.set(false);
        this.appliquerSeancesBackend(resultat.data);
        this.sessionGeneratorOpen.set(false);
        this.snackBar.success(resultat.message);
      },
      error: (response) => {
        this.sessionsLoading.set(false);
        this.snackBar.error(response.error?.message ?? 'Les séances n’ont pas pu être générées.');
      },
    });
  }

  openSession(session: SchoolSession): void {
    this.selectedClassId.set(session.classId);
    this.selectedSessionId.set(session.id);
    this.sessionGeneratorOpen.set(false);
    this.sessionDescriptionDraft = session.description;
    this.sessionLessonDraft = session.lessonTitle;
    const savedAttendance = this.sessionAttendance()[session.id];
    const initialAttendance = Object.fromEntries(
      this.students()
        .filter((student) => student.classId === session.classId)
        .map((student) => [student.id, savedAttendance?.[student.id] ?? 'P']),
    );
    this.attendance.set(initialAttendance);
    this.attendanceNotes = { ...(this.sessionAttendanceNotes()[session.id] ?? {}) };
  }

  backToSessionList(): void {
    this.selectedSessionId.set(null);
  }

  saveSession(): void {
    const session = this.selectedSession();
    if (!session) {
      return;
    }
    this.sessions.update((sessions) =>
      sessions.map((item) => item.id === session.id
        ? {
            ...item,
            description: this.sessionDescriptionDraft.trim(),
            lessonTitle: this.sessionLessonDraft.trim(),
            status: 'Terminée',
          }
        : item),
    );
    this.sessionAttendance.update((state) => ({ ...state, [session.id]: { ...this.attendance() } }));
    this.sessionAttendanceNotes.update((state) => ({
      ...state,
      [session.id]: { ...this.attendanceNotes },
    }));
    this.markCurriculumLessonCompleted(session, this.sessionLessonDraft.trim());
    this.snackBar.open('La séance, le cahier de texte et l’appel ont été enregistrés.', 'Fermer', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  formatSessionDate(date: string): string {
    const dateLocales: Record<PrimaryLocale, string> = {
      fr: 'fr-SN',
      wo: 'wo-SN',
      en: 'en-GB',
      ar: 'ar-SN',
    };
    return new Intl.DateTimeFormat(dateLocales[this.locale()], {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }).format(this.parseIsoDate(date));
  }

  sessionClassName(session: Pick<SchoolSession, 'classId'>): string {
    return this.classes().find((classroom) => classroom.id === session.classId)?.name ?? 'Classe non affectée';
  }

  sessionRoomName(session: SchoolSession): string {
    return this.rooms().find((room) => room.id === session.roomId)?.name ?? 'Salle non affectée';
  }

  sessionStatusClass(status: SessionStatus): string {
    return status === 'Terminée' ? 'completed' : status === 'À compléter' ? 'pending' : 'planned';
  }

  attendanceCount(status: AttendanceStatus): number {
    return Object.values(this.attendance()).filter((value) => value === status).length;
  }

  selectRoom(roomId: string): void {
    this.selectedRoomId.set(roomId);
  }

  openTimetableBuilder(): void {
    this.timetableDraftRows = this.cloneTimetableRows(this.timetableRows());
    this.timetableTeacherAssignments = this.affectationsEnseignantsDepuisEmploiTemps(this.timetableDraftRows);
    this.activeView.set('timetable-builder');
  }

  changeTimetableSubject(
    row: TimetableRow,
    day: TimetableDay,
    subject: string,
  ): void {
    row.cells[day].subject = subject;
    if (subject === 'Pause' || !subject) {
      row.cells[day].teacherId = null;
      row.cells[day].roomId = null;
      return;
    }
    this.timetableTeacherAssignments[subject] ??= null;
    row.cells[day].teacherId = this.timetableTeacherAssignments[subject];
    if (!this.isCollege()) row.cells[day].roomId = this.selectedRoomId();
  }

  timetableSelectedSubjects(): PrimarySubject[] {
    const selectedNames = new Set<string>();
    this.timetableDraftRows.forEach((row) => {
      this.timetableDays.forEach((day) => {
        const subject = row.cells[day.key].subject;
        if (subject && subject !== 'Pause') selectedNames.add(subject);
      });
    });
    return this.assignedCurriculumSubjects().filter((subject) => selectedNames.has(subject.name));
  }

  timetableTeacherId(subjectName: string): number | null {
    return this.timetableTeacherAssignments[subjectName] ?? null;
  }

  assignTimetableTeacher(subjectName: string, teacherId: string | number | null): void {
    const normalizedTeacherId = teacherId === null || teacherId === ''
      ? null
      : Number(teacherId);
    this.timetableTeacherAssignments = {
      ...this.timetableTeacherAssignments,
      [subjectName]: normalizedTeacherId,
    };
    this.timetableDraftRows.forEach((row) => {
      this.timetableDays.forEach((day) => {
        if (row.cells[day.key].subject === subjectName) {
          row.cells[day.key].teacherId = normalizedTeacherId;
        }
      });
    });
  }

  addTimetableRow(): void {
    const nextId =
      Math.max(...this.timetableDraftRows.map((row) => row.id), 0) + 1;
    this.timetableDraftRows = [
      ...this.timetableDraftRows,
      this.createTimetableRow(nextId, '', '', []),
    ];
  }

  saveTimetable(): void {
    const context = this.pedagogyContext();
    const classroom = this.selectedClass();
    const salleId = this.selectedRoomId();
    if (!context || !classroom) {
      this.snackBar.error('Sélectionnez une classe avant d’enregistrer l’emploi du temps.');
      return;
    }
    if (!this.isCollege() && !salleId) {
      this.snackBar.error('Ajoutez puis sélectionnez une salle disponible pour ce campus.');
      return;
    }
    const jours: Record<TimetableDay, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const matiereNonConfiguree = this.timetableDraftRows.some((row) => this.timetableDays.some((day) => {
      const subject = row.cells[day.key].subject;
      return Boolean(subject && subject !== 'Pause' && typeof this.subjects().find((item) => item.name === subject)?.id !== 'string');
    }));
    if (matiereNonConfiguree) {
      this.snackBar.error('Configurez d’abord les matières de cette classe avant de créer son emploi du temps.');
      return;
    }
    const matieresSansEnseignant = this.timetableSelectedSubjects()
      .filter((subject) => !this.timetableTeacherId(subject.name));
    if (matieresSansEnseignant.length) {
      this.snackBar.error('Affectez un enseignant à chaque matière utilisée dans l’emploi du temps.');
      return;
    }
    const celluleSansSalle = this.isCollege() && this.timetableDraftRows.some((row) => this.timetableDays.some((day) => {
      const cellule = row.cells[day.key];
      return Boolean(cellule.subject && cellule.subject !== 'Pause' && !cellule.roomId);
    }));
    if (celluleSansSalle) {
      this.snackBar.error('Choisissez une salle pour chaque créneau de cours du collège.');
      return;
    }
    const creneaux = this.timetableDraftRows.map((row) => ({
      heure_debut: row.startTime,
      heure_fin: row.endTime,
      cellules: this.timetableDays.map((day) => {
        const cell = row.cells[day.key];
        const subject = this.subjects().find((item) => item.name === cell.subject);
        const teacher = this.teachers().find((item) => item.id === this.timetableTeacherId(cell.subject));
        return {
          jour_semaine: jours[day.key],
          est_pause: cell.subject === 'Pause',
          matiere_id: cell.subject && cell.subject !== 'Pause' && typeof subject?.id === 'string' ? subject.id : null,
          enseignant_id: cell.subject && cell.subject !== 'Pause' ? teacher?.teachingBackendId ?? null : null,
          salle_id: cell.subject && cell.subject !== 'Pause' ? (this.isCollege() ? cell.roomId : salleId) : null,
        };
      }),
    }));
    this.timetableLoading.set(true);
    this.centralApi.enregistrerEmploiTempsEtablissement(String(classroom.id), {
      ...context,
      salle_id: this.isCollege() ? null : salleId,
      creneaux,
    }).subscribe({
      next: (resultat) => {
        this.timetableLoading.set(false);
        this.appliquerEmploiTempsBackend(resultat.data);
        this.activeView.set('timetable');
        this.snackBar.success(resultat.message ?? 'L’emploi du temps annuel a été enregistré.');
      },
      error: (response) => {
        this.timetableLoading.set(false);
        this.snackBar.error(response.error?.message ?? 'L’emploi du temps n’a pas pu être enregistré.');
      },
    });
  }

  subjectColor(subjectName: string): string {
    if (subjectName === 'Pause') {
      return '#94a3b8';
    }
    return (
      this.subjects().find((subject) => subject.name === subjectName)?.color ??
      '#cbd5e1'
    );
  }

  teacherName(teacherId: number | null): string {
    return (
      this.teachers().find((teacher) => teacher.id === teacherId)?.name ??
      'Non affecté'
    );
  }

  roomNameById(roomId: string | null): string {
    return this.rooms().find((room) => room.id === roomId)?.name ?? 'Salle non affectée';
  }

  startStudentRegistration(): void {
    this.studentForm = this.createEmptyStudentForm();
    this.studentAttachmentFiles = [];
    this.activeView.set('registrations');
  }

  viewStudent(student: Student): void {
    this.selectedStudentId.set(student.id);
    this.loadStudentForm(student);
    this.studentRecordTab.set('identity');
    this.activeView.set('student-detail');
  }

  viewGuardian(guardian: Guardian): void {
    this.selectedGuardianId.set(guardian.id);
    this.loadGuardianForm(guardian);
    this.guardianRecordTab.set('identity');
    this.activeView.set('guardian-detail');
  }

  viewTeacher(teacher: Teacher): void {
    this.selectedTeacherId.set(teacher.id);
    this.loadTeacherForm(teacher);
    this.teacherRecordTab.set('profile');
    this.teacherEditorOpen.set(false);
    this.activeView.set('teacher-detail');
  }

  viewTeacherSchedule(teacher: Teacher): void {
    this.selectedTeacherId.set(teacher.id);
    this.loadTeacherForm(teacher);
    this.teacherRecordTab.set('timetable');
    this.teacherEditorOpen.set(false);
    this.activeView.set('teacher-detail');
  }

  setStudentRecordTab(tab: StudentRecordTab): void {
    this.studentRecordTab.set(tab);
  }

  setGuardianRecordTab(tab: GuardianRecordTab): void {
    this.guardianRecordTab.set(tab);
  }

  setTeacherRecordTab(tab: TeacherRecordTab): void {
    this.teacherRecordTab.set(tab);
  }

  changeGuardianMode(mode: GuardianMode): void {
    this.studentForm.guardianMode = mode;
    if (mode === 'existing') {
      const guardian =
        this.guardians().find((item) => item.id === this.studentForm.guardianId) ??
        this.campusGuardians()[0];
      if (guardian) {
        this.selectExistingGuardian(guardian.id);
      }
      return;
    }

    this.studentForm.guardianId = null;
    this.studentForm.parentFirstName = '';
    this.studentForm.parentLastName = '';
    this.studentForm.parentRelationship = '';
    this.studentForm.parentProfession = '';
    this.studentForm.parentPhone = '';
    this.studentForm.secondaryPhone = '';
    this.studentForm.email = '';
    this.studentForm.address = '';
  }

  selectExistingGuardian(guardianId: number): void {
    const guardian = this.guardians().find((item) => item.id === Number(guardianId));
    if (!guardian) {
      return;
    }
    this.studentForm.guardianId = guardian.id;
    this.studentForm.parentFirstName = guardian.firstName;
    this.studentForm.parentLastName = guardian.lastName;
    this.studentForm.parentProfession = guardian.profession;
    this.studentForm.parentPhone = guardian.phone;
    this.studentForm.secondaryPhone = guardian.secondaryPhone;
    this.studentForm.email = guardian.email;
    this.studentForm.address = guardian.address;
  }

  editStudent(student: Student): void {
    this.loadStudentForm(student);
    this.activeView.set('registrations');
  }

  private loadStudentForm(student: Student): void {
    this.studentAttachmentFiles = [];
    const names = this.splitStudentName(student.name);
    const guardianNames = this.splitStudentName(student.parentName ?? '');
    this.studentForm = {
      ...this.createEmptyStudentForm(),
      id: student.id,
      matricule: student.matricule,
      firstName: names.firstName,
      lastName: names.lastName,
      gender: student.gender,
      birthDate: this.toInputDate(student.birthDate),
      birthPlace: student.birthPlace ?? '',
      nationality: student.nationality ?? 'Sénégalaise',
      guardianMode: student.guardianId ? 'existing' : 'new',
      guardianId: student.guardianId ?? null,
      parentFirstName: student.parentFirstName ?? guardianNames.firstName,
      parentLastName: student.parentLastName ?? guardianNames.lastName,
      parentRelationship: student.parentRelationship ?? '',
      parentProfession: student.parentProfession ?? '',
      parentPhone: student.parentPhone,
      secondaryPhone: student.secondaryPhone ?? '',
      email: student.email ?? '',
      address: student.address ?? '',
      bloodGroup: student.bloodGroup ?? '',
      medicalNotes: student.medicalNotes ?? '',
      regime: student.regime ?? 'Externe',
      transport: student.transport ?? false,
      canteen: student.canteen ?? false,
      attachments: [...(student.attachments ?? [])],
    };
  }

  deleteStudent(student: Student): void {
    this.requestConfirmation({
      title: 'Supprimer ce dossier élève ?',
      message: `Le dossier de ${student.name} sera définitivement supprimé.`,
      confirmLabel: 'Supprimer le dossier',
      icon: 'delete_outline',
    }, () => {
      this.students.update((items) => items.filter((item) => item.id !== student.id));
      this.snackBar.open('Le dossier élève a été supprimé.', 'Fermer', {
        duration: 2500,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
    });
  }

  deleteStudents(students: Student[]): void {
    if (!students.length) return;
    this.requestConfirmation({
      title: 'Supprimer les dossiers sélectionnés ?',
      message: `${students.length} dossiers élèves seront définitivement supprimés.`,
      confirmLabel: `Supprimer les ${students.length} dossiers`,
      icon: 'delete_outline',
    }, () => {
      const ids = new Set(students.map((student) => student.id));
      this.students.update((items) => items.filter((item) => !ids.has(item.id)));
      this.snackBar.open(`${students.length} dossiers élèves supprimés.`, 'Fermer', {
        duration: 2500,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
    });
  }

  refreshStudents(): void {
    this.centralApi.invaliderCache('institut:dossiers:');
    this.chargerDossiers(this.workspace.establishmentType(), this.selectedCampusId(), true);
  }

  refreshGuardians(): void {
    this.centralApi.invaliderCache('institut:dossiers:');
    this.chargerDossiers(this.workspace.establishmentType(), this.selectedCampusId(), true);
  }

  private chargerDossiers(typeEtablissement: string, campusId: string, notifier = false): void {
    const typeApi = typeEtablissement === 'primary' ? 'primaire' : typeEtablissement;
    const cle = `${typeApi}:${campusId}`;
    this.dossiersRequestKey = cle;
    this.dossiersLoading.set(true);
    this.centralApi.dossiersEtablissement(typeApi, campusId).subscribe({
      next: (dossiers) => {
        if (this.dossiersRequestKey !== cle) {
          return;
        }
        this.appliquerDossiersApi(dossiers, campusId);
        this.dossiersLoading.set(false);
        if (notifier) {
          this.snackBar.open('Les dossiers ont été réactualisés depuis la base de données.', 'Fermer', { duration: 2800 });
        }
      },
      error: (response) => {
        if (this.dossiersRequestKey === cle) this.dossiersLoading.set(false);
        if (notifier) {
          this.snackBar.open(response.error?.message ?? 'Impossible de réactualiser les dossiers.', 'Fermer', { duration: 3800 });
        }
      },
    });
  }

  private appliquerDossiersApi(dossiers: DossiersEtablissementApi, campusId: string): void {
    const tuteurIds = new Map<string, number>();
    const tuteurs = dossiers.tuteurs.map((tuteur, index): Guardian => {
      const id = index + 1;
      tuteurIds.set(tuteur.id, id);
      return {
        id,
        backendId: tuteur.id,
        campusId,
        firstName: tuteur.prenom,
        lastName: tuteur.nom,
        name: `${tuteur.prenom} ${tuteur.nom}`.trim(),
        profession: tuteur.profession ?? '',
        phone: tuteur.telephone ?? '',
        secondaryPhone: tuteur.telephone_secondaire ?? '',
        email: tuteur.email ?? '',
        address: tuteur.adresse ?? '',
        childrenCount: Number(tuteur.nombre_enfants ?? 0),
        accountStatus: this.statutComptePortail(tuteur.statut_compte),
      };
    });
    this.guardians.set(tuteurs);

    this.students.set(dossiers.eleves.map((eleve, index): Student => {
      const tuteur = eleve.tuteur;
      return {
        id: index + 1,
        backendId: eleve.id,
        campusId,
        classId: eleve.classe_id ?? '',
        matricule: eleve.matricule,
        name: `${eleve.prenom} ${eleve.nom}`.trim(),
        gender: eleve.sexe === 'F' ? 'F' : 'M',
        birthDate: this.toDisplayDate(eleve.date_naissance ?? ''),
        birthPlace: eleve.lieu_naissance ?? '',
        nationality: eleve.nationalite ?? '',
        guardianId: tuteur ? tuteurIds.get(tuteur.id) : undefined,
        parentName: tuteur ? `${tuteur.prenom} ${tuteur.nom}`.trim() : '',
        parentFirstName: tuteur?.prenom ?? '',
        parentLastName: tuteur?.nom ?? '',
        parentRelationship: tuteur?.lien_parente ?? '',
        parentProfession: tuteur?.profession ?? '',
        parentPhone: tuteur?.telephone ?? '',
        secondaryPhone: tuteur?.telephone_secondaire ?? '',
        email: tuteur?.email ?? '',
        address: eleve.adresse ?? tuteur?.adresse ?? '',
        bloodGroup: eleve.groupe_sanguin ?? '',
        medicalNotes: eleve.notes_medicales ?? '',
        regime: eleve.regime ?? 'Externe',
        transport: Boolean(eleve.transport),
        canteen: Boolean(eleve.cantine),
        status: tuteur ? 'Actif' : 'En attente',
        attachments: [...(eleve.pieces_jointes ?? [])],
        portalAccount: this.statutComptePortail(tuteur?.statut_compte),
      };
    }));

    this.teachers.set(dossiers.enseignants.map((personne, index) =>
      this.mapperEnseignantApi(personne, campusId, index + 1),
    ));
    this.schoolStaff.set(dossiers.personnels.map((personne, index) =>
      this.mapperPersonnelApi(personne, campusId, index + 1),
    ));
  }

  private mapperEnseignantApi(personne: PersonnelEtablissementApi, campusId: string, id: number): Teacher {
    return {
      id,
      backendId: personne.id,
      teachingBackendId: personne.enseignant_id ?? undefined,
      campusId,
      matricule: personne.matricule,
      name: `${personne.prenom} ${personne.nom}`.trim(),
      gender: personne.sexe === 'F' ? 'F' : 'M',
      email: personne.email ?? '',
      phone: personne.telephone ?? '',
      subject: personne.specialite ?? '',
      degree: personne.diplome ?? '',
      hireDate: this.toDisplayDate(personne.date_embauche ?? ''),
      status: personne.statut === 'conge' ? 'En congé' : 'Actif',
      contractType: personne.type_contrat ?? '',
      address: personne.adresse ?? '',
      birthDate: this.toDisplayDate(personne.date_naissance ?? ''),
      birthPlace: personne.lieu_naissance ?? '',
      emergencyContact: personne.contact_urgence_nom ?? '',
      emergencyPhone: personne.contact_urgence_telephone ?? '',
      experience: personne.experience_annees === null || personne.experience_annees === undefined ? '' : String(personne.experience_annees),
      salary: personne.montant_mensuel === null || personne.montant_mensuel === undefined ? '' : String(personne.montant_mensuel),
      hourlyRate: personne.montant_heure === null || personne.montant_heure === undefined ? '' : String(personne.montant_heure),
      salaryMode: personne.type_remuneration === 'horaire' ? 'Horaire' : 'Mensuel',
      attachments: [...(personne.pieces_jointes ?? [])],
      portalAccount: this.statutComptePortail(personne.statut_compte),
    };
  }

  private mapperPersonnelApi(personne: PersonnelEtablissementApi, campusId: string, id: number): SchoolStaff {
    return {
      id,
      backendId: personne.id,
      campusId,
      matricule: personne.matricule,
      name: `${personne.prenom} ${personne.nom}`.trim(),
      gender: personne.sexe === 'F' ? 'F' : 'M',
      email: personne.email ?? '',
      phone: personne.telephone ?? '',
      function: personne.fonction ?? '',
      birthDate: this.toDisplayDate(personne.date_naissance ?? ''),
      birthPlace: personne.lieu_naissance ?? '',
      address: personne.adresse ?? '',
      hireDate: this.toDisplayDate(personne.date_embauche ?? ''),
      contractType: personne.type_contrat ?? '',
      status: personne.statut === 'suspendu' ? 'Suspendu' : personne.statut === 'conge' ? 'En congé' : 'Actif',
      salary: personne.montant_mensuel === null || personne.montant_mensuel === undefined ? '' : String(personne.montant_mensuel),
      hourlyRate: '',
      emergencyContact: personne.contact_urgence_nom ?? '',
      emergencyPhone: personne.contact_urgence_telephone ?? '',
      attachments: [...(personne.pieces_jointes ?? [])],
      portalAccount: this.statutComptePortail(personne.statut_compte),
    };
  }

  private statutComptePortail(statut?: string | null): PortalAccountStatus {
    if (statut === 'actif') return 'Actif';
    if (statut === 'inactif' || statut === 'suspendu') return 'Désactivé';
    return 'Non créé';
  }

  private loadGuardianForm(guardian: Guardian): void {
    this.guardianForm = {
      id: guardian.id,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      profession: guardian.profession,
      phone: guardian.phone,
      secondaryPhone: guardian.secondaryPhone,
      email: guardian.email,
      address: guardian.address,
    };
  }

  private createEmptyGuardianForm(): GuardianFormModel {
    return { id: null, firstName: '', lastName: '', profession: '', phone: '', secondaryPhone: '', email: '', address: '' };
  }

  saveGuardianRecord(): void {
    const form = this.guardianForm;
    const guardianId = form.id;
    if (!guardianId || !form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      this.snackBar.open('Renseignez le prénom, le nom et le téléphone du tuteur.', 'Fermer', { duration: 3000 });
      return;
    }
    const tuteur = this.guardians().find((item) => item.id === guardianId);
    if (!tuteur?.backendId) {
      this.snackBar.open('Ce dossier tuteur doit être rechargé depuis la base de données.', 'Fermer', { duration: 3200 });
      return;
    }
    if (this.dossierSaving()) return;
    this.dossierSaving.set(true);
    this.centralApi.enregistrerTuteurEtablissement(tuteur.backendId, {
      type_etablissement: this.codeTypeEtablissementApi(),
      campus_id: this.selectedCampusId(),
      prenom: form.firstName.trim(),
      nom: form.lastName.trim(),
      profession: form.profession.trim() || null,
      telephone: form.phone.trim(),
      telephone_secondaire: form.secondaryPhone.trim() || null,
      email: form.email.trim() || null,
      adresse: form.address.trim() || null,
    }).subscribe({
      next: (resultat) => {
        this.dossierSaving.set(false);
        this.appliquerDossiersApi(resultat, this.selectedCampusId());
        const actualise = this.guardians().find((item) => item.backendId === tuteur.backendId);
        if (actualise) {
          this.selectedGuardianId.set(actualise.id);
          this.loadGuardianForm(actualise);
        }
        this.snackBar.open(resultat.message, 'Fermer', { duration: 2800 });
      },
      error: (response) => {
        this.dossierSaving.set(false);
        this.snackBar.open(response.error?.message ?? 'La mise à jour du tuteur a échoué.', 'Fermer', { duration: 3800 });
      },
    });
  }

  setGuardianAccountStatus(status: PortalAccountStatus): void {
    const guardianId = this.selectedGuardianId();
    this.guardians.update((items) => items.map((guardian) => guardian.id === guardianId ? { ...guardian, accountStatus: status } : guardian));
    this.snackBar.open(status === 'Invitation envoyée' ? 'Invitation envoyée au tuteur.' : status === 'Actif' ? 'Le compte tuteur a été activé.' : 'Le compte tuteur a été désactivé.', 'Fermer', { duration: 2800 });
  }

  resetGuardianPassword(): void {
    this.snackBar.open('Le lien de réinitialisation a été envoyé au tuteur.', 'Fermer', { duration: 2800 });
  }

  saveStudent(): void {
    const form = this.studentForm;
    const eleveExistant = form.id === null ? undefined : this.students().find((item) => item.id === form.id);
    const tuteurExistant = form.guardianMode === 'existing'
      ? this.guardians().find((item) => item.id === Number(form.guardianId))
      : undefined;
    if (form.guardianMode === 'existing' && !tuteurExistant?.backendId) {
      this.snackBar.open('Sélectionnez un tuteur existant.', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.dossierSaving()) return;
    this.dossierSaving.set(true);
    const conserverDetail = this.activeView() === 'student-detail';
    const donneesEleve: Record<string, unknown> = {
      type_etablissement: this.codeTypeEtablissementApi(),
      campus_id: this.selectedCampusId(),
      id: eleveExistant?.backendId ?? null,
      matricule: form.matricule.trim() || null,
      prenom: form.firstName.trim(),
      nom: form.lastName.trim(),
      sexe: form.gender,
      date_naissance: form.birthDate || null,
      lieu_naissance: form.birthPlace.trim() || null,
      nationalite: form.nationality.trim() || null,
      adresse: form.address.trim() || null,
      groupe_sanguin: form.bloodGroup || null,
      notes_medicales: form.medicalNotes.trim() || null,
      regime: form.regime || null,
      transport: form.transport,
      cantine: form.canteen,
      documents_conserves: [...form.attachments],
      tuteur: {
        mode: form.guardianMode === 'existing' ? 'existant' : 'nouveau',
        id: tuteurExistant?.backendId ?? null,
        prenom: form.parentFirstName.trim(),
        nom: form.parentLastName.trim(),
        lien_parente: form.parentRelationship || null,
        profession: form.parentProfession.trim() || null,
        telephone: form.parentPhone.trim(),
        telephone_secondaire: form.secondaryPhone.trim() || null,
        email: form.email.trim() || null,
        adresse: form.address.trim() || null,
      },
    };
    this.centralApi.enregistrerEleveEtablissement(
      this.avecPiecesJointes(donneesEleve, this.studentAttachmentFiles),
    ).subscribe({
      next: (resultat) => {
        this.dossierSaving.set(false);
        this.appliquerDossiersApi(resultat, this.selectedCampusId());
        const eleve = this.students().find((item) => item.backendId === resultat.eleve_id);
        if (conserverDetail && eleve) {
          this.selectedStudentId.set(eleve.id);
          this.loadStudentForm(eleve);
          this.studentRecordTab.set('identity');
          this.activeView.set('student-detail');
        } else {
          this.activeView.set('students');
        }
        this.snackBar.open(resultat.message, 'Fermer', { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' });
      },
      error: (response) => {
        this.dossierSaving.set(false);
        this.snackBar.open(response.error?.message ?? 'L’enregistrement du dossier élève a échoué.', 'Fermer', { duration: 4000 });
      },
    });
  }

  saveStudentRecord(): void {
    this.saveStudent();
  }

  onStudentFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const names = files.map((file) => file.name);
    this.studentAttachmentFiles = [
      ...this.studentAttachmentFiles.filter((file) => !names.includes(file.name)),
      ...files,
    ];
    this.studentForm.attachments = [
      ...new Set([...this.studentForm.attachments, ...names]),
    ];
    input.value = '';
  }

  removeStudentAttachment(name: string): void {
    this.studentAttachmentFiles = this.studentAttachmentFiles.filter((file) => file.name !== name);
    this.studentForm.attachments = this.studentForm.attachments.filter(
      (attachment) => attachment !== name,
    );
  }

  startClassCreation(): void {
    this.classForm = this.createEmptyClassForm();
    this.classCurriculumOpen.set(false);
    this.classEditorOpen.set(true);
  }

  editClass(classroom: PrimaryClass): void {
    this.classForm = {
      id: classroom.id,
      level: classroom.level,
      name: classroom.name,
      registrationFee: classroom.registrationFee,
      monthlyFee: classroom.monthlyFee,
      seriesId: classroom.seriesId ?? '',
    };
    this.classCurriculumOpen.set(false);
    this.classEditorOpen.set(true);
  }

  closeClassEditor(): void {
    this.classEditorOpen.set(false);
  }

  saveClass(): void {
    const form = this.classForm;
    if (this.isHighSchool() && !form.seriesId) {
      this.snackBar.open('Sélectionnez la série de la classe.', 'Fermer', { duration: 2800 });
      return;
    }
    const payload: ClasseEtablissementPayload = {
      id: form.id,
      niveau: form.level.trim(),
      nom: form.name.trim(),
      frais_inscription: Number(form.registrationFee),
      mensualite: Number(form.monthlyFee),
      serie: this.isHighSchool() ? form.seriesId : null,
    };
    this.sauvegarderClassesBackend([payload], form.id ? 'La classe a été mise à jour.' : 'La classe a été créée.', () => {
      this.classEditorOpen.set(false);
    });
  }

  availableClassLevels(): string[] {
    return this.schoolLevelSettings.map((level) => level.code);
  }

  /**
   * Prépare les classes habituelles d'un cycle, à partir des niveaux définis
   * dans les paramètres. Les valeurs déjà présentes dans le registre du
   * campus sont reprises et restent modifiables avant l'enregistrement.
   */
  preparerPropositionsClasses(force = false): void {
    const campusId = this.selectedCampusId();
    if (!force && this.classProposalsCampusId() === campusId) {
      return;
    }

    const classesDuCampus = this.classes().filter((item) => item.campusId === campusId);
    this.classProposals.set(
      this.definitionsClassesParDefaut().map((definition, index) => {
        const existante = classesDuCampus.find((classe) =>
          classe.level === definition.level
          && (!this.isHighSchool() || classe.seriesId === definition.seriesId),
        );

        return {
          key: 'proposition-' + campusId + '-' + definition.level + '-' + (definition.seriesId || 'general') + '-' + index,
          classId: existante?.id ?? null,
          enabled: true,
          level: definition.level,
          name: existante?.name ?? definition.name,
          registrationFee: existante?.registrationFee ?? definition.registrationFee,
          monthlyFee: existante?.monthlyFee ?? definition.monthlyFee,
          seriesId: existante?.seriesId ?? definition.seriesId,
        };
      }),
    );
    this.classProposalsCampusId.set(campusId);
    this.classProposalsSaved.set(false);
  }

  updateClassProposal(
    key: string,
    field: 'enabled' | 'level' | 'name' | 'registrationFee' | 'monthlyFee' | 'seriesId',
    value: string | boolean,
  ): void {
    this.classProposals.update((proposals) =>
      proposals.map((proposal) =>
        proposal.key === key ? { ...proposal, [field]: value } : proposal,
      ),
    );
    this.classProposalsSaved.set(false);
  }

  enregistrerPropositionsClasses(): void {
    const propositions = this.classProposals().filter((proposal) => proposal.enabled);
    if (!propositions.length) {
      this.snackBar.open('Sélectionnez au moins une classe à enregistrer.', 'Fermer', { duration: 2800 });
      return;
    }

    const invalide = propositions.some((proposal) =>
      !proposal.level.trim()
      || !proposal.name.trim()
      || Number(proposal.registrationFee) < 0
      || Number(proposal.monthlyFee) < 0
      || !Number.isFinite(Number(proposal.registrationFee))
      || !Number.isFinite(Number(proposal.monthlyFee))
      || (this.isHighSchool() && !proposal.seriesId),
    );
    if (invalide) {
      this.snackBar.open(
        this.isHighSchool()
          ? 'Vérifiez le niveau, la série, le nom et les tarifs proposés.'
          : 'Vérifiez le niveau, le nom et les tarifs proposés.',
        'Fermer',
        { duration: 3200 },
      );
      return;
    }

    const cles = new Set<string>();
    const doublon = propositions.some((proposal) => {
      const cle = proposal.level.trim().toLowerCase() + '::' + proposal.name.trim().toLowerCase() + '::' + proposal.seriesId;
      if (cles.has(cle)) {
        return true;
      }
      cles.add(cle);
      return false;
    });
    if (doublon) {
      this.snackBar.open('Chaque classe proposée doit avoir un nom distinct.', 'Fermer', { duration: 2800 });
      return;
    }

    const payload = propositions.map((proposal): ClasseEtablissementPayload => ({
      id: proposal.classId,
      niveau: proposal.level.trim(),
      nom: proposal.name.trim(),
      frais_inscription: Number(proposal.registrationFee),
      mensualite: Number(proposal.monthlyFee),
      serie: this.isHighSchool() ? proposal.seriesId : null,
    }));
    this.sauvegarderClassesBackend(
      payload,
      String(payload.length) + ' classe(s) enregistrée(s) dans la base de données.',
      () => this.classProposalsSaved.set(true),
    );
  }

  private sauvegarderClassesBackend(
    classes: ClasseEtablissementPayload[],
    message: string,
    apresSucces?: () => void,
  ): void {
    const anneeId = this.selectedCentralAcademicYearId();
    if (!anneeId) {
      this.snackBar.open('Configurez d’abord l’année scolaire dans Paramètres.', 'Fermer', { duration: 3200 });
      return;
    }
    this.classesSaving.set(true);
    this.centralApi.enregistrerClassesEtablissement(
      this.codeTypeEtablissementApi(),
      this.selectedCampusId(),
      anneeId,
      classes,
    ).subscribe({
      next: ({ data }) => {
        this.appliquerClassesBackend(data);
        this.classesSaving.set(false);
        apresSucces?.();
        this.snackBar.open(message, 'Fermer', {
          duration: 3200,
          verticalPosition: 'bottom',
          horizontalPosition: 'center',
        });
      },
      error: (response) => {
        this.classesSaving.set(false);
        this.snackBar.open(
          response.error?.message ?? 'Les classes n’ont pas pu être enregistrées dans la base de données.',
          'Fermer',
          { duration: 4200 },
        );
      },
    });
  }

  private chargerClasses(afficherErreur = false): void {
    const anneeId = this.selectedCentralAcademicYearId();
    const campusId = this.selectedCampusId();
    if (!anneeId || !campusId) return;

    this.classesLoading.set(true);
    this.centralApi.classesEtablissement(this.codeTypeEtablissementApi(), campusId, anneeId).subscribe({
      next: ({ data }) => {
        this.appliquerClassesBackend(data);
        this.classesLoading.set(false);
        if (!data.length) this.preparerPropositionsClasses(true);
      },
      error: (response) => {
        this.classesLoading.set(false);
        if (afficherErreur) {
          this.snackBar.open(
            response.error?.message ?? 'Impossible de réactualiser les classes.',
            'Fermer',
            { duration: 3500 },
          );
        }
      },
    });
  }

  private chargerSalles(campusId: string): void {
    this.roomsLoading.set(true);
    this.centralApi.sallesInstitut(campusId).subscribe({
      next: ({ data }) => {
        const autresCampus = this.rooms().filter((room) => room.campusId !== campusId);
        const sallesCampus = data
          .filter((salle) => salle.statut === 'disponible')
          .map((salle): SchoolRoom => ({
            id: salle.id,
            campusId: salle.campus_id,
            name: salle.nom,
          }));
        this.rooms.set([...autresCampus, ...sallesCampus]);
        if (!sallesCampus.some((room) => room.id === this.selectedRoomId())) {
          this.selectedRoomId.set(sallesCampus[0]?.id ?? '');
        }
        this.roomsLoading.set(false);
      },
      error: () => this.roomsLoading.set(false),
    });
  }

  private chargerEmploiTemps(force = false): void {
    const context = this.pedagogyContext();
    const classeId = this.selectedClassId();
    if (!context || !classeId) return;
    const key = `${context['type_etablissement']}:${context['campus_id']}:${context['annee_scolaire_centrale_id']}:${classeId}`;
    if (!force && this.emploiTempsRequestKey === key) return;
    this.emploiTempsRequestKey = key;
    this.timetableLoading.set(true);
    this.centralApi.emploiTempsEtablissement(
      context['type_etablissement'],
      context['campus_id'],
      context['annee_scolaire_centrale_id'],
      classeId,
    ).subscribe({
      next: ({ data }) => {
        if (this.emploiTempsRequestKey !== key) return;
        this.timetableLoading.set(false);
        this.appliquerEmploiTempsBackend(data);
      },
      error: (response) => {
        if (this.emploiTempsRequestKey !== key) return;
        this.emploiTempsRequestKey = '';
        this.timetableLoading.set(false);
        this.snackBar.error(response.error?.message ?? 'L’emploi du temps n’a pas pu être chargé.');
      },
    });
  }

  chargerSeances(force = false): void {
    const context = this.pedagogyContext();
    const classeId = this.selectedClassId();
    if (!context || !classeId) return;
    const key = `${context['type_etablissement']}:${context['campus_id']}:${context['annee_scolaire_centrale_id']}:${classeId}`;
    if (!force && this.seancesRequestKey === key) return;
    this.seancesRequestKey = key;
    this.sessionsLoading.set(true);
    this.centralApi.seancesEtablissement(
      context['type_etablissement'],
      context['campus_id'],
      context['annee_scolaire_centrale_id'],
      classeId,
    ).subscribe({
      next: ({ data }) => {
        if (this.seancesRequestKey !== key) return;
        this.sessionsLoading.set(false);
        this.appliquerSeancesBackend(data);
      },
      error: (response) => {
        if (this.seancesRequestKey !== key) return;
        this.seancesRequestKey = '';
        this.sessionsLoading.set(false);
        this.snackBar.error(response.error?.message ?? 'Les séances n’ont pas pu être chargées.');
      },
    });
  }

  private chargerEvaluations(force = false): void {
    const context = this.pedagogyContext();
    const classeId = this.selectedClassId();
    if (!context || !classeId) return;
    const key = `${context['type_etablissement']}:${context['campus_id']}:${context['annee_scolaire_centrale_id']}:${classeId}`;
    if (!force && this.evaluationsRequestKey === key) return;
    this.evaluationsRequestKey = key;
    this.assessmentsLoading.set(true);
    this.centralApi.evaluationsEtablissement(context['type_etablissement'], context['campus_id'], context['annee_scolaire_centrale_id'], classeId).subscribe({
      next: ({ data }) => {
        if (this.evaluationsRequestKey !== key) return;
        this.assessmentsLoading.set(false);
        this.appliquerEvaluationsBackend(data);
      },
      error: (response) => {
        if (this.evaluationsRequestKey !== key) return;
        this.evaluationsRequestKey = '';
        this.assessmentsLoading.set(false);
        this.snackBar.error(response.error?.message ?? 'Les évaluations n’ont pas pu être chargées.');
      },
    });
  }

  private appliquerEvaluationsBackend(evaluations: EvaluationEtablissementApi[]): void {
    const types: Record<string, AssessmentKind> = { devoir: 'Devoir', controle: 'Contrôle', essai: 'Essai', formative: 'Évaluation formative', composition: 'Composition' };
    const statuts: Record<string, PrimaryAssessment['status']> = { brouillon: 'Brouillon', a_corriger: 'À corriger', corrigee: 'Corrigée' };
    const primaryBooks: Record<string, Record<number, PrimaryEvaluationScores>> = {};
    const mapped = evaluations.map((evaluation): PrimaryAssessment => {
      const domainId = evaluation.domaine_evaluation ?? this.selectedEvaluationDomainId();
      const componentId = evaluation.composante_evaluation ?? this.selectedEvaluationDomain().components[0]?.id ?? '';
      const results = evaluation.resultats.map((result): AssessmentResult => {
        const studentId = this.students().find((student) => student.backendId === result.eleve_id)?.id ?? -1;
        const score = result.note === null ? null : Number(result.note);
        if (studentId > 0) {
          const key = `${evaluation.periode ?? this.selectedTrimester()}::${evaluation.classe_id}::${domainId}`;
          primaryBooks[key] = { ...(primaryBooks[key] ?? {}), [studentId]: { ...(primaryBooks[key]?.[studentId] ?? {}), [componentId]: score } };
        }
        return { studentId, participated: Boolean(result.a_participe), score, appreciation: result.appreciation ?? '', attachments: [] };
      }).filter((result) => result.studentId > 0);
      return {
        id: evaluation.id, title: evaluation.titre, type: types[evaluation.type] ?? 'Contrôle', trimester: evaluation.periode ?? this.selectedTrimester(),
        classId: evaluation.classe_id, subject: this.assessmentSubjectLabel(domainId, componentId), evaluationDomainId: domainId, componentId,
        date: evaluation.date_evaluation, scale: Number(evaluation.bareme), teacherId: this.teachers().find((teacher) => teacher.teachingBackendId === evaluation.enseignant_id)?.id ?? null,
        status: statuts[evaluation.statut] ?? 'Brouillon', results,
      };
    });
    this.assessments.set(mapped);
    this.primaryEvaluationGrades.update((state) => ({ ...state, ...primaryBooks }));
  }

  private assessmentSubjectLabel(domainId: string, componentId: string): string {
    const domain = this.primaryEvaluationDomains.find((item) => item.id === domainId);
    return domain?.components.find((item) => item.id === componentId)?.label ?? domain?.label ?? 'Évaluation primaire';
  }

  private appliquerSeancesBackend(seances: SeanceEtablissementApi[]): void {
    const statut: Record<SeanceEtablissementApi['statut'], SessionStatus> = {
      planifiee: 'Planifiée',
      a_completer: 'À compléter',
      terminee: 'Terminée',
    };
    this.sessions.set(seances.map((seance): SchoolSession => {
      const subject = seance.matiere_libelle ?? 'Matière non définie';
      return {
        id: seance.id,
        classId: seance.classe_id,
        roomId: seance.salle_id ?? '',
        date: seance.date_seance,
        startTime: String(seance.heure_debut).slice(0, 5),
        endTime: String(seance.heure_fin).slice(0, 5),
        subject,
        teacherId: this.teachers().find((teacher) => teacher.teachingBackendId === seance.enseignant_id)?.id ?? null,
        status: statut[seance.statut] ?? 'Planifiée',
        description: seance.cahier_texte ?? '',
        lessonTitle: seance.lecon_libelle ?? '',
        programUnit: this.programUnitForSubject(subject),
        programProgress: this.programProgressForSubject(subject),
      };
    }));
  }

  private appliquerEmploiTempsBackend(emploiTemps: EmploiTempsEtablissementApi): void {
    const jours: Record<number, TimetableDay> = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    const rows = emploiTemps.creneaux.map((creneau, index) => {
      const row = this.createTimetableRow(index + 1, creneau.heure_debut, creneau.heure_fin, []);
      creneau.cellules.forEach((cellule) => {
        const jour = jours[cellule.jour_semaine];
        if (!jour) return;
        const teacherId = this.teachers().find((teacher) => teacher.teachingBackendId === cellule.enseignant_id)?.id ?? null;
        row.cells[jour] = {
          subject: cellule.est_pause ? 'Pause' : cellule.matiere_libelle ?? '',
          teacherId,
          roomId: cellule.salle_id,
        };
      });
      return row;
    });
    this.timetableRows.set(rows);
    this.timetableDraftRows = this.cloneTimetableRows(rows);
    this.timetableTeacherAssignments = this.affectationsEnseignantsDepuisEmploiTemps(rows);
    if (emploiTemps.salle_id) this.selectedRoomId.set(emploiTemps.salle_id);
  }

  private appliquerClassesBackend(data: ClasseEtablissementApi[]): void {
    const campusId = this.selectedCampusId();
    const autresCampus = this.classes().filter((classe) => classe.campusId !== campusId);
    const classesCampus = data.map((classe): PrimaryClass => ({
      id: classe.id,
      campusId,
      level: classe.niveau,
      name: classe.nom,
      enrolled: classe.effectif,
      registrationFee: String(classe.frais_inscription),
      monthlyFee: String(classe.mensualite),
      seriesId: classe.serie,
    }));
    this.classes.set([...autresCampus, ...classesCampus]);
    this.classProposalsSaved.set(classesCampus.length > 0);
    if (classesCampus[0]) {
      this.selectedClassId.set(classesCampus[0].id);
      this.selectedClassSubjectIds.set([classesCampus[0].id]);
    } else {
      this.selectedClassSubjectIds.set([]);
    }
  }

  private definitionsClassesParDefaut(): Array<Omit<ClassProposal, 'key' | 'classId' | 'enabled'>> {
    const levels = this.availableClassLevels();

    if (this.isHighSchool()) {
      // Au lycée, une classe n'a de sens qu'avec une série explicitement
      // choisie. Il n'y a donc pas de proposition automatique : chaque
      // classe est créée depuis le formulaire après configuration des séries.
      return [];
    }

    return levels.map((level, index) => {
      const college = this.isCollege();
      const palier = college ? (index < 2 ? 0 : 1) : Math.floor(index / 2);
      return {
        level,
        name: level + ' A',
        registrationFee: String((college ? 35000 : 25000) + palier * (college ? 5000 : 2500)),
        monthlyFee: String((college ? 25000 : 18000) + palier * (college ? 3000 : 2000)),
        seriesId: '',
      };
    });
  }

  private identifiantClasseProposee(proposition: ClassProposal, suffixe: number): string {
    return (proposition.level + '-' + proposition.name + '-' + this.selectedCampusId() + '-' + suffixe)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
  }

  private initialiserDependancesClasse(classroom: PrimaryClass): void {
    if (!this.classFeeConfigurations().some((configuration) => configuration.classId === classroom.id)) {
      this.classFeeConfigurations.update((configurations) => [
        ...configurations,
        ...this.feeAcademicYears.map((academicYear) =>
          this.defaultFeeConfiguration(classroom, academicYear),
        ),
      ]);
    }
    if (!this.classSubjectAssignments()[classroom.id]) {
      this.classSubjectAssignments.update((assignments) => ({
        ...assignments,
        [classroom.id]: [],
      }));
    }
  }

  private synchroniserPropositionClasse(classroom: PrimaryClass): void {
    if (this.classProposalsCampusId() !== classroom.campusId) {
      return;
    }
    this.classProposals.update((propositions) => propositions.map((proposition) =>
      proposition.classId === classroom.id
        ? {
          ...proposition,
          level: classroom.level,
          name: classroom.name,
          registrationFee: classroom.registrationFee,
          monthlyFee: classroom.monthlyFee,
          seriesId: classroom.seriesId ?? '',
        }
        : proposition,
    ));
  }

  seriesName(seriesId: string | null | undefined): string {
    const series = this.highSchoolSeries().find((item) => item.id === seriesId);
    return series ? `${series.code} · ${series.label}` : 'Série non définie';
  }

  seriesCode(seriesId: string | null | undefined): string {
    return this.highSchoolSeries().find((item) => item.id === seriesId)?.code ?? '—';
  }

  seriesClassCount(seriesId: string): number {
    return this.classes().filter((classroom) => classroom.seriesId === seriesId).length;
  }

  activeSeriesCount(): number {
    return this.highSchoolSeries().filter((series) => series.active).length;
  }

  private chargerSeriesLycee(): void {
    this.seriesLoading.set(true);
    this.centralApi.seriesLyceeEtablissement().subscribe({
      next: ({ data }) => {
        this.highSchoolSeries.set(data.map((serie) => this.mapperSerieLyceeApi(serie)));
        this.seriesLoading.set(false);
        this.preparerPropositionsClasses(true);
      },
      error: (response) => {
        this.seriesLoading.set(false);
        this.snackBar.error(response.error?.message ?? 'Les séries du lycée n’ont pas pu être chargées.');
      },
    });
  }

  private mapperSerieLyceeApi(serie: SerieLyceeEtablissementApi): HighSchoolSeries {
    return {
      id: serie.id,
      code: serie.code,
      label: serie.libelle,
      description: serie.description ?? '',
      color: serie.couleur,
      active: serie.actif,
    };
  }

  startSeriesCreation(): void {
    this.seriesForm = this.createEmptySeriesForm();
    this.seriesEditorOpen.set(true);
  }

  editSeries(series: HighSchoolSeries): void {
    this.seriesForm = { ...series };
    this.seriesEditorOpen.set(true);
  }

  closeSeriesEditor(): void {
    this.seriesEditorOpen.set(false);
  }

  saveSeries(): void {
    const code = this.seriesForm.code.trim().toUpperCase();
    const label = this.seriesForm.label.trim();
    if (!code || !label) {
      this.snackBar.open('Renseignez le code et l’intitulé de la série.', 'Fermer', { duration: 2800 });
      return;
    }
    const duplicate = this.highSchoolSeries().some(
      (series) => series.code.toUpperCase() === code && series.id !== this.seriesForm.id,
    );
    if (duplicate) {
      this.snackBar.open('Ce code de série existe déjà.', 'Fermer', { duration: 2800 });
      return;
    }
    if (this.seriesSaving()) return;
    this.seriesSaving.set(true);
    this.centralApi.enregistrerSerieLyceeEtablissement({
      code,
      libelle: label,
      description: this.seriesForm.description.trim() || null,
      couleur: this.seriesForm.color || '#2f80ed',
      actif: this.seriesForm.active,
    }, this.seriesForm.id).subscribe({
      next: (resultat) => {
        const series = this.mapperSerieLyceeApi(resultat.data);
        this.highSchoolSeries.update((items) =>
          items.some((item) => item.id === series.id)
            ? items.map((item) => item.id === series.id ? series : item)
            : [...items, series].sort((premiere, seconde) => premiere.code.localeCompare(seconde.code)),
        );
        this.seriesSaving.set(false);
        this.seriesEditorOpen.set(false);
        this.preparerPropositionsClasses(true);
        this.snackBar.success(resultat.message);
      },
      error: (response) => {
        this.seriesSaving.set(false);
        this.snackBar.error(response.error?.message ?? 'La série n’a pas pu être enregistrée.');
      },
    });
  }

  removeSeries(series: HighSchoolSeries): void {
    const linkedClasses = this.seriesClassCount(series.id);
    if (linkedClasses) {
      this.snackBar.open(
        `Cette série est utilisée par ${linkedClasses} classe(s). Modifiez d’abord ces classes.`,
        'Fermer',
        { duration: 3200 },
      );
      return;
    }
    this.requestConfirmation({
      title: 'Supprimer cette série ?',
      message: `La série ${series.code} · ${series.label} sera définitivement supprimée.`,
      confirmLabel: 'Supprimer la série',
      icon: 'delete_outline',
    }, () => {
      this.seriesSaving.set(true);
      this.centralApi.supprimerSerieLyceeEtablissement(series.id).subscribe({
        next: (resultat) => {
          this.highSchoolSeries.update((items) => items.filter((item) => item.id !== series.id));
          this.seriesSaving.set(false);
          this.preparerPropositionsClasses(true);
          this.snackBar.success(resultat.message);
        },
        error: (response) => {
          this.seriesSaving.set(false);
          this.snackBar.error(response.error?.message ?? 'La série n’a pas pu être supprimée.');
        },
      });
    });
  }

  private chargerFinances(anneeLibelle: string, notifier = false): void {
    const anneeId = this.anneesScolairesDisponibles().find((annee) => annee.libelle === anneeLibelle)?.id;
    const campusId = this.selectedCampusId();
    if (!anneeId || !campusId) return;
    const cle = `${this.codeTypeEtablissementApi()}:${campusId}:${anneeId}`;
    this.financesRequestKey = cle;
    this.financesLoading.set(true);
    this.centralApi.financesEtablissement(this.codeTypeEtablissementApi(), campusId, anneeId).subscribe({
      next: (resultat) => {
        if (this.financesRequestKey !== cle) return;
        this.appliquerFinancesApi(resultat);
        this.financesLoading.set(false);
        if (notifier) this.snackBar.success('Les données financières ont été réactualisées.');
      },
      error: (response) => {
        if (this.financesRequestKey === cle) this.financesLoading.set(false);
        if (notifier) this.snackBar.error(response.error?.message ?? 'Impossible de charger les données financières.');
      },
    });
  }

  private appliquerFinancesApi(resultat: FinancesEtablissementApi): void {
    const annee = resultat.annee_scolaire.libelle;
    this.paymentMonths = resultat.periodes_mensuelles.map((periode) => this.paymentMonthLabel(periode.valeur) ?? periode.libelle);
    if (!this.expensePeriodOptions().some((periode) => periode.value === this.selectedExpensePeriod())) {
      this.selectedExpensePeriod.set(this.expensePeriodOptions()[0]?.value ?? this.selectedExpensePeriod());
    }
    const nouvellesConfigurations = resultat.tarifications.configurations.map((item): ClassFeeConfiguration => ({
      academicYear: annee,
      classId: item.classe_id,
      registrationFee: String(item.registrationFee ?? 0),
      monthlyFee: String(item.monthlyFee ?? 0),
    }));
    this.classFeeConfigurations.update((items) => [
      ...items.filter((item) => item.academicYear !== annee),
      ...nouvellesConfigurations,
    ]);
    this.additionalSchoolFees.update((items) => [
      ...items.filter((item) => item.academicYear !== annee),
      ...resultat.tarifications.frais_supplementaires.map((item): AdditionalSchoolFee => ({
        id: item.id,
        academicYear: annee,
        classId: item.classe_id,
        label: item.libelle,
        amount: String(item.montant),
        frequency: item.frequence === 'mensuel' ? 'Mensuel' : 'Paiement unique',
        required: item.obligatoire,
      })),
    ]);

    this.financeTariffIds.clear();
    const monthly: MonthlyPaymentRecords = {};
    const unique: OneTimePaymentRecords = {};
    const studentsByBackendId = new Map(this.students().filter((student) => student.backendId).map((student) => [student.backendId as string, student]));
    resultat.echeances.forEach((echeance) => {
      const feeId = this.feeInterfaceId(echeance.code, echeance.tarif_scolaire_id);
      const ledgerKey = `${annee}::${echeance.classe_id}::${feeId}`;
      this.financeTariffIds.set(ledgerKey, echeance.tarif_scolaire_id);
      const student = studentsByBackendId.get(echeance.eleve_id);
      if (!student) return;
      if (echeance.frequence === 'mensuel' && echeance.periode) {
        const month = this.paymentMonthLabel(echeance.periode);
        if (!month) return;
        monthly[ledgerKey] ??= {};
        monthly[ledgerKey][student.id] ??= {};
        monthly[ledgerKey][student.id][month] = echeance.date_paiement;
      } else {
        unique[ledgerKey] ??= {};
        unique[ledgerKey][student.id] = echeance.date_paiement;
      }
    });
    this.monthlyPaymentRecords.set(monthly);
    this.oneTimePaymentRecords.set(unique);

    this.expenseTypes.set(resultat.types_depenses.map((item): ExpenseType => ({
      id: item.id,
      backendId: item.backend_id,
      label: item.libelle,
      frequency: item.frequence === 'mensuel' ? 'Mensuel' : 'Unique',
      target: item.cible === 'enseignants' ? 'Enseignants' : item.cible === 'tous' ? 'Personnel et enseignants' : 'Personnel',
      defaultAmount: Number(item.montant_provisoire ?? 0),
      active: item.actif,
    })));
    if (!this.expenseTypes().some((item) => item.id === this.selectedExpenseTypeId())) {
      this.selectedExpenseTypeId.set(this.expenseTypes()[0]?.id ?? '');
    }
    this.expenses.set(resultat.depenses.map((item): SchoolExpense => ({
      id: item.id,
      typeId: item.type_id,
      personnelId: item.personnel_id,
      label: item.libelle,
      category: '',
      frequency: item.frequence === 'mensuel' ? 'Mensuel' : 'Unique',
      amount: Number(item.montant),
      date: item.date,
      paymentDate: item.date_paiement,
      status: item.statut,
      beneficiary: item.beneficiaire ?? '',
      staffIds: [],
      notes: item.notes ?? '',
    })));
    const salaryPayments: Record<string, string | null> = {};
    const salaryHours: Record<string, number> = {};
    resultat.paies.forEach((ligne) => {
      const month = this.paymentMonthLabel(ligne.periode);
      if (!month) return;
      const key = `${annee}::${ligne.personnel_id}::${month}`;
      salaryPayments[key] = ligne.date_paiement;
      salaryHours[key] = Number(ligne.nombre_heures ?? 0);
    });
    this.salaryPaymentRecords.set(salaryPayments);
    this.salaryHourRecords.set(salaryHours);
    this.financeEntries.set(resultat.operations.map((item): FinanceEntry => ({
      id: item.id,
      campusId: this.selectedCampusId(),
      amount: Number(item.montant),
      reason: item.motif,
      direction: item.sens === 'entree' ? 'Entrée' : 'Sortie',
      date: item.date,
      paymentMethod: this.paymentMethodLabel(item.mode_paiement),
      thirdParty: item.tiers ?? '',
      reference: item.reference ?? '—',
      status: item.statut === 'validee' ? 'Validée' : item.statut === 'annulee' ? 'Annulée' : 'En attente',
      source: item.source === 'saisie_manuelle' ? 'Saisie manuelle' : item.sens === 'entree' ? 'Encaissements' : 'Dépenses',
      notes: item.notes ?? '',
    })));
    this.ensureCollectionFeeSelection();
  }

  private feeInterfaceId(code: string, tarifId: string): string {
    return ({ inscription: 'registrationFee', mensualite: 'monthlyFee' } as Record<string, string>)[code]
      ?? `additional-${tarifId}`;
  }

  private paymentMonthLabel(period: string): string | null {
    const month = Number(period.slice(5, 7));
    return ({ 1: 'Jan', 2: 'Fév', 3: 'Mar', 4: 'Avr', 5: 'Mai', 6: 'Juin', 7: 'Juil', 8: 'Août', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Déc' } as Record<number, string>)[month] ?? null;
  }

  private paymentMethodLabel(mode: string | null): FinancePaymentMethod {
    return ({ wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement', cheque: 'Chèque' } as Record<string, FinancePaymentMethod>)[mode ?? ''] ?? 'Espèces';
  }

  private paymentMethodCode(mode: FinancePaymentMethod): string {
    return ({ Espèces: 'espece', Wave: 'wave', 'Orange Money': 'orange_money', Virement: 'virement', Chèque: 'cheque' } as Record<FinancePaymentMethod, string>)[mode];
  }

  private financeContext(anneeLibelle: string): Record<string, string> | null {
    const anneeId = this.anneesScolairesDisponibles().find((annee) => annee.libelle === anneeLibelle)?.id;
    if (!anneeId || !this.selectedCampusId()) return null;
    return { type_etablissement: this.codeTypeEtablissementApi(), campus_id: this.selectedCampusId(), annee_scolaire_centrale_id: anneeId };
  }

  actualiserFinances(): void {
    this.centralApi.invaliderCache('institut:finances:');
    const view = this.activeView();
    const annee = view === 'fees'
      ? this.selectedFeeAcademicYear()
      : view === 'payments'
        ? this.selectedCollectionAcademicYear()
        : view === 'expense-settings' || view === 'expenses'
          ? this.selectedExpenseAcademicYear()
          : this.selectedFinanceAcademicYear();
    this.chargerFinances(annee, true);
  }

  selectFeeAcademicYear(academicYear: string): void {
    this.selectedFeeAcademicYear.set(academicYear);
    this.feeEditorOpen.set(false);
  }

  selectFeeClass(classId: string): void {
    this.selectedFeeClassId.set(classId);
    this.feeEditorOpen.set(false);
  }

  isFeeYearLocked(academicYear: string = this.selectedFeeAcademicYear()): boolean {
    return this.academicYearStart(academicYear) < this.academicYearStart(this.currentFeeAcademicYear);
  }

  feeRows(): Array<{ classroom: PrimaryClass; configuration: ClassFeeConfiguration }> {
    const academicYear = this.selectedFeeAcademicYear();
    const selectedClassId = this.selectedFeeClassId();
    return this.campusClasses()
      .filter((classroom) => selectedClassId === 'all' || classroom.id === selectedClassId)
      .map((classroom) => ({
        classroom,
        configuration:
          this.classFeeConfigurations().find(
            (configuration) =>
              configuration.academicYear === academicYear &&
              configuration.classId === classroom.id,
          ) ?? this.defaultFeeConfiguration(classroom, academicYear),
      }));
  }

  updateClassFee(
    classId: string,
    field: keyof Pick<ClassFeeConfiguration, 'registrationFee' | 'monthlyFee'>,
    rawValue: string,
  ): void {
    if (this.isFeeYearLocked()) {
      return;
    }
    const academicYear = this.selectedFeeAcademicYear();
    const value = rawValue.replace(/[^0-9]/g, '');
    this.classFeeConfigurations.update((configurations) => {
      const exists = configurations.some(
        (configuration) =>
          configuration.academicYear === academicYear && configuration.classId === classId,
      );
      if (!exists) {
        const classroom = this.classes().find((item) => item.id === classId);
        return classroom
          ? [...configurations, { ...this.defaultFeeConfiguration(classroom, academicYear), [field]: value }]
          : configurations;
      }
      return configurations.map((configuration) =>
        configuration.academicYear === academicYear && configuration.classId === classId
          ? { ...configuration, [field]: value }
          : configuration,
      );
    });
  }

  saveFeeConfigurations(): void {
    if (this.isFeeYearLocked()) {
      this.snackBar.open('Cette année scolaire est archivée et ne peut plus être modifiée.', 'Fermer', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      return;
    }

    const context = this.financeContext(this.selectedFeeAcademicYear());
    if (!context) {
      this.snackBar.error('Configurez d’abord l’année scolaire dans Paramètres.');
      return;
    }
    const rows = this.feeRows();
    this.centralApi.enregistrerTarificationsEtablissement({
      ...context,
      classes: rows.map((row) => ({
        classe_id: row.classroom.id,
        frais_inscription: Number(row.configuration.registrationFee || 0),
        mensualite: Number(row.configuration.monthlyFee || 0),
      })),
    }).subscribe({
      next: (resultat) => {
        this.chargerFinances(this.selectedFeeAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Les tarifs n’ont pas pu être enregistrés.'),
    });
  }

  openAdditionalFeeEditor(): void {
    if (this.isFeeYearLocked()) {
      this.snackBar.open('Les paiements d’une année archivée sont en lecture seule.', 'Fermer', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      return;
    }
    const classId = this.additionalFeeClassId();
    this.additionalFeeForm = {
      classId,
      label: '',
      amount: '',
      frequency: 'Paiement unique',
      required: false,
    };
    this.feeEditorOpen.set(true);
  }

  closeAdditionalFeeEditor(): void {
    this.feeEditorOpen.set(false);
  }

  saveAdditionalFee(): void {
    if (this.isFeeYearLocked()) {
      return;
    }
    const form = this.additionalFeeForm;
    if (!form.classId || !form.label.trim() || !form.amount.trim()) {
      this.snackBar.open('Renseignez la classe, l’intitulé et le montant.', 'Fermer', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      return;
    }
    const context = this.financeContext(this.selectedFeeAcademicYear());
    if (!context) {
      this.snackBar.error('Configurez d’abord l’année scolaire dans Paramètres.');
      return;
    }
    this.centralApi.ajouterFraisEtablissement({
      ...context,
      classe_ids: form.classId === 'all'
        ? this.campusClasses().map((classroom) => classroom.id)
        : [form.classId],
      libelle: form.label.trim(),
      montant: Number(form.amount.replace(/[^0-9]/g, '')),
      frequence: form.frequency === 'Mensuel' ? 'mensuel' : 'unique',
      obligatoire: form.required,
    }).subscribe({
      next: (resultat) => {
        this.feeEditorOpen.set(false);
        this.chargerFinances(this.selectedFeeAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Le paiement complémentaire n’a pas pu être ajouté.'),
    });
  }

  visibleAdditionalFees(): AdditionalSchoolFee[] {
    const selectedClassId = this.additionalFeeClassId();
    return this.additionalSchoolFees().filter(
      (fee) =>
        fee.academicYear === this.selectedFeeAcademicYear() &&
        fee.classId === selectedClassId,
    );
  }

  selectAdditionalFeeClass(classId: string): void {
    this.selectedAdditionalFeeClassId.set(classId);
  }

  additionalFeeClassId(): string {
    const campusClasses = this.campusClasses();
    const selected = this.selectedAdditionalFeeClassId();
    if (campusClasses.some((classroom) => classroom.id === selected)) {
      return selected;
    }
    const current = this.selectedFeeClassId();
    return campusClasses.some((classroom) => classroom.id === current)
      ? current
      : campusClasses[0]?.id ?? '';
  }

  additionalFeeClassName(classId: string): string {
    return this.classes().find((classroom) => classroom.id === classId)?.name ?? 'Classe';
  }

  removeAdditionalFee(feeId: string | number): void {
    if (this.isFeeYearLocked()) {
      return;
    }
    const context = this.financeContext(this.selectedFeeAcademicYear());
    if (!context || typeof feeId !== 'string') return;
    const fee = this.additionalSchoolFees().find((item) => item.id === feeId);
    this.requestConfirmation({
      title: 'Supprimer ce frais scolaire ?',
      message: `Le frais « ${fee?.label ?? 'sélectionné'} » sera supprimé de la tarification de la classe.`,
      confirmLabel: 'Supprimer le frais',
      icon: 'delete_outline',
    }, () => {
      this.centralApi.supprimerFraisEtablissement(
        feeId,
        context['type_etablissement'],
        context['campus_id'],
        context['annee_scolaire_centrale_id'],
      ).subscribe({
        next: (resultat) => {
          this.chargerFinances(this.selectedFeeAcademicYear());
          this.snackBar.success(resultat.message);
        },
        error: (response) => this.snackBar.error(response.error?.message ?? 'Le paiement complémentaire n’a pas pu être supprimé.'),
      });
    });
  }

  formatFeeAmount(value: string): string {
    return `${Number(value || 0).toLocaleString('fr-FR')} F CFA`;
  }

  openClassCurriculum(classroom: PrimaryClass): void {
    this.activeView.set('curriculum');
    this.selectedClassId.set(classroom.id);
    this.classEditorOpen.set(false);
    this.classCurriculumOpen.set(true);
    this.curriculumChapterEditorOpen.set(false);
    this.ensureSelectedCurriculumSubject();
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }

  closeClassCurriculum(): void {
    this.activeView.set('classes');
    this.classCurriculumOpen.set(false);
    this.curriculumChapterEditorOpen.set(false);
  }

  changeCurriculumClass(classId: string): void {
    this.selectedClassId.set(classId);
    this.curriculumChapterEditorOpen.set(false);
    this.ensureSelectedCurriculumSubject();
  }

  isSubjectAssignedToClass(subjectId: SubjectId): boolean {
    return (this.classSubjectAssignments()[this.selectedClassId()] ?? []).includes(subjectId);
  }

  isSubjectAssignedToSelectedClasses(subjectId: SubjectId): boolean {
    const classes = this.selectedClassSubjectClasses();
    return classes.length > 0 && classes.every((classroom) =>
      (this.classSubjectAssignments()[classroom.id] ?? []).includes(subjectId),
    );
  }

  isSubjectPartiallyAssignedToSelectedClasses(subjectId: SubjectId): boolean {
    const classes = this.selectedClassSubjectClasses();
    const assignedCount = classes.filter((classroom) =>
      (this.classSubjectAssignments()[classroom.id] ?? []).includes(subjectId),
    ).length;
    return assignedCount > 0 && assignedCount < classes.length;
  }

  selectedSubjectAssignmentCount(subjectId: SubjectId): number {
    return this.selectedClassSubjectClasses().filter((classroom) =>
      (this.classSubjectAssignments()[classroom.id] ?? []).includes(subjectId),
    ).length;
  }

  selectedClassSubjectLabel(): string {
    const classes = this.selectedClassSubjectClasses();
    if (!classes.length) return 'aucune classe';
    if (classes.length === 1) return classes[0].name;
    return `${classes.length} classes sélectionnées`;
  }

  changeClassSubjectSelection(classIds: string[]): void {
    const availableIds = new Set(this.campusClasses().map((classroom) => classroom.id));
    const selectedIds = [...new Set(classIds)].filter((classId) => availableIds.has(classId));
    this.selectedClassSubjectIds.set(selectedIds);
    if (selectedIds[0]) {
      this.selectedClassId.set(selectedIds[0]);
    }
    this.ensureSelectedCurriculumSubject();
  }

  toggleSelectedClassesSubject(subjectId: SubjectId, assigned: boolean): void {
    const classIds = this.selectedClassSubjectClasses().map((classroom) => classroom.id);
    this.classSubjectAssignments.update((assignments) => {
      const next = { ...assignments };
      classIds.forEach((classId) => {
        const current = next[classId] ?? [];
        next[classId] = assigned
          ? [...new Set([...current, subjectId])]
          : current.filter((id) => id !== subjectId);
      });
      return next;
    });
    this.ensureSelectedCurriculumSubject();
  }

  toggleClassSubject(subjectId: SubjectId, assigned: boolean): void {
    const classId = this.selectedClassId();
    this.classSubjectAssignments.update((assignments) => {
      const current = assignments[classId] ?? [];
      const next = assigned
        ? [...new Set([...current, subjectId])]
        : current.filter((id) => id !== subjectId);
      return { ...assignments, [classId]: next };
    });
    this.ensureSelectedCurriculumSubject();
  }

  collegeSubjectSetting(classId: string, subjectId: SubjectId): { coefficient: number | null; teacherId: number | null; maxScore: number } {
    return this.collegeSubjectSettings()[`${classId}::${subjectId}`] ?? {
      coefficient: this.isCollege() ? 1 : null,
      teacherId: null,
      maxScore: 20,
    };
  }

  selectCollegeGradeClass(classId: string): void {
    this.selectClass(classId);
    const firstSubject = this.assignedCurriculumSubjects()[0];
    if (firstSubject && !this.assignedCurriculumSubjects().some((subject) => subject.name === this.selectedSubject())) {
      this.selectedSubject.set(firstSubject.name);
    }
    this.selectedReportStudentId.set(this.visibleStudents()[0]?.id ?? 1);
  }

  selectedCollegeSubject(): PrimarySubject | null {
    return this.assignedCurriculumSubjects().find((subject) => subject.name === this.selectedSubject()) ?? null;
  }

  selectedCollegeSubjectCoefficient(): number {
    const subject = this.selectedCollegeSubject();
    return subject
      ? this.collegeSubjectSetting(this.selectedClassId(), subject.id).coefficient ?? 1
      : 1;
  }

  selectedCollegeSubjectTeacher(): string {
    const subject = this.selectedCollegeSubject();
    return subject
      ? this.teacherName(this.collegeSubjectSetting(this.selectedClassId(), subject.id).teacherId)
      : 'Non affecté';
  }

  updateCollegeSubjectCoefficient(subjectId: SubjectId, value: string | number): void {
    const classId = this.selectedClassId();
    const key = `${classId}::${subjectId}`;
    const coefficient = value === '' || value === null
      ? null
      : Math.max(0.01, Math.min(100, Number(value) || 1));
    this.collegeSubjectSettings.update((settings) => ({
      ...settings,
      [key]: { ...this.collegeSubjectSetting(classId, subjectId), coefficient },
    }));
  }

  updateCollegeSubjectTeacher(subjectId: SubjectId, value: string | number): void {
    const classId = this.selectedClassId();
    const key = `${classId}::${subjectId}`;
    this.collegeSubjectSettings.update((settings) => ({
      ...settings,
      [key]: {
        ...this.collegeSubjectSetting(classId, subjectId),
        teacherId: value === '' ? null : Number(value),
      },
    }));
  }

  selectCurriculumSubject(subjectId: SubjectId): void {
    this.selectedCurriculumSubjectId.set(subjectId);
    this.curriculumChapterEditorOpen.set(false);
  }

  classSubjectCount(classId: string): number {
    return this.classSubjectAssignments()[classId]?.length ?? 0;
  }

  subjectAssignedClassCount(subjectId: SubjectId): number {
    return this.campusClasses().filter((classroom) =>
      (this.classSubjectAssignments()[classroom.id] ?? []).includes(subjectId),
    ).length;
  }

  classProgramProgress(classId: string): number {
    const lessons = this.curriculumChapters()
      .filter((chapter) => chapter.classId === classId)
      .flatMap((chapter) => chapter.lessons);
    if (!lessons.length) {
      return 0;
    }
    return Math.round(
      lessons.reduce((total, lesson) => total + lesson.progress, 0) / lessons.length,
    );
  }

  subjectProgramProgress(classId: string, subjectId: SubjectId): number {
    const lessons = this.curriculumChapters()
      .filter((chapter) => chapter.classId === classId && chapter.subjectId === subjectId)
      .flatMap((chapter) => chapter.lessons);
    return lessons.length
      ? Math.round(lessons.reduce((total, lesson) => total + lesson.progress, 0) / lessons.length)
      : 0;
  }

  startCurriculumChapterCreation(): void {
    this.curriculumChapterForm = this.createEmptyCurriculumChapterForm();
    this.curriculumChapterEditorOpen.set(true);
  }

  closeCurriculumChapterEditor(): void {
    this.curriculumChapterEditorOpen.set(false);
  }

  saveCurriculumChapter(): void {
    const subjectId = this.selectedCurriculumSubjectId();
    const context = this.pedagogyContext();
    const classroom = this.selectedClass();
    if (subjectId === null || !context || !classroom) {
      this.snackBar.error('Sélectionnez une classe et une matière avant d’ajouter la leçon.');
      return;
    }
    const lessonTitle = this.curriculumChapterForm.title.trim();
    if (!lessonTitle) {
      this.snackBar.open('Saisissez le titre de la leçon.', 'Fermer', {
        duration: 2800,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      return;
    }
    if (this.curriculumSaving()) return;
    this.curriculumSaving.set(true);
    this.centralApi.ajouterLeconEtablissement(String(classroom.id), String(subjectId), {
      ...context,
      libelle: lessonTitle,
      objectifs: this.curriculumChapterForm.objective.trim() || null,
      periode: this.curriculumChapterForm.period || null,
      nombre_seances_estime: Number(this.curriculumChapterForm.estimatedSessions) || 1,
    }).subscribe({
      next: (resultat) => {
        this.curriculumSaving.set(false);
        this.curriculumChapterEditorOpen.set(false);
        this.applyPedagogyData(resultat);
        this.snackBar.success(resultat.message ?? 'La leçon a été ajoutée au programme annuel.');
      },
      error: (response) => {
        this.curriculumSaving.set(false);
        this.snackBar.error(response.error?.message ?? 'La leçon n’a pas pu être enregistrée.');
      },
    });
  }

  deleteCurriculumChapter(chapterId: string): void {
    const chapter = this.curriculumChapters().find((item) => item.id === chapterId);
    const lesson = chapter?.lessons[0];
    if (lesson) this.deleteCurriculumLesson(chapterId, lesson.id);
  }

  deleteCurriculumLesson(chapterId: string, lessonId: string): void {
    const lesson = this.curriculumChapters().find((item) => item.id === chapterId)?.lessons.find((item) => item.id === lessonId);
    this.requestConfirmation({
      title: 'Supprimer cette leçon ?',
      message: `La leçon « ${lesson?.title ?? 'sélectionnée'} » sera définitivement retirée du programme.`,
      confirmLabel: 'Supprimer la leçon',
      icon: 'delete_outline',
    }, () => {
      const context = this.pedagogyContext();
      if (!context || this.isCurriculumLessonSaving(lessonId)) return;
      this.setCurriculumLessonSaving(lessonId, true);
      this.centralApi.supprimerLeconEtablissement(
        lessonId,
        context['type_etablissement'],
        context['campus_id'],
        context['annee_scolaire_centrale_id'],
      ).subscribe({
        next: (resultat) => {
          this.setCurriculumLessonSaving(lessonId, false);
          this.applyPedagogyData(resultat);
          this.snackBar.success(resultat.message ?? 'La leçon a été supprimée du programme annuel.');
        },
        error: (response) => {
          this.setCurriculumLessonSaving(lessonId, false);
          this.snackBar.error(response.error?.message ?? 'La leçon n’a pas pu être supprimée.');
        },
      });
    });
  }

  updateCurriculumLessonStatus(
    _chapterId: string,
    lessonId: string,
    status: CurriculumLessonStatus,
  ): void {
    const context = this.pedagogyContext();
    if (!context || this.isCurriculumLessonSaving(lessonId)) return;
    const statutsApi: Record<CurriculumLessonStatus, 'a_faire' | 'en_cours' | 'terminee'> = {
      'À faire': 'a_faire',
      'En cours': 'en_cours',
      'Terminée': 'terminee',
    };
    this.setCurriculumLessonSaving(lessonId, true);
    this.centralApi.enregistrerAvancementLeconEtablissement(lessonId, {
      ...context,
      statut: statutsApi[status],
    }).subscribe({
      next: (resultat) => {
        this.setCurriculumLessonSaving(lessonId, false);
        this.applyPedagogyData(resultat);
        this.snackBar.success(resultat.message ?? 'L’avancement de la leçon a été enregistré.');
      },
      error: (response) => {
        this.setCurriculumLessonSaving(lessonId, false);
        this.snackBar.error(response.error?.message ?? 'L’avancement de la leçon n’a pas pu être enregistré.');
      },
    });
  }

  isCurriculumLessonSaving(lessonId: string): boolean {
    return this.curriculumLessonSavingIds().includes(lessonId);
  }

  private setCurriculumLessonSaving(lessonId: string, saving: boolean): void {
    this.curriculumLessonSavingIds.update((ids) => saving
      ? [...new Set([...ids, lessonId])]
      : ids.filter((id) => id !== lessonId));
  }

  curriculumChapterProgress(chapter: CurriculumChapter): number {
    return chapter.lessons.length
      ? Math.round(chapter.lessons.reduce((total, lesson) => total + lesson.progress, 0) / chapter.lessons.length)
      : 0;
  }

  curriculumChapterStatus(chapter: CurriculumChapter): CurriculumLessonStatus {
    if (chapter.lessons.length && chapter.lessons.every((lesson) => lesson.status === 'Terminée')) {
      return 'Terminée';
    }
    return chapter.lessons.some((lesson) => lesson.status !== 'À faire') ? 'En cours' : 'À faire';
  }

  curriculumStatusClass(status: CurriculumLessonStatus): string {
    return status === 'Terminée' ? 'completed' : status === 'En cours' ? 'current' : 'planned';
  }

  curriculumLessonsForSession(session: SchoolSession): CurriculumLesson[] {
    const subjectId = this.subjects().find((subject) => subject.name === session.subject)?.id;
    if (subjectId === undefined) {
      return [];
    }
    return this.curriculumChapters()
      .filter((chapter) => chapter.classId === session.classId && chapter.subjectId === subjectId)
      .sort((first, second) => first.order - second.order)
      .flatMap((chapter) => chapter.lessons);
  }

  sessionCurriculumStats(session: SchoolSession): {
    unit: string;
    planned: number;
    completed: number;
    remaining: number;
    progress: number;
  } {
    const subjectId = this.subjects().find((subject) => subject.name === session.subject)?.id;
    const chapters = subjectId === undefined
      ? []
      : this.curriculumChapters().filter((chapter) =>
          chapter.classId === session.classId && chapter.subjectId === subjectId,
        );
    const lessons = chapters.flatMap((chapter) => chapter.lessons);
    const completed = lessons.filter((lesson) => lesson.status === 'Terminée').length;
    return {
      unit: this.sessionLessonDraft || session.programUnit || 'Programme annuel',
      planned: lessons.length || 16,
      completed: lessons.length ? completed : 11,
      remaining: lessons.length ? lessons.length - completed : 5,
      progress: lessons.length
        ? Math.round(lessons.reduce((total, lesson) => total + lesson.progress, 0) / lessons.length)
        : session.programProgress,
    };
  }

  toggleSubjectProposal(code: string, selected: boolean): void {
    this.selectedSubjectProposalCodes.update((codes) => selected
      ? [...new Set([...codes, code])]
      : codes.filter((item) => item !== code));
  }

  isSubjectProposalSelected(code: string): boolean {
    return this.selectedSubjectProposalCodes().includes(code);
  }

  savePredefinedSubjects(): void {
    const context = this.pedagogyContext();
    const selected = this.predefinedSubjects().filter((subject) => this.isSubjectProposalSelected(subject.code));
    if (!context) {
      this.snackBar.error('Configurez l’année scolaire et sélectionnez un campus avant d’enregistrer les matières.');
      return;
    }
    if (!selected.length) {
      this.snackBar.error('Cochez au moins une matière à enregistrer.');
      return;
    }
    this.subjectsSaving.set(true);
    this.centralApi.enregistrerCatalogueMatieresEtablissement({
      ...context,
      matieres: selected.map((subject) => ({
        code: subject.code,
        libelle: subject.name,
        domaine: subject.domain || null,
      })),
    }).subscribe({
      next: (resultat) => {
        this.subjectsSaving.set(false);
        this.applyPedagogyData(resultat);
        this.snackBar.success(resultat.message ?? 'Les matières ont été enregistrées.');
      },
      error: (response) => {
        this.subjectsSaving.set(false);
        this.snackBar.error(response.error?.message ?? 'Les matières n’ont pas pu être enregistrées.');
      },
    });
  }

  refreshPedagogy(): void {
    this.centralApi.invaliderCache('institut:pedagogie:');
    this.chargerPedagogie(true);
  }

  openClassSubjects(classId?: string): void {
    if (classId) {
      this.selectedClassId.set(classId);
      this.selectedClassSubjectIds.set([classId]);
    } else {
      this.ensureClassSubjectSelection();
    }
    this.setView('class-subjects');
    this.ensureSelectedCurriculumSubject();
  }

  updateClassSubjectMaxScore(subjectId: SubjectId, value: string | number): void {
    const maxScore = Math.max(1, Math.min(1000, Number(value) || 20));
    this.collegeSubjectSettings.update((settings) => ({
      ...settings,
      ...Object.fromEntries(this.selectedClassSubjectClasses()
        .filter((classroom) => (this.classSubjectAssignments()[classroom.id] ?? []).includes(subjectId))
        .map((classroom) => [
          `${classroom.id}::${subjectId}`,
          { ...this.collegeSubjectSetting(classroom.id, subjectId), maxScore },
        ])),
    }));
  }

  updateSelectedClassesSubjectCoefficient(subjectId: SubjectId, value: string | number): void {
    const coefficient = value === '' || value === null
      ? null
      : Math.max(0.01, Math.min(100, Number(value) || 1));
    this.collegeSubjectSettings.update((settings) => ({
      ...settings,
      ...Object.fromEntries(this.selectedClassSubjectClasses()
        .filter((classroom) => (this.classSubjectAssignments()[classroom.id] ?? []).includes(subjectId))
        .map((classroom) => [
          `${classroom.id}::${subjectId}`,
          { ...this.collegeSubjectSetting(classroom.id, subjectId), coefficient },
        ])),
    }));
  }

  selectedClassesSubjectSetting(subjectId: SubjectId): { coefficient: number | null; teacherId: number | null; maxScore: number } {
    const classroom = this.selectedClassSubjectClasses().find((item) =>
      (this.classSubjectAssignments()[item.id] ?? []).includes(subjectId),
    );
    return classroom
      ? this.collegeSubjectSetting(classroom.id, subjectId)
      : { coefficient: this.isCollege() ? 1 : null, teacherId: null, maxScore: 20 };
  }

  saveClassSubjectAssignments(): void {
    const context = this.pedagogyContext();
    const classrooms = this.selectedClassSubjectClasses();
    if (!context || !classrooms.length) {
      this.snackBar.error('Sélectionnez au moins une classe avant d’enregistrer ses matières.');
      return;
    }
    const payloads = classrooms.map((classroom) => ({
      classroom,
      matieres: (this.classSubjectAssignments()[classroom.id] ?? []).map((subjectId) => {
        const configuration = this.collegeSubjectSetting(classroom.id, subjectId);
        return {
          matiere_id: String(subjectId),
          coefficient: configuration.coefficient,
          note_maximale: configuration.maxScore,
        };
      }),
    }));
    if (this.isCollege() && payloads.some((payload) =>
      payload.matieres.some((setting) => setting.coefficient === null),
    )) {
      this.snackBar.error('Renseignez le coefficient de chaque matière avant l’enregistrement.');
      return;
    }
    this.classSubjectsSaving.set(true);
    // Les classes partagent les mêmes lignes de matières et leurs index MySQL.
    // Une écriture séquentielle évite que plusieurs transactions concurrentes
    // prennent ces verrous dans un ordre différent et provoquent un deadlock.
    concat(...payloads.map((payload) =>
      this.centralApi.enregistrerMatieresClasseEtablissement(String(payload.classroom.id), {
        ...context,
        matieres: payload.matieres,
      }),
    )).pipe(toArray()).subscribe({
      next: () => {
        this.classSubjectsSaving.set(false);
        this.chargerPedagogie(true);
        this.snackBar.success(
          classrooms.length === 1
            ? 'Les matières de la classe ont été enregistrées.'
            : 'Les matières des classes sélectionnées ont été enregistrées.',
        );
      },
      error: (response) => {
        this.classSubjectsSaving.set(false);
        this.snackBar.error(response.error?.message ?? 'Les matières de la classe n’ont pas pu être enregistrées.');
      },
    });
  }

  private chargerPedagogie(force = false): void {
    const context = this.pedagogyContext();
    if (!context) return;
    const key = `${context['type_etablissement']}:${context['campus_id']}:${context['annee_scolaire_centrale_id']}`;
    // Ne pas lire subjectsLoading() ici : cette méthode est appelée depuis un
    // effect Angular. Observer puis modifier ce signal créait une boucle de
    // requêtes lors du passage Matières -> Programmes -> Matières.
    if (!force && this.pedagogieRequestKey === key) return;
    this.pedagogieRequestKey = key;
    this.subjectsLoading.set(true);
    this.centralApi.pedagogieEtablissement(
      context['type_etablissement'],
      context['campus_id'],
      context['annee_scolaire_centrale_id'],
    ).subscribe({
      next: (resultat) => {
        if (this.pedagogieRequestKey !== key) return;
        this.subjectsLoading.set(false);
        this.applyPedagogyData(resultat);
      },
      error: (response) => {
        if (this.pedagogieRequestKey !== key) return;
        this.pedagogieRequestKey = '';
        this.subjectsLoading.set(false);
        this.snackBar.error(response.error?.message ?? 'Les données pédagogiques n’ont pas pu être chargées.');
      },
    });
  }

  private applyPedagogyData(resultat: PedagogieEtablissementApi): void {
    const subjects = resultat.matieres.map((subject) => {
      const proposal = this.predefinedSubjects().find((item) => item.code === subject.code);
      return {
        id: subject.id,
        name: subject.libelle,
        code: subject.code,
        domain: subject.domaine ?? '',
        scale: 20,
        levels: [...this.availableClassLevels()],
        teachers: this.teachers().filter((teacher) => teacher.subject === subject.libelle).length,
        color: proposal?.color ?? this.subjectColorForCode(subject.code),
        francoArabic: proposal?.francoArabic ?? subject.domaine === 'Enseignement franco-arabe',
      } satisfies PrimarySubject;
    });
    const assignments: Record<string, SubjectId[]> = {};
    const settings: Record<string, { coefficient: number | null; teacherId: number | null; maxScore: number }> = {};
    resultat.classes_matieres.forEach((link) => {
      assignments[link.classe_id] = [...(assignments[link.classe_id] ?? []), link.matiere_id];
      settings[`${link.classe_id}::${link.matiere_id}`] = {
        coefficient: link.coefficient === null ? null : Number(link.coefficient),
        teacherId: null,
        maxScore: Number(link.note_maximale ?? 20),
      };
    });
    const curriculumChapters = (resultat.programmes ?? []).flatMap((programme) =>
      programme.lecons.map((lesson): CurriculumChapter => ({
        id: lesson.id,
        classId: programme.classe_id,
        subjectId: programme.matiere_id,
        title: lesson.libelle,
        objective: lesson.objectifs ?? '',
        period: lesson.periode ?? '',
        order: Number(lesson.ordre),
        lessons: [{
          id: lesson.id,
          title: lesson.libelle,
          estimatedSessions: Number(lesson.nombre_seances_estime) || 1,
          progress: Number(lesson.pourcentage) || 0,
          status: lesson.statut === 'terminee'
            ? 'Terminée'
            : lesson.statut === 'en_cours'
              ? 'En cours'
              : 'À faire',
        }],
      })),
    );
    this.subjects.set(subjects);
    this.classSubjectAssignments.set(assignments);
    this.collegeSubjectSettings.set(settings);
    this.curriculumChapters.set(curriculumChapters);
    this.ensureSelectedCurriculumSubject();
  }

  private pedagogyContext(): Record<string, string> | null {
    const academicYearId = this.selectedCentralAcademicYearId();
    const campusId = this.selectedCampusId();
    if (!academicYearId || !campusId) return null;
    return {
      type_etablissement: this.codeTypeEtablissementApi(),
      campus_id: campusId,
      annee_scolaire_centrale_id: academicYearId,
    };
  }

  private subjectColorForCode(code: string): string {
    const palette = ['#2f80ed', '#7b61c9', '#36a37c', '#e28b4f', '#2779b9', '#d66f57', '#4b8e8b', '#8a6d3b'];
    const index = [...code].reduce((total, character) => total + character.charCodeAt(0), 0) % palette.length;
    return palette[index];
  }

  private ensureClassSubjectSelection(): void {
    const classrooms = this.campusClasses();
    const availableIds = new Set(classrooms.map((classroom) => classroom.id));
    const currentIds = this.selectedClassSubjectIds().filter((classId) => availableIds.has(classId));
    if (currentIds.length) {
      if (currentIds.length !== this.selectedClassSubjectIds().length) {
        this.selectedClassSubjectIds.set(currentIds);
      }
      return;
    }
    const fallbackId = availableIds.has(this.selectedClassId())
      ? this.selectedClassId()
      : classrooms[0]?.id;
    this.selectedClassSubjectIds.set(fallbackId ? [fallbackId] : []);
  }

  startSubjectCreation(): void {
    this.subjectForm = this.createEmptySubjectForm();
    this.subjectEditorOpen.set(true);
  }

  editSubject(subject: PrimarySubject): void {
    this.subjectForm = {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      domain: subject.domain,
      scale: subject.scale,
      levels: [...subject.levels],
      color: subject.color,
    };
    this.subjectEditorOpen.set(true);
  }

  closeSubjectEditor(): void {
    this.subjectEditorOpen.set(false);
  }

  saveSubject(): void {
    const form = this.subjectForm;
    const context = this.pedagogyContext();
    if (!context || !form.name.trim() || !form.code.trim()) {
      this.snackBar.error('Renseignez le nom et le code de la matière.');
      return;
    }
    this.subjectsSaving.set(true);
    this.centralApi.enregistrerMatiereEtablissement({
      ...context,
      id: typeof form.id === 'string' ? form.id : null,
      libelle: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      domaine: form.domain || null,
    }).subscribe({
      next: (resultat) => {
        this.subjectsSaving.set(false);
        this.subjectEditorOpen.set(false);
        this.applyPedagogyData(resultat);
        this.snackBar.success(resultat.message ?? (form.id ? 'La matière a été mise à jour.' : 'La matière a été ajoutée.'));
      },
      error: (response) => {
        this.subjectsSaving.set(false);
        this.snackBar.error(response.error?.message ?? 'La matière n’a pas pu être enregistrée.');
      },
    });
  }

  startTeacherRegistration(): void {
    this.teacherForm = this.createEmptyTeacherForm();
    this.teacherAttachmentFiles = [];
    this.teacherEditorOpen.set(true);
  }

  closeTeacherEditor(): void {
    this.teacherEditorOpen.set(false);
  }

  editTeacher(teacher: Teacher): void {
    this.loadTeacherForm(teacher);
    this.teacherEditorOpen.set(true);
  }

  private loadTeacherForm(teacher: Teacher): void {
    this.teacherAttachmentFiles = [];
    const names = this.splitStudentName(teacher.name);
    this.teacherForm = {
      id: teacher.id,
      matricule: teacher.matricule,
      firstName: names.firstName,
      lastName: names.lastName,
      gender: teacher.gender,
      birthDate: this.toInputDate(teacher.birthDate),
      birthPlace: teacher.birthPlace ?? '',
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
      emergencyContact: teacher.emergencyContact,
      emergencyPhone: teacher.emergencyPhone,
      degree: teacher.degree,
      specialization: teacher.subject,
      hireDate: this.toInputDate(teacher.hireDate),
      contractType: teacher.contractType,
      status: teacher.status,
      experience: teacher.experience,
      salary: teacher.salary,
      hourlyRate: teacher.hourlyRate,
      salaryMode: teacher.salaryMode ?? 'Mensuel',
      attachments: [...(teacher.attachments ?? [])],
    };
  }

  deleteTeacher(teacher: Teacher): void {
    this.requestConfirmation({
      title: 'Supprimer ce dossier enseignant ?',
      message: `Le dossier enseignant de ${teacher.name} sera définitivement supprimé.`,
      confirmLabel: 'Supprimer le dossier',
      icon: 'delete_outline',
    }, () => {
      this.teachers.update((items) => items.filter((item) => item.id !== teacher.id));
      this.snackBar.open('Le dossier enseignant a été supprimé.', 'Fermer', {
        duration: 2500,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
    });
  }

  deleteTeachers(teachers: Teacher[]): void {
    if (!teachers.length) return;
    this.requestConfirmation({
      title: 'Supprimer les enseignants sélectionnés ?',
      message: `${teachers.length} dossiers enseignants seront définitivement supprimés.`,
      confirmLabel: `Supprimer les ${teachers.length} dossiers`,
      icon: 'delete_outline',
    }, () => {
      const ids = new Set(teachers.map((teacher) => teacher.id));
      this.teachers.update((items) => items.filter((item) => !ids.has(item.id)));
      this.snackBar.open(`${teachers.length} dossiers enseignants supprimés.`, 'Fermer', {
        duration: 2500,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
    });
  }

  refreshTeachers(): void {
    this.centralApi.invaliderCache('institut:dossiers:');
    this.chargerDossiers(this.workspace.establishmentType(), this.selectedCampusId(), true);
  }

  studentClassName(student: Student): string {
    return this.classes().find((classroom) => classroom.id === student.classId)?.name ?? 'Non affecté';
  }

  studentInitials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('');
  }

  sendPortalInvitation(person: 'famille' | 'enseignant'): void {
    this.snackBar.open(
      person === 'famille'
        ? 'Invitation envoyée au tuteur.'
        : 'Invitation envoyée à l’enseignant.',
      'Fermer',
      { duration: 2800, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
  }

  setPortalAccountStatus(
    person: 'famille' | 'enseignant',
    status: PortalAccountStatus,
  ): void {
    if (person === 'famille') {
      const studentId = this.selectedStudentId();
      const student = this.students().find((item) => item.id === studentId);
      if (student) {
        this.students.update((items) =>
          items.map((item) => item.id === student.id ? { ...item, portalAccount: status } : item),
        );
        if (student.guardianId) {
          this.guardians.update((items) =>
            items.map((item) => item.id === student.guardianId ? { ...item, accountStatus: status } : item),
          );
        }
      }
    } else {
      const teacherId = this.selectedTeacherId();
      this.teachers.update((items) =>
        items.map((item) => item.id === teacherId ? { ...item, portalAccount: status } : item),
      );
    }

    const message = status === 'Invitation envoyée'
      ? 'Autorisation envoyée pour la création du compte.'
      : status === 'Actif'
        ? 'Le compte a été activé.'
        : status === 'Désactivé'
          ? 'Le compte a été désactivé.'
          : 'Le compte a été marqué comme non créé.';
    this.snackBar.open(message, 'Fermer', {
      duration: 2800,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  setStaffPortalAccountStatus(status: PortalAccountStatus): void {
    const staffId = this.selectedStaffId();
    this.schoolStaff.update((items) => items.map((person) =>
      person.id === staffId ? { ...person, portalAccount: status } : person,
    ));
    this.snackBar.open(
      status === 'Invitation envoyée' ? 'Autorisation envoyée pour la création du compte.' :
        status === 'Actif' ? 'Le compte du personnel a été activé.' : 'Le compte du personnel a été désactivé.',
      'Fermer',
      { duration: 2800, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
  }

  resetStaffPortalPassword(): void {
    this.snackBar.open('Le lien de réinitialisation a été envoyé au personnel.', 'Fermer', {
      duration: 2800,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  resetPortalPassword(person: 'famille' | 'enseignant'): void {
    this.snackBar.open(
      person === 'famille'
        ? 'Le lien de réinitialisation a été envoyé au tuteur.'
        : 'Le lien de réinitialisation a été envoyé à l’enseignant.',
      'Fermer',
      { duration: 2800, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
  }

  saveTeacher(): void {
    const form = this.teacherForm;
    const existant = form.id === null ? undefined : this.teachers().find((item) => item.id === form.id);
    const conserverDetail = this.activeView() === 'teacher-detail';
    if (this.dossierSaving()) return;
    this.dossierSaving.set(true);
    const donneesEnseignant: Record<string, unknown> = {
      type_etablissement: this.codeTypeEtablissementApi(),
      campus_id: this.selectedCampusId(),
      id: existant?.backendId ?? null,
      matricule: form.matricule.trim() || null,
      prenom: form.firstName.trim(),
      nom: form.lastName.trim(),
      sexe: form.gender,
      date_naissance: form.birthDate || null,
      lieu_naissance: form.birthPlace.trim() || null,
      telephone: form.phone.trim() || null,
      email: form.email.trim() || null,
      adresse: form.address.trim() || null,
      date_embauche: form.hireDate || null,
      type_contrat: form.contractType || null,
      statut: form.status === 'En congé' ? 'conge' : 'actif',
      contact_urgence_nom: form.emergencyContact.trim() || null,
      contact_urgence_telephone: form.emergencyPhone.trim() || null,
      specialite: form.specialization.trim() || null,
      diplome: form.degree.trim() || null,
      experience_annees: form.experience === '' ? null : Number(form.experience),
      type_remuneration: form.salaryMode === 'Horaire' ? 'horaire' : 'mensuelle',
      salaire_mensuel: form.salary === '' ? null : Number(form.salary),
      montant_heure: form.hourlyRate === '' ? null : Number(form.hourlyRate),
      documents_conserves: [...form.attachments],
    };
    this.centralApi.enregistrerEnseignantEtablissement(
      this.avecPiecesJointes(donneesEnseignant, this.teacherAttachmentFiles),
    ).subscribe({
      next: (resultat) => {
        this.dossierSaving.set(false);
        this.appliquerDossiersApi(resultat, this.selectedCampusId());
        const enseignant = this.teachers().find((item) => item.backendId === resultat.personnel_id);
        this.teacherEditorOpen.set(false);
        if (conserverDetail && enseignant) {
          this.selectedTeacherId.set(enseignant.id);
          this.loadTeacherForm(enseignant);
          this.teacherRecordTab.set('profile');
          this.activeView.set('teacher-detail');
        }
        this.snackBar.open(resultat.message, 'Fermer', { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' });
      },
      error: (response) => {
        this.dossierSaving.set(false);
        this.snackBar.open(response.error?.message ?? 'L’enregistrement de l’enseignant a échoué.', 'Fermer', { duration: 4000 });
      },
    });
  }

  saveTeacherRecord(): void {
    this.saveTeacher();
  }

  onTeacherFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const names = files.map((file) => file.name);
    this.teacherAttachmentFiles = [
      ...this.teacherAttachmentFiles.filter((file) => !names.includes(file.name)),
      ...files,
    ];
    this.teacherForm.attachments = [
      ...new Set([...this.teacherForm.attachments, ...names]),
    ];
    input.value = '';
  }

  removeTeacherAttachment(name: string): void {
    this.teacherAttachmentFiles = this.teacherAttachmentFiles.filter((file) => file.name !== name);
    this.teacherForm.attachments = this.teacherForm.attachments.filter(
      (attachment) => attachment !== name,
    );
  }

  startStaffRegistration(): void {
    this.staffForm = this.createEmptyStaffForm();
    this.staffAttachmentFiles = [];
    this.staffEditorOpen.set(true);
    this.activeView.set('staff');
  }

  closeStaffEditor(): void {
    this.staffEditorOpen.set(false);
  }

  editStaff(person: SchoolStaff): void {
    this.loadStaffForm(person);
    this.staffEditorOpen.set(true);
    this.activeView.set('staff');
  }

  viewStaff(person: SchoolStaff): void {
    this.selectedStaffId.set(person.id);
    this.loadStaffForm(person);
    this.staffRecordTab.set('profile');
    this.staffEditorOpen.set(false);
    this.activeView.set('staff-detail');
  }

  setStaffRecordTab(tab: StaffRecordTab): void {
    this.staffRecordTab.set(tab);
  }

  deleteStaff(person: SchoolStaff): void {
    this.requestConfirmation({
      title: 'Supprimer ce dossier du personnel ?',
      message: `Le dossier de ${person.name} sera définitivement supprimé.`,
      confirmLabel: 'Supprimer le dossier',
      icon: 'delete_outline',
    }, () => {
      this.schoolStaff.update((items) => items.filter((item) => item.id !== person.id));
      this.snackBar.open('Le dossier du personnel a été supprimé.', 'Fermer', {
        duration: 2500,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
    });
  }

  deleteStaffMembers(personnel: SchoolStaff[]): void {
    if (!personnel.length) return;
    this.requestConfirmation({
      title: 'Supprimer les dossiers sélectionnés ?',
      message: `${personnel.length} dossiers du personnel seront définitivement supprimés.`,
      confirmLabel: `Supprimer les ${personnel.length} dossiers`,
      icon: 'delete_outline',
    }, () => {
      const ids = new Set(personnel.map((person) => person.id));
      this.schoolStaff.update((items) => items.filter((item) => !ids.has(item.id)));
      this.snackBar.open(`${personnel.length} dossiers du personnel supprimés.`, 'Fermer', {
        duration: 2500,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
    });
  }

  refreshStaff(): void {
    this.centralApi.invaliderCache('institut:dossiers:');
    this.chargerDossiers(this.workspace.establishmentType(), this.selectedCampusId(), true);
  }

  saveStaff(): void {
    const form = this.staffForm;
    const existant = form.id === null ? undefined : this.schoolStaff().find((item) => item.id === form.id);
    const conserverDetail = this.activeView() === 'staff-detail';
    if (this.dossierSaving()) return;
    this.dossierSaving.set(true);
    const donneesPersonnel: Record<string, unknown> = {
      type_etablissement: this.codeTypeEtablissementApi(),
      campus_id: this.selectedCampusId(),
      id: existant?.backendId ?? null,
      matricule: form.matricule.trim() || null,
      prenom: form.firstName.trim(),
      nom: form.lastName.trim(),
      sexe: form.gender,
      date_naissance: form.birthDate || null,
      lieu_naissance: form.birthPlace.trim() || null,
      telephone: form.phone.trim() || null,
      email: form.email.trim() || null,
      adresse: form.address.trim() || null,
      fonction: form.function.trim(),
      date_embauche: form.hireDate || null,
      type_contrat: form.contractType || null,
      statut: form.status === 'Suspendu' ? 'suspendu' : form.status === 'En congé' ? 'conge' : 'actif',
      contact_urgence_nom: form.emergencyContact.trim() || null,
      contact_urgence_telephone: form.emergencyPhone.trim() || null,
      salaire_mensuel: form.salary === '' ? null : Number(form.salary),
      documents_conserves: [...form.attachments],
    };
    this.centralApi.enregistrerPersonnelEtablissement(
      this.avecPiecesJointes(donneesPersonnel, this.staffAttachmentFiles),
    ).subscribe({
      next: (resultat) => {
        this.dossierSaving.set(false);
        this.appliquerDossiersApi(resultat, this.selectedCampusId());
        const personnel = this.schoolStaff().find((item) => item.backendId === resultat.personnel_id);
        this.staffEditorOpen.set(false);
        if (conserverDetail && personnel) {
          this.selectedStaffId.set(personnel.id);
          this.loadStaffForm(personnel);
          this.staffRecordTab.set('profile');
          this.activeView.set('staff-detail');
        }
        this.snackBar.open(resultat.message, 'Fermer', { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' });
      },
      error: (response) => {
        this.dossierSaving.set(false);
        this.snackBar.open(response.error?.message ?? 'L’enregistrement du personnel a échoué.', 'Fermer', { duration: 4000 });
      },
    });
  }

  saveStaffRecord(): void {
    this.saveStaff();
  }

  onStaffFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const names = files.map((file) => file.name);
    this.staffAttachmentFiles = [
      ...this.staffAttachmentFiles.filter((file) => !names.includes(file.name)),
      ...files,
    ];
    this.staffForm.attachments = [...new Set([...this.staffForm.attachments, ...names])];
    input.value = '';
  }

  removeStaffAttachment(name: string): void {
    this.staffAttachmentFiles = this.staffAttachmentFiles.filter((file) => file.name !== name);
    this.staffForm.attachments = this.staffForm.attachments.filter((attachment) => attachment !== name);
  }

  private loadStaffForm(person: SchoolStaff): void {
    this.staffAttachmentFiles = [];
    const names = this.splitStudentName(person.name);
    this.staffForm = {
      id: person.id,
      matricule: person.matricule,
      firstName: names.firstName,
      lastName: names.lastName,
      gender: person.gender,
      birthDate: this.toInputDate(person.birthDate),
      birthPlace: person.birthPlace,
      email: person.email,
      phone: person.phone,
      address: person.address,
      function: person.function,
      hireDate: this.toInputDate(person.hireDate),
      contractType: person.contractType,
      status: person.status,
      salary: person.salary,
      hourlyRate: person.hourlyRate,
      emergencyContact: person.emergencyContact,
      emergencyPhone: person.emergencyPhone,
      attachments: [...(person.attachments ?? [])],
    };
  }

  private createEmptyStaffForm(): SchoolStaffFormModel {
    const nextId = Math.max(...this.schoolStaff().map((person) => person.id), 0) + 1;
    return {
      id: null,
      matricule: `PER-26${String(nextId).padStart(3, '0')}`,
      firstName: '',
      lastName: '',
      gender: 'F',
      birthDate: '',
      birthPlace: '',
      email: '',
      phone: '',
      address: '',
      function: 'Assistant administratif',
      hireDate: '2026-07-30',
      contractType: 'Permanent',
      status: 'Actif',
      salary: '',
      hourlyRate: '',
      emergencyContact: '',
      emergencyPhone: '',
      attachments: [],
    };
  }

  private createEmptyTeacherForm(): TeacherFormModel {
    const nextId = Math.max(...this.teachers().map((teacher) => teacher.id), 0) + 1;
    return {
      id: null,
      matricule: `ENS-26${String(nextId).padStart(3, '0')}`,
      firstName: '',
      lastName: '',
      gender: 'F',
      birthDate: '',
      birthPlace: '',
      email: '',
      phone: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      degree: '',
      specialization: 'Polyvalent',
      hireDate: '2026-07-30',
      contractType: 'Permanent',
      status: 'Actif',
      experience: '0',
      salary: '',
      hourlyRate: '',
      salaryMode: 'Mensuel',
      attachments: [],
    };
  }

  private createTeacherTimetableRow(
    id: number,
    startTime: string,
    endTime: string,
    entries: Array<[string, string, string] | null>,
  ): TeacherTimetableRow {
    const cell = (index: number): TeacherTimetableCell | null => {
      const entry = entries[index];
      return entry
        ? { subject: entry[0], className: entry[1], room: entry[2] }
        : null;
    };

    return {
      id,
      startTime,
      endTime,
      cells: {
        monday: cell(0),
        tuesday: cell(1),
        wednesday: cell(2),
        thursday: cell(3),
        friday: cell(4),
        saturday: cell(5),
      },
    };
  }

  private createEmptyStudentForm(): StudentFormModel {
    const nextId = Math.max(...this.students().map((student) => student.id), 0) + 1;
    return {
      id: null,
      matricule: `PRI-26${String(nextId + 46).padStart(4, '0')}`,
      firstName: '',
      lastName: '',
      gender: 'F',
      birthDate: '',
      birthPlace: '',
      nationality: 'Sénégalaise',
      guardianMode: 'new',
      guardianId: null,
      parentFirstName: '',
      parentLastName: '',
      parentRelationship: '',
      parentProfession: '',
      parentPhone: '',
      secondaryPhone: '',
      email: '',
      address: '',
      bloodGroup: '',
      medicalNotes: '',
      regime: 'Externe',
      transport: false,
      canteen: false,
      attachments: [],
    };
  }

  private createEmptyClassForm(): ClassFormModel {
    const selected = this.selectedClass();
    return {
      id: null,
      level: selected?.level ?? this.availableClassLevels()[0] ?? 'CI',
      name: '',
      registrationFee: selected?.registrationFee ?? '25000',
      monthlyFee: selected?.monthlyFee ?? '18000',
      seriesId: this.isHighSchool()
        ? selected?.seriesId ?? this.highSchoolSeries().find((series) => series.active)?.id ?? ''
        : '',
    };
  }

  private createEmptySeriesForm(): HighSchoolSeriesForm {
    return {
      id: null,
      code: '',
      label: '',
      description: '',
      color: '#2f80ed',
      active: true,
    };
  }

  private initializeFeeConfigurations(): void {
    this.classFeeConfigurations.set(
      this.classes().flatMap((classroom) =>
        this.feeAcademicYears.map((academicYear) =>
          this.defaultFeeConfiguration(classroom, academicYear),
        ),
      ),
    );
  }

  private defaultFeeConfiguration(
    classroom: PrimaryClass,
    academicYear: string,
  ): ClassFeeConfiguration {
    const yearDifference =
      this.academicYearStart(academicYear) - this.academicYearStart(this.currentFeeAcademicYear);
    const adjust = (amount: string, annualStep: number): string =>
      String(Math.max(0, Number(amount) + yearDifference * annualStep));
    return {
      academicYear,
      classId: classroom.id,
      registrationFee: adjust(classroom.registrationFee, 2500),
      monthlyFee: adjust(classroom.monthlyFee, 1500),
    };
  }

  private academicYearStart(academicYear: string): number {
    return Number(academicYear.split(/[–-]/)[0]) || 0;
  }

  addPrimaryLevelSetting(): void {
    this.schoolLevelSettings = [
      ...this.schoolLevelSettings,
      { id: `nouveau-${Date.now()}`, code: '', label: '' },
    ];
  }

  removePrimaryLevelSetting(id: number | string): void {
    if (this.schoolLevelSettings.length <= 1) {
      this.snackBar.open('Conservez au moins un niveau.', 'Fermer', { duration: 2600 });
      return;
    }
    const level = this.schoolLevelSettings.find((item) => item.id === id);
    this.requestConfirmation({
      title: 'Supprimer ce niveau ?',
      message: `Le niveau ${level?.code || level?.label || 'sélectionné'} sera retiré de la configuration.`,
      confirmLabel: 'Supprimer le niveau',
      icon: 'delete_outline',
    }, () => {
      this.schoolLevelSettings = this.schoolLevelSettings.filter((item) => item.id !== id);
    });
  }

  saveSchoolSettings(): void {
    const year = this.schoolYearSettings;
    const invalidLevel = this.schoolLevelSettings.some((level) => !level.code.trim() || !level.label.trim());
    const invalidTerm = this.trimesterSettings.some((term) => !term.label.trim() || !term.startDate || !term.endDate || term.startDate > term.endDate);
    const periodLabel = this.isCollege() ? 'semestres' : 'trimestres';

    if (!year.centralYearId || !year.startDate || !year.endDate || year.startDate > year.endDate || invalidLevel || invalidTerm) {
      this.snackBar.open(`Vérifiez l’année scolaire, les niveaux et les dates des ${periodLabel}.`, 'Fermer', { duration: 3500 });
      return;
    }

    if (this.isSelectedSchoolYearArchived()) {
      this.snackBar.open('Cette année scolaire est archivée et ne peut plus être modifiée.', 'Fermer', { duration: 3200 });
      return;
    }

    this.centralApi.enregistrerAnneeScolaireEtablissement(
      year.centralYearId,
      this.codeTypeEtablissementApi(),
      year.startDate,
      year.endDate,
      this.anneesScolairesDisponibles().find((annee) => annee.id === year.centralYearId)?.est_courante ?? false,
      this.schoolLevelSettings.map((niveau) => ({
        id: niveau.id,
        code: niveau.code,
        libelle: niveau.label,
      })),
      this.trimesterSettings.map((periode) => ({
        libelle: periode.label,
        date_debut: periode.startDate,
        date_fin: periode.endDate,
      })),
    ).subscribe({
      next: () => {
        const academicYear = year.label;
        this.workspace.selectedAcademicYear.set(academicYear);
        this.selectedFeeAcademicYear.set(academicYear);
        this.selectedCollectionAcademicYear.set(academicYear);
        this.selectedExpenseAcademicYear.set(academicYear);
        this.selectedFinanceAcademicYear.set(academicYear);
        this.workspace.selectedPeriod.set(this.trimesterSettings[0].label);
        this.chargerAnneesScolaires();
        this.snackBar.open(
          `Paramètres ${this.isHighSchool() ? 'du lycée' : this.isCollege() ? 'du collège' : 'du primaire'} enregistrés.`,
          'Fermer',
          { duration: 2800 },
        );
      },
      error: (response) => this.snackBar.open(
        response.error?.message ?? 'Les dates de l’année scolaire n’ont pas pu être enregistrées.',
        'Fermer',
        { duration: 3500 },
      ),
    });
  }

  selectSchoolYear(centralYearId: string): void {
    const annee = this.anneesScolairesDisponibles().find((item) => item.id === centralYearId);
    if (!annee) return;

    this.selectedCentralAcademicYearId.set(annee.id);
    this.schoolYearSettings = {
      centralYearId: annee.id,
      label: annee.libelle,
      startDate: annee.configuration?.date_debut ?? '',
      endDate: annee.configuration?.date_fin ?? '',
    };
    this.workspace.selectedAcademicYear.set(annee.libelle);
    this.chargerParametresScolarite(annee.id);
    this.chargerClasses();
  }

  actualiserDonneesBackend(): void {
    if (this.backendRefreshing()) return;
    this.centralApi.invaliderCache('institut:');
    this.backendRefreshing.set(true);
    this.centralApi.espaceInstitut().subscribe({
      next: () => this.chargerAnneesScolaires(true),
      error: (response) => {
        this.backendRefreshing.set(false);
        this.snackBar.open(
          response.error?.message ?? 'Les données de l’établissement n’ont pas pu être réactualisées.',
          'Fermer',
          { duration: 3800 },
        );
      },
    });
  }

  private chargerParametresScolarite(anneeCentraleId: string): void {
    this.schoolSettingsLoading.set(true);
    this.centralApi.parametresScolariteEtablissement(
      anneeCentraleId,
      this.codeTypeEtablissementApi(),
    ).subscribe({
      next: ({ niveaux, periodes }) => {
        if (niveaux.length) {
          this.schoolLevelSettings = niveaux.map((niveau) => ({
            id: niveau.id,
            code: niveau.code,
            label: niveau.libelle,
          }));
        }
        if (periodes.length) {
          this.trimesterSettings = periodes.map((periode) => ({
            id: periode.id,
            label: periode.libelle,
            startDate: periode.date_debut ?? '',
            endDate: periode.date_fin ?? '',
          }));
        }
        this.preparerPropositionsClasses(true);
        this.schoolSettingsLoading.set(false);
      },
      error: () => this.schoolSettingsLoading.set(false),
    });
  }

  private chargerAnneesScolaires(actualisationManuelle = false): void {
    this.schoolYearsLoading.set(true);
    this.centralApi.anneesScolairesInstitut(this.codeTypeEtablissementApi()).subscribe({
      next: ({ data }) => {
        this.anneesScolairesDisponibles.set(data);
        this.workspace.academicYears.set(data.map((annee) => annee.libelle));
        const annee = data.find((item) => item.configuration?.est_courante)
          ?? data.find((item) => item.est_courante)
          ?? data[0];
        if (annee) {
          this.selectSchoolYear(annee.id);
        }
        if (actualisationManuelle) {
          this.backendRefreshing.set(false);
          this.snackBar.open('Les données ont été réactualisées depuis la base de données.', 'Fermer', { duration: 2800 });
        }
        this.schoolYearsLoading.set(false);
      },
      error: (response) => {
        this.schoolYearsLoading.set(false);
        if (actualisationManuelle) {
          this.backendRefreshing.set(false);
          this.snackBar.open(
            response.error?.message ?? 'La réactualisation des données a échoué.',
            'Fermer',
            { duration: 3800 },
          );
        }
      },
    });
  }

  private codeTypeEtablissementApi(): string {
    return this.workspace.establishmentType() === 'primary'
      ? 'primaire'
      : this.workspace.establishmentType();
  }

  private avecPiecesJointes(donnees: Record<string, unknown>, fichiers: File[]): Record<string, unknown> | FormData {
    if (!fichiers.length) {
      return donnees;
    }
    const formulaire = new FormData();
    formulaire.append('donnees', JSON.stringify(donnees));
    fichiers.forEach((fichier) => formulaire.append('pieces_jointes[]', fichier, fichier.name));
    return formulaire;
  }

  private createEmptyCurriculumChapterForm(): CurriculumChapterFormModel {
    return {
      title: '',
      objective: '',
      period: '',
      estimatedSessions: 2,
    };
  }

  private markCurriculumLessonCompleted(session: SchoolSession, lessonTitle: string): void {
    if (!lessonTitle) {
      return;
    }
    const subjectId = this.subjects().find((subject) => subject.name === session.subject)?.id;
    if (subjectId === undefined) {
      return;
    }
    this.curriculumChapters.update((chapters) =>
      chapters.map((chapter) =>
        chapter.classId === session.classId && chapter.subjectId === subjectId
          ? {
              ...chapter,
              lessons: chapter.lessons.map((lesson) =>
                lesson.title === lessonTitle ? { ...lesson, status: 'Terminée', progress: 100 } : lesson,
              ),
            }
          : chapter,
      ),
    );
  }

  private ensureSelectedCurriculumSubject(): void {
    const assignedIds = this.classSubjectAssignments()[this.selectedClassId()] ?? [];
    const selectedId = this.selectedCurriculumSubjectId();
    if (selectedId === null || !assignedIds.includes(selectedId)) {
      this.selectedCurriculumSubjectId.set(assignedIds[0] ?? null);
    }
  }

  private createEmptySubjectForm(): SubjectFormModel {
    return {
      id: null,
      name: '',
      code: '',
      domain: '',
      scale: 20,
      levels: [...this.primaryLevels],
      color: '#2f80ed',
    };
  }

  private createTimetableRow(
    id: number,
    startTime: string,
    endTime: string,
    entries: Array<[string, number | null]>,
  ): TimetableRow {
    const cell = (index: number): TimetableCell => ({
      subject: entries[index]?.[0] ?? '',
      teacherId: entries[index]?.[1] ?? null,
      roomId: null,
    });

    return {
      id,
      startTime,
      endTime,
      cells: {
        monday: cell(0),
        tuesday: cell(1),
        wednesday: cell(2),
        thursday: cell(3),
        friday: cell(4),
        saturday: cell(5),
      },
    };
  }

  private cloneTimetableRows(rows: TimetableRow[]): TimetableRow[] {
    return rows.map((row) => ({
      ...row,
      cells: {
        monday: { ...row.cells.monday },
        tuesday: { ...row.cells.tuesday },
        wednesday: { ...row.cells.wednesday },
        thursday: { ...row.cells.thursday },
        friday: { ...row.cells.friday },
        saturday: { ...row.cells.saturday },
      },
    }));
  }

  private affectationsEnseignantsDepuisEmploiTemps(rows: TimetableRow[]): Record<string, number | null> {
    const assignments: Record<string, number | null> = {};
    rows.forEach((row) => {
      this.timetableDays.forEach((day) => {
        const cell = row.cells[day.key];
        if (!cell.subject || cell.subject === 'Pause') return;
        if (!(cell.subject in assignments) || (assignments[cell.subject] === null && cell.teacherId !== null)) {
          assignments[cell.subject] = cell.teacherId;
        }
      });
    });
    return assignments;
  }

  private splitStudentName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    return {
      firstName: parts.shift() ?? '',
      lastName: parts.join(' '),
    };
  }

  private toInputDate(value: string): string {
    const [day, month, year] = value.split('/');
    return day && month && year ? `${year}-${month}-${day}` : value;
  }

  private parseStudentImportCsv(content: string): Array<Record<string, string>> {
    const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      return [];
    }
    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = this.parseCsvLine(lines[0], separator).map((header) => this.normalizeImportHeader(header));
    return lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line, separator);
      return headers.reduce<Record<string, string>>((row, header, index) => {
        row[header] = values[index]?.trim() ?? '';
        return row;
      }, {});
    });
  }

  private parseCsvLine(line: string, separator: string): string[] {
    const values: string[] = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === separator && !quoted) {
        values.push(value);
        value = '';
      } else {
        value += character;
      }
    }
    values.push(value);
    return values;
  }

  private studentImportValue(row: Record<string, string>, ...keys: string[]): string {
    return keys.map((key) => row[this.normalizeImportHeader(key)] ?? '').find(Boolean)?.trim() ?? '';
  }

  private normalizeImportHeader(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('fr-FR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private normalizedPhone(value: string): string {
    return value.replace(/\D/g, '');
  }

  private toDisplayDate(value: string): string {
    const [year, month, day] = value.split('-');
    return day && month && year ? `${day}/${month}/${year}` : value;
  }

  private parseIsoDate(value: string): Date {
    return new Date(`${value}T12:00:00`);
  }

  private toIsoDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private programUnitForSubject(subject: string): string {
    const units: Record<string, string> = {
      Français: 'Langue et communication',
      Mathématiques: 'Activités numériques',
      'Étude du milieu': 'Découverte du monde',
      'Éducation civique et morale': 'Vivre ensemble',
      Arabe: 'Langue arabe',
      'Éducation physique et sportive': 'Éducation motrice',
    };
    return units[subject] ?? 'Programme annuel';
  }

  private programProgressForSubject(subject: string): number {
    const progress: Record<string, number> = {
      Français: 68,
      Mathématiques: 61,
      'Étude du milieu': 56,
      'Éducation civique et morale': 45,
      Arabe: 49,
      'Éducation physique et sportive': 64,
    };
    return progress[subject] ?? 50;
  }

  markAttendance(studentId: number, status: AttendanceStatus): void {
    this.attendance.update((state) => ({ ...state, [studentId]: status }));
  }

  openAssessment(assessment: PrimaryAssessment): void {
    this.selectedAssessmentId.set(assessment.id);
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }

  openAssessmentEditor(): void {
    const domain = this.selectedEvaluationDomain();
    const component = domain.components[0];
    this.assessmentForm = { title: '', type: 'controle', date: new Date().toISOString().slice(0, 10), period: this.selectedTrimester(), domainId: domain.id, componentId: component?.id ?? '', teacherId: String(this.campusTeachers()[0]?.id ?? '') };
    this.assessmentEditorOpen.set(true);
  }

  closeAssessmentEditor(): void { this.assessmentEditorOpen.set(false); }

  assessmentEditorComponents(): PrimaryEvaluationComponent[] {
    return this.primaryEvaluationDomains.find((domain) => domain.id === this.assessmentForm.domainId)?.components ?? [];
  }

  createAssessment(): void {
    const context = this.pedagogyContext();
    const component = this.assessmentEditorComponents().find((item) => item.id === this.assessmentForm.componentId);
    const teacher = this.campusTeachers().find((item) => item.id === Number(this.assessmentForm.teacherId));
    if (!context || !component || !this.assessmentForm.title.trim() || !this.assessmentForm.date) { this.snackBar.error('Renseignez le titre, la date, le domaine et la composante évaluée.'); return; }
    this.assessmentSaving.set(true);
    this.centralApi.creerEvaluationEtablissement({ ...context, classe_id: this.selectedClassId(), titre: this.assessmentForm.title.trim(), type: this.assessmentForm.type, date_evaluation: this.assessmentForm.date, periode: this.assessmentForm.period || null, domaine: this.assessmentForm.domainId, composante: component.id, bareme: component.scale, enseignant_id: teacher?.teachingBackendId ?? null }).subscribe({
      next: (resultat) => { this.assessmentSaving.set(false); this.appliquerEvaluationsBackend(resultat.data); this.assessmentEditorOpen.set(false); this.snackBar.success(resultat.message); },
      error: (response) => { this.assessmentSaving.set(false); this.snackBar.error(response.error?.message ?? 'L’évaluation n’a pas pu être créée.'); },
    });
  }

  openAssessmentFromStudentRecord(assessment: PrimaryAssessment): void {
    this.activeView.set('assessments');
    this.selectedEvaluationDomainId.set(assessment.evaluationDomainId);
    this.selectedAssessmentId.set(assessment.id);
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }

  backToAssessmentList(): void {
    this.selectedAssessmentId.set(null);
    this.assessmentEditorOpen.set(false);
  }

  saveAssessmentResults(): void {
    const assessment = this.selectedAssessment();
    const context = this.pedagogyContext();
    if (!assessment || !context) return;
    const resultats = assessment.results.map((result) => {
      const student = this.assessmentStudent(result.studentId);
      return { eleve_id: student?.backendId, a_participe: result.participated, note: result.score, appreciation: result.appreciation || null };
    }).filter((result): result is { eleve_id: string; a_participe: boolean; note: number | null; appreciation: string | null } => Boolean(result.eleve_id));
    this.assessmentSaving.set(true);
    this.centralApi.enregistrerResultatsEvaluation(assessment.id, { ...context, resultats }).subscribe({
      next: (resultat) => { this.assessmentSaving.set(false); this.appliquerEvaluationsBackend(resultat.data); this.snackBar.success(resultat.message); },
      error: (response) => { this.assessmentSaving.set(false); this.snackBar.error(response.error?.message ?? 'Les résultats n’ont pas pu être enregistrés.'); },
    });
  }

  assessmentStudent(studentId: number): Student | undefined {
    return this.students().find((student) => student.id === studentId);
  }

  assessmentParticipantCount(assessment: PrimaryAssessment): number {
    return assessment.results.filter((result) => result.participated).length;
  }

  assessmentAttachmentCount(assessment: PrimaryAssessment): number {
    return assessment.results.reduce((total, result) => total + result.attachments.length, 0);
  }

  assessmentEvaluationDomain(assessment: PrimaryAssessment): PrimaryEvaluationDomain {
    return this.primaryEvaluationDomains.find(
      (domain) => domain.id === assessment.evaluationDomainId,
    ) ?? this.primaryEvaluationDomains[0];
  }

  assessmentEvaluationComponent(assessment: PrimaryAssessment): PrimaryEvaluationComponent {
    const domain = this.assessmentEvaluationDomain(assessment);
    return domain.components.find(
      (component) => component.id === assessment.componentId,
    ) ?? domain.components[0];
  }

  assessmentAverage(assessment: PrimaryAssessment): string {
    const scores = assessment.results
      .filter((result) => result.participated && result.score !== null)
      .map((result) => result.score as number);
    if (!scores.length) {
      return '—';
    }
    return (scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1);
  }

  assessmentTypeClass(type: AssessmentKind): string {
    if (type === 'Composition') {
      return 'composition';
    }
    if (type === 'Essai') {
      return 'practice';
    }
    if (type === 'Évaluation formative') {
      return 'formative';
    }
    return type === 'Contrôle' ? 'control' : 'homework';
  }

  assessmentStatusClass(status: PrimaryAssessment['status']): string {
    return status === 'Corrigée' ? 'completed' : status === 'À corriger' ? 'pending' : 'draft';
  }

  updateAssessmentScore(assessmentId: string, studentId: number, rawValue: string): void {
    const assessment = this.assessments().find((item) => item.id === assessmentId);
    if (!assessment) {
      return;
    }
    const parsed = rawValue === '' ? null : Number(rawValue);
    const score = parsed === null || Number.isNaN(parsed)
      ? null
      : Math.min(assessment.scale, Math.max(0, parsed));
    this.assessments.update((items) => items.map((item) => item.id === assessmentId
      ? {
          ...item,
          results: item.results.map((result) => result.studentId === studentId
            ? { ...result, score, participated: score !== null || result.participated }
            : result),
        }
      : item));
    if (
      this.isCollege() &&
      ['homework1', 'homework2', 'composition'].includes(assessment.componentId)
    ) {
      const gradeBookKey = `${assessment.trimester}::${assessment.classId}::${assessment.subject}`;
      const kind = assessment.componentId as SubjectGradeKind;
      this.subjectGrades.update((gradeBooks) => ({
        ...gradeBooks,
        [gradeBookKey]: {
          ...(gradeBooks[gradeBookKey] ?? {}),
          [studentId]: {
            ...(gradeBooks[gradeBookKey]?.[studentId] ?? {
              homework1: null,
              homework2: null,
              composition: null,
            }),
            [kind]: score,
          },
        },
      }));
      return;
    }
    const gradeBookKey = `${assessment.trimester}::${assessment.classId}::${assessment.evaluationDomainId}`;
    this.primaryEvaluationGrades.update((gradeBooks) => ({
      ...gradeBooks,
      [gradeBookKey]: {
        ...(gradeBooks[gradeBookKey] ?? {}),
        [studentId]: {
          ...(gradeBooks[gradeBookKey]?.[studentId] ?? {}),
          [assessment.componentId]: score,
        },
      },
    }));
  }

  updateAssessmentAppreciation(assessmentId: string, studentId: number, appreciation: string): void {
    this.assessments.update((items) => items.map((item) => item.id === assessmentId
      ? {
          ...item,
          results: item.results.map((result) => result.studentId === studentId
            ? { ...result, appreciation }
            : result),
        }
      : item));
  }

  downloadAssessmentAttachment(
    assessment: PrimaryAssessment,
    result: AssessmentResult,
    attachment: AssessmentAttachment,
  ): void {
    const student = this.assessmentStudent(result.studentId);
    const documentContent = [
      'E-Scolarité — Copie numérisée',
      `Évaluation : ${assessment.title}`,
      `Élève : ${student?.name ?? result.studentId}`,
      `Note : ${result.score ?? 'Non notée'} / ${assessment.scale}`,
      `Appréciation : ${result.appreciation || 'Non renseignée'}`,
    ].join('\n');
    const blob = new Blob([documentContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  updateSubjectGrade(studentId: number, kind: SubjectGradeKind, rawValue: string): void {
    const parsed = rawValue === '' ? null : Number(rawValue);
    const value = parsed === null || Number.isNaN(parsed) ? null : Math.min(20, Math.max(0, parsed));
    const gradeBookKey = this.subjectGradeBookKey();
    this.subjectGrades.update((gradeBooks) => {
      const currentGradeBook = gradeBooks[gradeBookKey] ?? {};
      const currentGrade = currentGradeBook[studentId] ?? {
        homework1: null,
        homework2: null,
        composition: null,
      };
      return {
        ...gradeBooks,
        [gradeBookKey]: {
          ...currentGradeBook,
          [studentId]: { ...currentGrade, [kind]: value },
        },
      };
    });
  }

  subjectGrade(studentId: number): SubjectGrade {
    return this.subjectGrades()[this.subjectGradeBookKey()]?.[studentId] ?? {
      homework1: null,
      homework2: null,
      composition: null,
    };
  }

  homeworkAverage(studentId: number): string {
    const average = this.homeworkAverageValue(studentId);
    return average === null ? '—' : average.toFixed(1);
  }

  subjectAverage(studentId: number): string {
    const average = this.subjectAverageValue(studentId);
    return average === null ? '—' : average.toFixed(1);
  }

  subjectAverageClass(): string {
    const averages = this.visibleStudents()
      .map((student) => this.subjectAverageValue(student.id))
      .filter((average): average is number => average !== null);
    return averages.length
      ? (averages.reduce((total, average) => total + average, 0) / averages.length).toFixed(1)
      : '—';
  }

  completedSubjectGrades(): number {
    return this.visibleStudents().filter((student) => this.subjectAverageValue(student.id) !== null).length;
  }

  collegeWeightedPoints(studentId: number): string {
    const average = this.subjectAverageValue(studentId);
    return average === null
      ? '—'
      : (average * this.selectedCollegeSubjectCoefficient()).toFixed(1);
  }

  collegeBulletinRows(studentId: number): Array<{
    subject: PrimarySubject;
    homeworkAverage: string;
    composition: string;
    average: string;
    averageValue: number | null;
    coefficient: number;
    weightedPoints: string;
  }> {
    return this.assignedCurriculumSubjects().map((subject) => {
      const grade = this.subjectGrades()[
        `${this.selectedTrimester()}::${this.selectedClassId()}::${subject.name}`
      ]?.[studentId] ?? { homework1: null, homework2: null, composition: null };
      const homeworkAverage = this.homeworkAverageForGrade(grade);
      const averageValue = this.subjectAverageForGrade(grade);
      const coefficient = this.collegeSubjectSetting(this.selectedClassId(), subject.id).coefficient ?? 1;
      return {
        subject,
        homeworkAverage: homeworkAverage === null ? '—' : homeworkAverage.toFixed(1),
        composition: grade.composition === null ? '—' : grade.composition.toFixed(1),
        average: averageValue === null ? '—' : averageValue.toFixed(1),
        averageValue,
        coefficient,
        weightedPoints: averageValue === null ? '—' : (averageValue * coefficient).toFixed(1),
      };
    });
  }

  collegeBulletinGeneralAverage(studentId: number): string {
    const rows = this.collegeBulletinRows(studentId).filter((row) => row.averageValue !== null);
    const coefficientTotal = rows.reduce((total, row) => total + row.coefficient, 0);
    if (!coefficientTotal) {
      return '—';
    }
    const weightedTotal = rows.reduce(
      (total, row) => total + (row.averageValue as number) * row.coefficient,
      0,
    );
    return (weightedTotal / coefficientTotal).toFixed(2);
  }

  collegeBulletinCoefficientTotal(studentId: number): number {
    return this.collegeBulletinRows(studentId)
      .filter((row) => row.averageValue !== null)
      .reduce((total, row) => total + row.coefficient, 0);
  }

  collegeBulletinMention(studentId: number): string {
    const average = Number(this.collegeBulletinGeneralAverage(studentId));
    if (Number.isNaN(average)) {
      return 'Non renseignée';
    }
    if (average >= 16) {
      return 'Très bien';
    }
    if (average >= 14) {
      return 'Bien';
    }
    if (average >= 12) {
      return 'Assez bien';
    }
    return average >= 10 ? 'Passable' : 'À renforcer';
  }

  openReportCardBuilder(studentId?: number): void {
    const availableStudents = this.visibleStudents();
    const requestedStudent = studentId
      ? availableStudents.find((student) => student.id === studentId)
      : availableStudents.find((student) => student.id === this.selectedReportStudentId());
    this.selectedReportStudentId.set(requestedStudent?.id ?? availableStudents[0]?.id ?? 1);
    this.reportCardBuilderOpen.set(true);
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }

  openStudentReportCard(studentId: number): void {
    this.activeView.set('reports');
    this.openReportCardBuilder(studentId);
  }

  closeReportCardBuilder(): void {
    this.reportPreviewOpen.set(false);
    this.reportCardBuilderOpen.set(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }

  toggleReportPreview(): void {
    this.reportPreviewOpen.update((isOpen) => !isOpen);
  }

  toggleReportAppreciation(appreciation: ReportAppreciation): void {
    this.selectedReportAppreciation.update((selected) =>
      selected === appreciation ? null : appreciation,
    );
  }

  reportCardStudent(): Student | undefined {
    return this.students().find((student) => student.id === this.selectedReportStudentId());
  }

  reportCardRows(category: PrimaryEvaluationComponent['category']): ReportCardRow[] {
    const student = this.reportCardStudent();
    if (!student) {
      return [];
    }
    return this.primaryEvaluationDomains.flatMap((domain) =>
      domain.components
        .filter((component) => component.category === category)
        .map((component) => ({
          domain,
          component,
          score: this.primaryEvaluationScores(student.id, domain.id, student.classId)[component.id] ?? null,
        })),
    );
  }

  reportCardCategoryTotal(category: PrimaryEvaluationComponent['category']): { earned: number; scale: number } {
    return this.reportCardRows(category).reduce(
      (total, row) => ({
        earned: total.earned + (row.score ?? 0),
        scale: total.scale + row.component.scale,
      }),
      { earned: 0, scale: 0 },
    );
  }

  reportCardGrandTotal(): PrimaryGrandTotal {
    const student = this.reportCardStudent();
    return student
      ? this.studentPrimaryGrandTotal(student)
      : { earned: 0, scale: 0, percentage: 0, hasScores: false };
  }

  reportCardAverageOnTen(): string {
    return (this.reportCardGrandTotal().percentage / 10).toFixed(1);
  }

  reportCardRank(): string {
    const ranking = this.visibleStudents()
      .map((student) => ({ student, percentage: this.studentPrimaryGrandTotal(student).percentage }))
      .sort((first, second) => second.percentage - first.percentage);
    const rank = ranking.findIndex((entry) => entry.student.id === this.selectedReportStudentId());
    return rank < 0 ? '—' : `${rank + 1}${rank === 0 ? 'er' : 'e'} / ${ranking.length}`;
  }

  reportCardMention(): string {
    const percentage = this.reportCardGrandTotal().percentage;
    if (percentage >= 85) {
      return 'Excellent';
    }
    if (percentage >= 75) {
      return 'Félicitations';
    }
    if (percentage >= 65) {
      return 'Encouragements';
    }
    if (percentage >= 50) {
      return 'Passable, peut mieux faire';
    }
    return 'Insuffisant';
  }

  selectReportTemplateSource(source: 'default' | 'custom'): void {
    if (source === 'custom' && !this.uploadedReportTemplate()) {
      return;
    }
    this.reportTemplateSource.set(source);
  }

  onReportTemplateSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('Le modèle ne doit pas dépasser 10 Mo.', 'Fermer', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      input.value = '';
      return;
    }
    const currentPreviewUrl = this.uploadedReportTemplate()?.previewUrl;
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    this.uploadedReportTemplate.set({
      name: file.name,
      type: file.type || 'Document',
      size: file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
        : `${Math.max(1, Math.round(file.size / 1024))} Ko`,
      previewUrl,
    });
    this.reportTemplateSource.set('custom');
    input.value = '';
  }

  removeReportTemplate(): void {
    const template = this.uploadedReportTemplate();
    this.requestConfirmation({
      title: 'Supprimer ce modèle de bulletin ?',
      message: `Le modèle « ${template?.name ?? 'personnalisé'} » sera supprimé et le modèle E-Scolarité redeviendra actif.`,
      confirmLabel: 'Supprimer le modèle',
      icon: 'delete_outline',
    }, () => {
      const previewUrl = this.uploadedReportTemplate()?.previewUrl;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      this.uploadedReportTemplate.set(null);
      this.reportTemplateSource.set('default');
    });
  }

  printReportCard(): void {
    window.print();
  }

  prepareClassReportCards(): void {
    this.snackBar.open(
      `${this.visibleStudents().length} bulletins sont prêts pour la génération PDF.`,
      'Fermer',
      { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
  }

  selectedEvaluationDomain(): PrimaryEvaluationDomain {
    return this.primaryEvaluationDomains.find(
      (domain) => domain.id === this.selectedEvaluationDomainId(),
    ) ?? this.primaryEvaluationDomains[0];
  }

  evaluationDomainScale(domain: PrimaryEvaluationDomain = this.selectedEvaluationDomain()): number {
    return domain.components.reduce((total, component) => total + component.scale, 0);
  }

  primaryEvaluationGrandScale(): number {
    return this.primaryEvaluationDomains.reduce(
      (total, domain) => total + this.evaluationDomainScale(domain),
      0,
    );
  }

  primaryEvaluationScore(studentId: number, componentId: string): number | null {
    return this.primaryEvaluationScores(studentId)[componentId] ?? null;
  }

  updatePrimaryEvaluationScore(studentId: number, component: PrimaryEvaluationComponent, rawValue: string): void {
    const parsed = rawValue === '' ? null : Number(rawValue);
    const score = parsed === null || Number.isNaN(parsed)
      ? null
      : Math.min(component.scale, Math.max(0, parsed));
    const gradeBookKey = this.primaryEvaluationGradeBookKey();
    this.primaryEvaluationGrades.update((gradeBooks) => ({
      ...gradeBooks,
      [gradeBookKey]: {
        ...(gradeBooks[gradeBookKey] ?? {}),
        [studentId]: {
          ...(gradeBooks[gradeBookKey]?.[studentId] ?? {}),
          [component.id]: score,
        },
      },
    }));
  }

  primaryEvaluationTotal(studentId: number): number | null {
    const scores = Object.values(this.primaryEvaluationScores(studentId))
      .filter((score): score is number => score !== null);
    return scores.length ? scores.reduce((total, score) => total + score, 0) : null;
  }

  primaryEvaluationPercentage(studentId: number): string {
    const total = this.primaryEvaluationTotal(studentId);
    return total === null
      ? '—'
      : ((total / this.evaluationDomainScale()) * 100).toFixed(1);
  }

  completedPrimaryEvaluations(): number {
    return this.visibleStudents().filter((student) => this.primaryEvaluationTotal(student.id) !== null).length;
  }

  primaryEvaluationClassAverage(): string {
    const percentages = this.visibleStudents()
      .map((student) => {
        const total = this.primaryEvaluationTotal(student.id);
        return total === null ? null : (total / this.evaluationDomainScale()) * 100;
      })
      .filter((percentage): percentage is number => percentage !== null);
    return percentages.length
      ? (percentages.reduce((total, percentage) => total + percentage, 0) / percentages.length).toFixed(1)
      : '—';
  }

  studentPrimaryDomainSummaries(student: Student): StudentPrimaryDomainSummary[] {
    return this.primaryEvaluationDomains.flatMap((domain) => {
      const scores = this.primaryEvaluationScores(student.id, domain.id, student.classId);
      const values = Object.values(scores).filter((score): score is number => score !== null);
      if (!values.length) {
        return [];
      }
      const earned = values.reduce((total, score) => total + score, 0);
      const scale = this.evaluationDomainScale(domain);
      return [{ domain, scores, earned, scale, percentage: (earned / scale) * 100 }];
    });
  }

  studentPrimaryGrandTotal(student: Student): PrimaryGrandTotal {
    const summaries = this.studentPrimaryDomainSummaries(student);
    const earned = summaries.reduce((total, summary) => total + summary.earned, 0);
    const scale = summaries.reduce((total, summary) => total + summary.scale, 0);
    return {
      earned,
      scale,
      percentage: scale ? (earned / scale) * 100 : 0,
      hasScores: summaries.length > 0,
    };
  }

  primaryEvaluationComponentSummary(summary: StudentPrimaryDomainSummary): string {
    return summary.domain.components
      .map((component) => `${component.shortLabel} ${summary.scores[component.id] ?? '—'}/${component.scale}`)
      .join(' · ');
  }

  studentSubjectGradeSummaries(student: Student): StudentSubjectGradeSummary[] {
    return this.subjects().flatMap((subject) => {
      const gradeBookKey = `${this.selectedTrimester()}::${student.classId}::${subject.name}`;
      const grade = this.subjectGrades()[gradeBookKey]?.[student.id];
      if (!grade || [grade.homework1, grade.homework2, grade.composition].every((score) => score === null)) {
        return [];
      }
      const homeworkAverage = this.homeworkAverageForGrade(grade);
      const subjectAverage = this.subjectAverageForGrade(grade);
      return subjectAverage === null
        ? []
        : [{
            subject: subject.name,
            grade,
            homeworkAverage: homeworkAverage === null ? '—' : homeworkAverage.toFixed(1),
            subjectAverage: subjectAverage.toFixed(1),
            subjectAverageValue: subjectAverage,
          }];
    });
  }

  studentAssessmentSummaries(studentId: number): StudentAssessmentSummary[] {
    return this.assessments()
      .flatMap((assessment) => {
        const result = assessment.results.find((item) => item.studentId === studentId);
        return result ? [{ assessment, result }] : [];
      })
      .sort((first, second) => second.assessment.date.localeCompare(first.assessment.date));
  }

  studentOverallAverage(student: Student): string {
    const averages = this.studentSubjectGradeSummaries(student)
      .map((summary) => summary.subjectAverageValue);
    return averages.length
      ? (averages.reduce((total, average) => total + average, 0) / averages.length).toFixed(1)
      : '—';
  }

  studentCompletedAssessmentCount(studentId: number): number {
    return this.studentAssessmentSummaries(studentId)
      .filter((summary) => summary.result.participated).length;
  }

  studentAssessmentAttachmentCount(studentId: number): number {
    return this.studentAssessmentSummaries(studentId)
      .reduce((total, summary) => total + summary.result.attachments.length, 0);
  }

  saveSubjectGrades(): void {
    this.snackBar.open(
      this.isCollege()
        ? `Les notes de ${this.selectedSubject()} ont été enregistrées.`
        : 'Les résultats du domaine ont été enregistrés.',
      'Fermer', {
      duration: 2800,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  updateGradeCalculationWeight(kind: GradeWeightKind, rawValue: string): void {
    const parsed = Number(rawValue);
    const weight = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed));
    this.gradeCalculationRule.update((rule) => ({ ...rule, [kind]: weight }));
  }

  resetGradeCalculationRule(): void {
    this.gradeCalculationRule.set({ homeworkWeight: 1, compositionWeight: 1 });
  }

  gradeCalculationDivisor(): number {
    const rule = this.gradeCalculationRule();
    return rule.homeworkWeight + rule.compositionWeight;
  }

  collectionFeeOptions(): CollectionFeeOption[] {
    const academicYear = this.selectedCollectionAcademicYear();
    const classId = this.selectedClassId();
    const classroom = this.selectedClass();
    const configuration = this.classFeeConfigurations().find(
      (item) => item.academicYear === academicYear && item.classId === classId,
    ) ?? this.defaultFeeConfiguration(classroom, academicYear);
    const baseOptions: CollectionFeeOption[] = [
      { id: 'registrationFee', label: 'Frais d’inscription', amount: configuration.registrationFee, frequency: 'Paiement unique', required: true },
      { id: 'monthlyFee', label: 'Mensualité scolaire', amount: configuration.monthlyFee, frequency: 'Mensuel', required: true },
    ];
    const options = baseOptions.filter((fee) => Number(fee.amount) > 0);

    const additionalFees = this.additionalSchoolFees()
      .filter((fee) => fee.academicYear === academicYear && fee.classId === classId)
      .map<CollectionFeeOption>((fee) => ({
        id: `additional-${fee.id}`,
        label: fee.label,
        amount: fee.amount,
        frequency: fee.frequency,
        required: fee.required,
      }));
    return [...options, ...additionalFees];
  }

  selectedCollectionFee(): CollectionFeeOption {
    return this.collectionFeeOptions().find((fee) => fee.id === this.selectedCollectionFeeId())
      ?? this.collectionFeeOptions()[0]
      ?? { id: '', label: 'Tarification', amount: '0', frequency: 'Paiement unique', required: false };
  }

  selectCollectionAcademicYear(academicYear: string): void {
    this.selectedCollectionAcademicYear.set(academicYear);
    this.ensureCollectionFeeSelection();
  }

  selectCollectionClass(classId: string): void {
    this.selectClass(classId);
    this.ensureCollectionFeeSelection();
  }

  selectCollectionFee(feeId: string): void {
    this.selectedCollectionFeeId.set(feeId);
    this.collectionUnpaidOnly.set(false);
  }

  toggleCollectionUnpaidOnly(): void {
    this.collectionUnpaidOnly.update((value) => !value);
  }

  collectionEligibleStudents(): Student[] {
    return this.visibleStudents();
  }

  collectionStudents(): Student[] {
    const students = this.collectionEligibleStudents();
    if (!this.collectionUnpaidOnly()) {
      return students;
    }
    if (this.selectedCollectionFee().frequency === 'Mensuel') {
      return students.filter((student) =>
        this.paymentMonths.some((month) => !this.monthlyPaymentDate(student.id, month)),
      );
    }
    return students.filter((student) => !this.oneTimePaymentDate(student.id));
  }

  monthlyPaymentDate(studentId: number, month: string): string | null {
    return this.monthlyPaymentRecords()[this.collectionLedgerKey()]?.[studentId]?.[month] ?? null;
  }

  toggleMonthlyPayment(studentId: number, month: string): void {
    const ledgerKey = this.collectionLedgerKey();
    const currentDate = this.monthlyPaymentDate(studentId, month);
    if (currentDate) {
      const student = this.students().find((item) => item.id === studentId);
      this.requestConfirmation({
        title: 'Annuler cet encaissement ?',
        message: `Le paiement de ${month} pour ${student?.name ?? 'cet élève'} sera annulé et apparaîtra de nouveau comme impayé.`,
        confirmLabel: 'Annuler l’encaissement',
        icon: 'undo',
        tone: 'warning',
      }, () => this.basculerEncaissement(studentId, false, this.monthPeriod(this.selectedCollectionAcademicYear(), month)));
      return;
    }
    this.basculerEncaissement(studentId, !currentDate, this.monthPeriod(this.selectedCollectionAcademicYear(), month));
  }

  oneTimePaymentDate(studentId: number): string | null {
    return this.oneTimePaymentRecords()[this.collectionLedgerKey()]?.[studentId] ?? null;
  }

  toggleOneTimePayment(studentId: number): void {
    const currentDate = this.oneTimePaymentDate(studentId);
    if (currentDate) {
      const student = this.students().find((item) => item.id === studentId);
      this.requestConfirmation({
        title: 'Annuler cet encaissement ?',
        message: `Le paiement de ${student?.name ?? 'cet élève'} sera annulé et apparaîtra de nouveau comme impayé.`,
        confirmLabel: 'Annuler l’encaissement',
        icon: 'undo',
        tone: 'warning',
      }, () => this.basculerEncaissement(studentId, false, null));
      return;
    }
    this.basculerEncaissement(studentId, !currentDate, null);
  }

  private basculerEncaissement(studentId: number, paye: boolean, periode: string | null): void {
    const context = this.financeContext(this.selectedCollectionAcademicYear());
    const student = this.students().find((item) => item.id === studentId);
    const tarifId = this.financeTariffIds.get(this.collectionLedgerKey());
    if (!context || !student?.backendId || !tarifId) {
      this.snackBar.error('Cette échéance n’est pas disponible. Réactualisez les encaissements.');
      return;
    }
    this.centralApi.basculerEncaissementEtablissement({
      ...context,
      tarif_scolaire_id: tarifId,
      eleve_id: student.backendId,
      periode,
      paye,
      mode_paiement: 'espece',
    }).subscribe({
      next: (resultat) => {
        this.chargerFinances(this.selectedCollectionAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Le paiement n’a pas pu être enregistré.'),
    });
  }

  private monthPeriod(academicYear: string, monthLabel: string): string {
    const start = this.academicYearStart(academicYear);
    const month = ({ Jan: 1, Fév: 2, Mar: 3, Avr: 4, Mai: 5, Juin: 6, Juil: 7, Août: 8, Sep: 9, Oct: 10, Nov: 11, Déc: 12 } as Record<string, number>)[monthLabel];
    const year = month >= 7 ? start : start + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  formatPaymentDate(isoDate: string | null): string {
    if (!isoDate) {
      return '—';
    }
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  monthlyStudentBalance(studentId: number): string {
    const unpaidMonths = this.paymentMonths.filter(
      (month) => !this.monthlyPaymentDate(studentId, month),
    ).length;
    return this.formatFeeAmount(String(unpaidMonths * Number(this.selectedCollectionFee().amount)));
  }

  collectionExpectedEntries(): number {
    const studentCount = this.collectionEligibleStudents().length;
    return this.selectedCollectionFee().frequency === 'Mensuel'
      ? studentCount * this.paymentMonths.length
      : studentCount;
  }

  collectionPaidEntries(): number {
    if (this.selectedCollectionFee().frequency === 'Mensuel') {
      return this.collectionEligibleStudents().reduce(
        (total, student) => total + this.paymentMonths.filter(
          (month) => Boolean(this.monthlyPaymentDate(student.id, month)),
        ).length,
        0,
      );
    }
    return this.collectionEligibleStudents().filter(
      (student) => Boolean(this.oneTimePaymentDate(student.id)),
    ).length;
  }

  collectionProgress(): number {
    const expected = this.collectionExpectedEntries();
    return expected ? Math.round((this.collectionPaidEntries() / expected) * 100) : 0;
  }

  collectionCollectedAmount(): string {
    return this.formatFeeAmount(String(this.collectionPaidEntries() * Number(this.selectedCollectionFee().amount)));
  }

  collectionOutstandingAmount(): string {
    const outstandingEntries = this.collectionExpectedEntries() - this.collectionPaidEntries();
    return this.formatFeeAmount(String(outstandingEntries * Number(this.selectedCollectionFee().amount)));
  }

  private collectionLedgerKey(): string {
    return `${this.selectedCollectionAcademicYear()}::${this.selectedClassId()}::${this.selectedCollectionFee().id}`;
  }

  private ensureCollectionFeeSelection(): void {
    const options = this.collectionFeeOptions();
    const selectedExists = options.some((fee) => fee.id === this.selectedCollectionFeeId());
    if (!selectedExists) {
      this.selectedCollectionFeeId.set(options.find((fee) => fee.id === 'monthlyFee')?.id ?? options[0]?.id ?? '');
    }
    this.collectionUnpaidOnly.set(false);
  }

  selectedExpenseType(): ExpenseType {
    return this.expenseTypes().find((type) => type.id === this.selectedExpenseTypeId())
      ?? this.expenseTypes()[0]
      ?? { id: '', label: 'Type de dépense', frequency: 'Unique', target: 'Personnel', defaultAmount: 0, active: false };
  }

  expenseTotal(): number {
    return Number(this.expenseForm.amount || 0);
  }

  isSalaryExpenseType(): boolean {
    return this.selectedExpenseTypeId() === 'staff-salary' || this.selectedExpenseTypeId() === 'teacher-salary';
  }

  private expenseTargetCode(target: ExpenseTarget): 'personnel' | 'enseignants' | 'tous' {
    return target === 'Enseignants' ? 'enseignants' : target === 'Personnel et enseignants' ? 'tous' : 'personnel';
  }

  selectExpenseType(typeId: string): void {
    this.selectedExpenseTypeId.set(typeId);
    this.expenseUnpaidOnly.set(false);
    const type = this.expenseTypes().find((item) => item.id === typeId);
    if (type) {
      this.expenseForm.frequency = type.frequency;
      this.expenseForm.amount = type.defaultAmount;
      this.expenseForm.label = type.label;
    }
  }

  openExpenseTypeEditor(): void {
    this.expenseTypeDraft = { label: '', frequency: 'Unique', target: 'Personnel', defaultAmount: 0 };
    this.expenseTypeEditorOpen.set(true);
  }

  saveExpenseType(): void {
    const label = this.expenseTypeDraft.label.trim();
    if (!label) {
      return;
    }
    const context = this.financeContext(this.selectedExpenseAcademicYear());
    if (!context) return;
    this.centralApi.enregistrerTypeDepenseEtablissement({
      type_etablissement: context['type_etablissement'],
      campus_id: context['campus_id'],
      libelle: label,
      frequence: this.expenseTypeDraft.frequency === 'Mensuel' ? 'mensuel' : 'unique',
      cible: this.expenseTargetCode(this.expenseTypeDraft.target),
      montant_provisoire: this.expenseTypeDraft.defaultAmount || null,
    }).subscribe({
      next: (resultat) => {
        this.expenseTypeEditorOpen.set(false);
        this.chargerFinances(this.selectedExpenseAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Le type de dépense n’a pas pu être ajouté.'),
    });
  }

  updateExpenseType(typeId: string, field: 'frequency' | 'target' | 'defaultAmount', value: string | number): void {
    const type = this.expenseTypes().find((item) => item.id === typeId);
    const context = this.financeContext(this.selectedExpenseAcademicYear());
    if (!type?.backendId || !context) return;
    const updated: ExpenseType = { ...type, [field]: field === 'defaultAmount' ? Number(value) : value } as ExpenseType;
    this.expenseTypes.update((types) => types.map((item) => item.id === typeId ? updated : item));
    this.centralApi.enregistrerTypeDepenseEtablissement({
      type_etablissement: context['type_etablissement'],
      campus_id: context['campus_id'],
      libelle: updated.label,
      frequence: updated.frequency === 'Mensuel' ? 'mensuel' : 'unique',
      cible: this.expenseTargetCode(updated.target),
      montant_provisoire: updated.defaultAmount || null,
    }, type.backendId).subscribe({
      next: () => undefined,
      error: (response) => {
        this.chargerFinances(this.selectedExpenseAcademicYear());
        this.snackBar.error(response.error?.message ?? 'La modification n’a pas pu être enregistrée.');
      },
    });
  }

  removeExpenseType(typeId: string): void {
    if (typeId === 'staff-salary' || typeId === 'teacher-salary') {
      this.snackBar.open('Les types par défaut peuvent être modifiés mais pas supprimés.', 'Fermer', { duration: 3000 });
      return;
    }
    const type = this.expenseTypes().find((item) => item.id === typeId);
    const context = this.financeContext(this.selectedExpenseAcademicYear());
    if (!type?.backendId || !context) return;
    this.requestConfirmation({
      title: 'Supprimer ce type de dépense ?',
      message: `Le type « ${type.label} » sera définitivement supprimé de la configuration.`,
      confirmLabel: 'Supprimer le type',
      icon: 'delete_outline',
    }, () => {
      this.centralApi.supprimerTypeDepenseEtablissement(type.backendId as string, context['type_etablissement'], context['campus_id']).subscribe({
        next: (resultat) => {
          if (this.selectedExpenseTypeId() === typeId) this.selectedExpenseTypeId.set('staff-salary');
          this.chargerFinances(this.selectedExpenseAcademicYear());
          this.snackBar.success(resultat.message);
        },
        error: (response) => this.snackBar.error(response.error?.message ?? 'Le type de dépense n’a pas pu être supprimé.'),
      });
    });
  }

  selectExpensePeriod(period: string): void {
    this.selectedExpensePeriod.set(period);
    this.expenseUnpaidOnly.set(false);
  }

  expensePeriodOptions(): Array<{ value: string; label: string }> {
    return this.paymentMonths.map((month) => {
      const value = this.monthPeriod(this.selectedExpenseAcademicYear(), month);
      const date = new Date(`${value}-01T00:00:00`);
      return { value, label: new Intl.DateTimeFormat('fr-SN', { month: 'long', year: 'numeric' }).format(date) };
    });
  }

  selectExpenseAcademicYear(academicYear: string): void {
    this.selectedExpenseAcademicYear.set(academicYear);
    this.expenseUnpaidOnly.set(false);
  }

  toggleExpenseUnpaidOnly(): void {
    this.expenseUnpaidOnly.update((value) => !value);
  }

  filteredExpenses(): SchoolExpense[] {
    return this.expenseEntriesForSelection().filter((item) => !this.expenseUnpaidOnly() || item.status !== 'Payée');
  }

  expenseEntriesForSelection(): SchoolExpense[] {
    return this.expenses().filter((item) => item.typeId === this.selectedExpenseTypeId() && item.date.startsWith(this.selectedExpensePeriod()));
  }

  salaryPeople(): ExpensePayee[] {
    const campusId = this.selectedCampusId();
    const target = this.selectedExpenseType().target;
    const teachers = target === 'Enseignants' || target === 'Personnel et enseignants'
      ? this.teachers().filter((person) => person.campusId === campusId && person.backendId).map((person) => ({ key: person.backendId as string, backendId: person.backendId as string, name: person.name, reference: person.matricule, role: `Enseignant · ${person.subject}`, salary: Number(person.salary || 0), salaryMode: person.salaryMode ?? 'Mensuel' as TeacherSalaryMode, hourlyRate: Number(person.hourlyRate || 0) }))
      : [];
    const staff = target === 'Personnel' || target === 'Personnel et enseignants'
      ? this.schoolStaff().filter((person) => person.campusId === campusId && person.backendId).map((person) => ({ key: person.backendId as string, backendId: person.backendId as string, name: person.name, reference: person.matricule, role: person.function, salary: Number(person.salary || 0), salaryMode: 'Mensuel' as TeacherSalaryMode, hourlyRate: 0 }))
      : [];
    return [...teachers, ...staff].sort((a, b) => a.name.localeCompare(b.name));
  }

  visibleSalaryPeople(): ExpensePayee[] {
    const people = this.salaryPeople();
    if (!this.expenseUnpaidOnly()) return people;
    return this.selectedExpenseType().frequency === 'Mensuel'
      ? people.filter((person) => this.paymentMonths.some((month) => !this.expensePersonPaymentDate(person, month)))
      : people.filter((person) => !this.expensePersonPaymentDate(person));
  }

  private expenseRecord(person: ExpensePayee, month?: string): SchoolExpense | undefined {
    const periode = month ? this.monthPeriod(this.selectedExpenseAcademicYear(), month) : this.selectedExpensePeriod();
    return this.expenses().find((expense) =>
      expense.typeId === this.selectedExpenseTypeId()
      && expense.personnelId === person.backendId
      && expense.date.startsWith(periode),
    );
  }

  expensePersonPaymentDate(person: ExpensePayee, month?: string): string | null {
    if (this.isSalaryExpenseType() && month) return this.salaryMonthlyPaymentDate(person.key, month);
    const expense = this.expenseRecord(person, month);
    return expense?.status === 'Payée' ? expense.paymentDate ?? expense.date : null;
  }

  expensePersonAmount(person: ExpensePayee, month?: string): number {
    return this.isSalaryExpenseType()
      ? this.salaryMonthlyAmount(person, month ?? this.paymentMonths[0])
      : this.selectedExpenseType().defaultAmount;
  }

  toggleExpensePersonPayment(person: ExpensePayee, month?: string): void {
    if (this.isSalaryExpenseType()) {
      this.toggleSalaryMonthlyPayment(person.key, month ?? this.paymentMonths[0]);
      return;
    }
    const amount = this.expensePersonAmount(person, month);
    if (amount <= 0) {
      this.snackBar.error('Configurez d’abord un montant provisoire supérieur à zéro pour ce type de dépense.');
      return;
    }
    const context = this.financeContext(this.selectedExpenseAcademicYear());
    if (!context) return;
    const record = this.expenseRecord(person, month);
    if (record) {
      const paye = record.status !== 'Payée';
      if (!paye) {
        const periodLabel = month ? ` pour ${month}` : '';
        this.requestConfirmation({
          title: 'Annuler cette dépense ?',
          message: `Le paiement de ${this.selectedExpenseType().label}${periodLabel} pour ${person.name} sera annulé.`,
          confirmLabel: 'Annuler la dépense',
          icon: 'undo',
          tone: 'warning',
        }, () => this.basculerDepensePersonne(record.id, context, false));
        return;
      }
      this.basculerDepensePersonne(record.id, context, true);
      return;
    }
    const periode = month ? this.monthPeriod(this.selectedExpenseAcademicYear(), month) : this.selectedExpensePeriod();
    this.centralApi.enregistrerDepenseEtablissement({
      ...context,
      type_depense_id: this.selectedExpenseType().backendId,
      personnel_id: person.backendId,
      libelle: this.selectedExpenseType().label,
      montant: amount,
      date: `${periode}-01`,
      statut: 'payee',
      mode_paiement: 'espece',
    }).subscribe({
      next: (resultat) => {
        this.chargerFinances(this.selectedExpenseAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Le paiement n’a pas pu être enregistré.'),
    });
  }

  private basculerDepensePersonne(
    expenseId: string | number,
    context: Record<string, string>,
    paye: boolean,
  ): void {
    this.centralApi.basculerDepenseEtablissement(String(expenseId), { ...context, paye }).subscribe({
        next: (resultat) => {
          this.chargerFinances(this.selectedExpenseAcademicYear());
          this.snackBar.success(resultat.message);
        },
        error: (response) => this.snackBar.error(response.error?.message ?? 'Le paiement n’a pas pu être modifié.'),
      });
  }

  salaryMonthlyPaymentDate(personKey: string, month: string): string | null {
    return this.salaryPaymentRecords()[`${this.selectedExpenseAcademicYear()}::${personKey}::${month}`] ?? null;
  }

  salaryMonthlyHours(person: ExpensePayee, month: string): number {
    if (person.salaryMode !== 'Horaire') return 0;
    return this.salaryHourRecords()[`${this.selectedExpenseAcademicYear()}::${person.key}::${month}`] ?? 0;
  }

  updateSalaryMonthlyHours(person: ExpensePayee, month: string, value: string | number): void {
    const hours = Math.max(0, Number(value) || 0);
    const key = `${this.selectedExpenseAcademicYear()}::${person.key}::${month}`;
    this.salaryHourRecords.update((records) => ({ ...records, [key]: hours }));
  }

  salaryMonthlyAmount(person: ExpensePayee, month: string): number {
    return person.salaryMode === 'Horaire'
      ? this.salaryMonthlyHours(person, month) * person.hourlyRate
      : person.salary;
  }

  salaryMonthlyAmountLabel(person: ExpensePayee, month: string): string {
    return this.formatExpenseAmount(this.salaryMonthlyAmount(person, month));
  }

  toggleSalaryMonthlyPayment(personKey: string, month: string): void {
    const person = this.salaryPeople().find((item) => item.key === personKey);
    const key = `${this.selectedExpenseAcademicYear()}::${personKey}::${month}`;
    const paye = !this.salaryPaymentRecords()[key];
    if (person && !paye) {
      this.requestConfirmation({
        title: 'Annuler ce paiement de salaire ?',
        message: `Le salaire de ${person.name} pour ${month} sera marqué comme impayé.`,
        confirmLabel: 'Annuler le paiement',
        icon: 'undo',
        tone: 'warning',
      }, () => this.basculerSalaireMensuel(person, month, false));
      return;
    }
    if (person?.salaryMode === 'Horaire' && this.salaryMonthlyHours(person, month) <= 0) {
      this.snackBar.open('Renseignez les heures effectuées avant de marquer ce salaire comme payé.', 'Fermer', { duration: 3200 });
      return;
    }
    if (!person) return;
    this.basculerSalaireMensuel(person, month, true);
  }

  private basculerSalaireMensuel(person: ExpensePayee, month: string, paye: boolean): void {
    const context = this.financeContext(this.selectedExpenseAcademicYear());
    if (!context) return;
    this.centralApi.basculerPaieEtablissement({
      ...context,
      personnel_id: person.backendId,
      periode: this.monthPeriod(this.selectedExpenseAcademicYear(), month),
      nombre_heures: person.salaryMode === 'Horaire' ? this.salaryMonthlyHours(person, month) : null,
      paye,
    }).subscribe({
      next: (resultat) => {
        this.chargerFinances(this.selectedExpenseAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Le paiement du salaire n’a pas pu être enregistré.'),
    });
  }

  salaryMonthlyBalance(person: ExpensePayee): string {
    const outstanding = this.paymentMonths.reduce((total, month) => total + (this.salaryMonthlyPaymentDate(person.key, month) ? 0 : this.salaryMonthlyAmount(person, month)), 0);
    return this.formatExpenseAmount(outstanding);
  }

  expensePersonBalance(person: ExpensePayee): string {
    const outstanding = this.paymentMonths.reduce((total, month) =>
      total + (this.expensePersonPaymentDate(person, month) ? 0 : this.expensePersonAmount(person, month)), 0);
    return this.formatExpenseAmount(outstanding);
  }

  expenseExpectedEntries(): number {
    return this.salaryPeople().length * (this.selectedExpenseType().frequency === 'Mensuel' ? this.paymentMonths.length : 1);
  }

  expensePaidEntries(): number {
    return this.selectedExpenseType().frequency === 'Mensuel'
      ? this.salaryPeople().reduce((total, person) => total + this.paymentMonths.filter((month) => Boolean(this.expensePersonPaymentDate(person, month))).length, 0)
      : this.salaryPeople().filter((person) => Boolean(this.expensePersonPaymentDate(person))).length;
  }

  expenseSelectedTotal(): number {
    return this.salaryPeople().reduce((total, person) => total + (this.selectedExpenseType().frequency === 'Mensuel'
      ? this.paymentMonths.reduce((personTotal, month) => personTotal + this.expensePersonAmount(person, month), 0)
      : this.expensePersonAmount(person)), 0);
  }

  expenseSelectedPaidTotal(): number {
    return this.salaryPeople().reduce((total, person) => total + (this.selectedExpenseType().frequency === 'Mensuel'
      ? this.paymentMonths.reduce((personTotal, month) => personTotal + (this.expensePersonPaymentDate(person, month) ? this.expensePersonAmount(person, month) : 0), 0)
      : this.expensePersonPaymentDate(person) ? this.expensePersonAmount(person) : 0), 0);
  }

  expenseProgress(): number {
    const expected = this.expenseExpectedEntries();
    return expected ? Math.round((this.expensePaidEntries() / expected) * 100) : 0;
  }

  startExpenseRegistration(): void {
    this.expenseForm = this.createEmptyExpenseForm();
    this.selectExpenseType(this.selectedExpenseTypeId());
    this.expenseForm.date = `${this.selectedExpensePeriod()}-01`;
    this.expenseEditorOpen.set(true);
  }

  closeExpenseEditor(): void {
    this.expenseEditorOpen.set(false);
  }

  saveExpense(): void {
    const type = this.selectedExpenseType();
    const amount = this.expenseTotal();
    if (!this.expenseForm.label.trim() || amount <= 0) {
      this.snackBar.open('Renseignez un libellé et un montant supérieur à zéro.', 'Fermer', { duration: 3000 });
      return;
    }
    const context = this.financeContext(this.selectedExpenseAcademicYear());
    if (!type.backendId || !context) return;
    this.centralApi.enregistrerDepenseEtablissement({
      ...context,
      type_depense_id: type.backendId,
      libelle: this.expenseForm.label.trim(),
      beneficiaire: this.expenseForm.beneficiary.trim() || null,
      montant: amount,
      date: this.expenseForm.date,
      statut: this.expenseForm.status === 'Payée' ? 'payee' : this.expenseForm.status === 'Brouillon' ? 'brouillon' : 'prevue',
      mode_paiement: 'espece',
      notes: this.expenseForm.notes.trim() || null,
    }).subscribe({
      next: (resultat) => {
        this.expenseEditorOpen.set(false);
        this.chargerFinances(this.selectedExpenseAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'La dépense n’a pas pu être enregistrée.'),
    });
  }

  markExpensePaid(expense: SchoolExpense): void {
    const context = this.financeContext(this.selectedExpenseAcademicYear());
    if (!context) return;
    const paye = expense.status !== 'Payée';
    if (!paye) {
      this.requestConfirmation({
        title: 'Annuler cette dépense ?',
        message: `Le paiement « ${expense.label} » sera annulé et replacé parmi les dépenses à payer.`,
        confirmLabel: 'Annuler la dépense',
        icon: 'undo',
        tone: 'warning',
      }, () => this.basculerDepenseDepuisRegistre(expense.id, context, false));
      return;
    }
    this.basculerDepenseDepuisRegistre(expense.id, context, true);
  }

  private basculerDepenseDepuisRegistre(
    expenseId: string | number,
    context: Record<string, string>,
    paye: boolean,
  ): void {
    this.centralApi.basculerDepenseEtablissement(String(expenseId), { ...context, paye }).subscribe({
      next: (resultat) => {
        this.chargerFinances(this.selectedExpenseAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Le paiement de la dépense n’a pas pu être modifié.'),
    });
  }

  formatExpenseAmount(amount: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(amount)} F CFA`;
  }

  expenseTotalByFrequency(frequency: ExpenseFrequency | null = null, paidOnly = false): number {
    return this.expenses().filter((item) => (!frequency || item.frequency === frequency) && (!paidOnly || item.status === 'Payée')).reduce((total, item) => total + item.amount, 0);
  }

  expenseCountByStatus(paidOnly: boolean): number {
    return this.expenses().filter((item) => paidOnly ? item.status === 'Payée' : item.status !== 'Payée').length;
  }

  formatStaffSalary(salary: string): string {
    return this.formatExpenseAmount(Number(salary));
  }

  financeReasonOptions(): string[] {
    return [...new Set([
      'Mensualité',
      'Inscription',
      ...this.additionalSchoolFees().map((fee) => fee.label),
      ...this.expenseTypes().map((type) => type.label),
    ])];
  }

  financeReasonsForDirection(direction: FinanceDirection): string[] {
    return direction === 'Entrée' ? ['Autre encaissement'] : ['Autre dépense'];
  }

  filteredFinanceEntries(): FinanceEntry[] {
    return this.financeEntries()
      .filter((entry) => entry.campusId === this.selectedCampusId())
      .filter((entry) => this.selectedFinancePeriod() === 'all' || entry.date.startsWith(this.selectedFinancePeriod()))
      .filter((entry) => this.selectedFinanceDirection() === 'Tous' || entry.direction === this.selectedFinanceDirection())
      .filter((entry) => this.selectedFinanceReason() === 'all' || entry.reason === this.selectedFinanceReason())
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
  }

  financePeriods(): Array<{ value: string; label: string }> {
    const academicYearStart = this.academicYearStart(this.selectedFinanceAcademicYear());
    const months = [
      { month: 7, label: 'Juillet' }, { month: 8, label: 'Août' }, { month: 9, label: 'Septembre' },
      { month: 10, label: 'Octobre' }, { month: 11, label: 'Novembre' }, { month: 12, label: 'Décembre' },
      { month: 1, label: 'Janvier' }, { month: 2, label: 'Février' }, { month: 3, label: 'Mars' },
      { month: 4, label: 'Avril' }, { month: 5, label: 'Mai' }, { month: 6, label: 'Juin' },
    ];
    return [{ value: 'all', label: 'Toute l’année' }, ...months.map(({ month, label }) => {
      const year = month >= 7 ? academicYearStart : academicYearStart + 1;
      return { value: `${year}-${String(month).padStart(2, '0')}`, label: `${label} ${year}` };
    })];
  }

  financePeriodLabel(): string {
    return this.financePeriods().find((period) => period.value === this.selectedFinancePeriod())?.label ?? this.selectedFinancePeriod();
  }

  financeTotal(direction: FinanceDirection): number {
    return this.filteredFinanceEntries().filter((entry) => entry.direction === direction && entry.status === 'Validée').reduce((total, entry) => total + entry.amount, 0);
  }

  financeBalance(): number {
    return this.financeTotal('Entrée') - this.financeTotal('Sortie');
  }

  financePendingCount(): number {
    return this.filteredFinanceEntries().filter((entry) => entry.status === 'En attente').length;
  }

  selectFinancePeriod(period: string): void {
    this.selectedFinancePeriod.set(period);
  }

  selectFinanceAcademicYear(academicYear: string): void {
    this.selectedFinanceAcademicYear.set(academicYear);
    this.selectedFinancePeriod.set('all');
  }

  selectFinanceDirection(direction: 'Tous' | FinanceDirection): void {
    this.selectedFinanceDirection.set(direction);
  }

  selectFinanceReason(reason: string): void {
    this.selectedFinanceReason.set(reason);
  }

  openFinanceEntryEditor(): void {
    this.financeEntryForm = this.createEmptyFinanceEntryForm();
    if (this.selectedFinancePeriod() !== 'all') this.financeEntryForm.date = `${this.selectedFinancePeriod()}-01`;
    this.financeEditorOpen.set(true);
  }

  closeFinanceEntryEditor(): void {
    this.financeEditorOpen.set(false);
  }

  changeFinanceFormDirection(direction: FinanceDirection): void {
    this.financeEntryForm.direction = direction;
    this.financeEntryForm.reason = this.financeReasonsForDirection(direction)[0];
  }

  saveFinanceEntry(): void {
    const form = this.financeEntryForm;
    if (!form.reason || form.amount <= 0 || !form.thirdParty.trim()) {
      this.snackBar.open('Renseignez le motif, le montant et le tiers concerné.', 'Fermer', { duration: 3000 });
      return;
    }
    const context = this.financeContext(this.selectedFinanceAcademicYear());
    if (!context) return;
    this.centralApi.enregistrerOperationFinanciereEtablissement({
      ...context,
      sens: form.direction === 'Entrée' ? 'entree' : 'sortie',
      motif: form.reason,
      montant: Number(form.amount),
      date: form.date,
      mode_paiement: this.paymentMethodCode(form.paymentMethod),
      tiers: form.thirdParty.trim() || null,
      reference: form.reference.trim() || null,
      statut: form.status === 'Validée' ? 'validee' : 'en_attente',
      notes: form.notes.trim() || null,
    }).subscribe({
      next: (resultat) => {
        this.financeEditorOpen.set(false);
        this.chargerFinances(this.selectedFinanceAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'L’opération financière n’a pas pu être enregistrée.'),
    });
  }

  toggleFinanceEntryStatus(entry: FinanceEntry): void {
    const nextStatus: FinanceStatus = entry.status === 'Validée' ? 'Annulée' : 'Validée';
    const context = this.financeContext(this.selectedFinanceAcademicYear());
    if (!context) return;
    if (nextStatus === 'Annulée') {
      this.requestConfirmation({
        title: 'Annuler cette opération ?',
        message: `L’opération ${entry.reference || entry.reason} d’un montant de ${this.formatExpenseAmount(entry.amount)} sera annulée.`,
        confirmLabel: 'Annuler l’opération',
        icon: 'undo',
        tone: 'warning',
      }, () => this.basculerStatutOperationFinanciere(entry, context, nextStatus));
      return;
    }
    this.basculerStatutOperationFinanciere(entry, context, nextStatus);
  }

  private basculerStatutOperationFinanciere(
    entry: FinanceEntry,
    context: Record<string, string>,
    nextStatus: FinanceStatus,
  ): void {
    this.centralApi.basculerOperationFinanciereEtablissement(String(entry.id), {
      ...context,
      statut: nextStatus === 'Validée' ? 'validee' : 'annulee',
    }).subscribe({
      next: (resultat) => {
        this.chargerFinances(this.selectedFinanceAcademicYear());
        this.snackBar.success(resultat.message);
      },
      error: (response) => this.snackBar.error(response.error?.message ?? 'Le statut de l’opération n’a pas pu être modifié.'),
    });
  }

  private createEmptyFinanceEntryForm(): FinanceEntryForm {
    return { direction: 'Entrée', reason: 'Autre encaissement', amount: 0, date: this.currentIsoDate(), paymentMethod: 'Espèces', thirdParty: '', reference: '', status: 'Validée', notes: '' };
  }

  private createEmptyExpenseForm(): ExpenseFormModel {
    return { id: null, typeId: 'staff-salary', label: 'Nouvelle dépense', frequency: 'Unique', amount: 0, date: this.currentIsoDate(), status: 'Prévue', beneficiary: '', notes: '' };
  }

  private currentIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  buildAssessmentResults(
    scores: Array<number | null>,
    attachmentStudentIds: number[] = [],
    scale = 20,
  ): AssessmentResult[] {
    return scores.map((score, index) => {
      const studentId = index + 1;
      const percentage = score === null ? null : (score / scale) * 100;
      const appreciation = score === null
        ? ''
        : (percentage as number) >= 80
          ? 'Très bonne maîtrise des compétences évaluées.'
          : (percentage as number) >= 70
            ? 'Bon travail, continue tes efforts.'
            : (percentage as number) >= 50
              ? 'Ensemble satisfaisant, quelques notions à consolider.'
              : 'Des difficultés persistent ; une remédiation est recommandée.';
      return {
        studentId,
        participated: score !== null,
        score,
        appreciation,
        attachments: attachmentStudentIds.includes(studentId)
          ? [{
              id: `copy-${studentId}`,
              name: `copie-eleve-${studentId}.pdf`,
              size: `${(0.8 + studentId / 10).toFixed(1)} Mo`,
            }]
          : [],
      };
    });
  }

  private subjectGradeBookKey(): string {
    return `${this.selectedTrimester()}::${this.selectedClassId()}::${this.selectedSubject()}`;
  }

  private primaryEvaluationGradeBookKey(
    domainId = this.selectedEvaluationDomainId(),
    classId = this.selectedClassId(),
  ): string {
    return `${this.selectedTrimester()}::${classId}::${domainId}`;
  }

  private primaryEvaluationScores(
    studentId: number,
    domainId = this.selectedEvaluationDomainId(),
    classId = this.selectedClassId(),
  ): PrimaryEvaluationScores {
    return this.primaryEvaluationGrades()[
      this.primaryEvaluationGradeBookKey(domainId, classId)
    ]?.[studentId] ?? {};
  }

  private homeworkAverageValue(studentId: number): number | null {
    return this.homeworkAverageForGrade(this.subjectGrade(studentId));
  }

  private homeworkAverageForGrade(grade: SubjectGrade): number | null {
    const homeworkScores = [grade.homework1, grade.homework2]
      .filter((score): score is number => score !== null);
    return homeworkScores.length
      ? homeworkScores.reduce((total, score) => total + score, 0) / homeworkScores.length
      : null;
  }

  private subjectAverageValue(studentId: number): number | null {
    return this.subjectAverageForGrade(this.subjectGrade(studentId));
  }

  private subjectAverageForGrade(grade: SubjectGrade): number | null {
    const homeworkAverage = this.homeworkAverageForGrade(grade);
    if (grade.composition !== null && homeworkAverage === null) {
      return grade.composition;
    }
    if (grade.composition !== null && homeworkAverage !== null) {
      const rule = this.gradeCalculationRule();
      return (
        homeworkAverage * rule.homeworkWeight +
        grade.composition * rule.compositionWeight
      ) / this.gradeCalculationDivisor();
    }
    return homeworkAverage;
  }
}
