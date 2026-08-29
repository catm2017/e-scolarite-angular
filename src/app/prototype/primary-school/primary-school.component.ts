import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
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

type AttendanceStatus = 'P' | 'A' | 'R';
type SubjectGradeKind = 'homework1' | 'homework2' | 'composition';
type GradeWeightKind = 'homeworkWeight' | 'compositionWeight';
type GuardianMode = 'existing' | 'new';
type PortalAccountStatus = 'Actif' | 'Invitation envoyée' | 'Non créé' | 'Désactivé';
type StudentRecordTab = 'identity' | 'schooling' | 'payments' | 'attendance' | 'access';
type TeacherRecordTab = 'profile' | 'teaching' | 'timetable' | 'salaries' | 'access';
type GuardianRecordTab = 'identity' | 'children' | 'access';
type TeacherSalaryMode = 'Mensuel' | 'Horaire';
type SessionStatus = 'Planifiée' | 'À compléter' | 'Terminée';
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
  id: number;
  code: string;
  label: string;
}

interface TrimesterSetting {
  id: number;
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
  schoolUniformFee: string;
  sportsUniformFee: string;
}

type AdditionalFeeFrequency = 'Paiement unique' | 'Mensuel';

type ExpenseFrequency = 'Unique' | 'Mensuel';

interface ExpenseType {
  id: string;
  label: string;
  frequency: ExpenseFrequency;
  defaultAmount: number;
  active: boolean;
}

interface SchoolExpense {
  id: number;
  typeId: string;
  label: string;
  category: string;
  frequency: ExpenseFrequency;
  amount: number;
  date: string;
  status: 'Prévue' | 'Payée' | 'Brouillon';
  beneficiary: string;
  staffIds: number[];
  notes: string;
}

interface ExpenseFormModel {
  id: number | null;
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
  id: number;
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
  id: number;
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
type EnrollmentOperation = 'registration' | 'transfer';

interface PrimarySubject {
  id: number;
  name: string;
  code: string;
  domain: string;
  scale: number;
  levels: string[];
  teachers: number;
  color: string;
}

interface SubjectFormModel {
  id: number | null;
  name: string;
  code: string;
  domain: string;
  scale: number;
  levels: string[];
  color: string;
}

type CurriculumPeriod = '' | 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
type CurriculumLessonStatus = 'À faire' | 'En cours' | 'Terminée';

interface CurriculumLesson {
  id: string;
  title: string;
  estimatedSessions: number;
  status: CurriculumLessonStatus;
}

interface CurriculumChapter {
  id: string;
  classId: string;
  subjectId: number;
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
  private readonly snackBar = inject(MatSnackBar);

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
  readonly enrollmentOperation = signal<EnrollmentOperation>('registration');
  readonly enrollmentSourceClassId = signal('unassigned');
  readonly enrollmentTargetClassId = signal('cm2-a-km');
  readonly enrollmentSelectedStudentIds = signal<number[]>([]);
  readonly studentImportOpen = signal(false);
  readonly studentImportFile = signal<File | null>(null);
  readonly selectedRoomId = signal('room-11-km');
  readonly selectedAcademicYear = this.workspace.selectedAcademicYear;
  readonly selectedTrimester = this.workspace.selectedPeriod;
  readonly selectedSubject = signal('Mathématiques');
  schoolYearSettings = {
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
  readonly feeEditorOpen = signal(false);
  readonly classFeeConfigurations = signal<ClassFeeConfiguration[]>([]);
  readonly additionalSchoolFees = signal<AdditionalSchoolFee[]>([
    { id: 1, academicYear: '2026–2027', classId: 'cm2-a-km', label: 'Frais d’examen', amount: '10000', frequency: 'Paiement unique', required: true },
    { id: 3, academicYear: '2025–2026', classId: 'cm2-a-km', label: 'Frais d’examen', amount: '7500', frequency: 'Paiement unique', required: true },
  ]);
  additionalFeeForm: AdditionalFeeFormModel = {
    classId: 'cm2-a-km',
    label: '',
    amount: '',
    frequency: 'Paiement unique',
    required: false,
  };
  readonly paymentMonths = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  readonly selectedCollectionAcademicYear = signal(this.currentFeeAcademicYear);
  readonly selectedCollectionFeeId = signal('monthlyFee');
  readonly collectionUnpaidOnly = signal(false);
  readonly expenseEditorOpen = signal(false);
  readonly selectedExpenseTypeId = signal('staff-salary');
  readonly selectedExpensePeriod = signal('2026-08');
  readonly selectedExpenseAcademicYear = signal(this.currentFeeAcademicYear);
  readonly expensePeriods = [
    { value: '2026-07', label: 'Juillet 2026' },
    { value: '2026-08', label: 'Août 2026' },
    { value: '2026-09', label: 'Septembre 2026' },
  ];
  readonly expenseUnpaidOnly = signal(false);
  readonly expenseTypes = signal<ExpenseType[]>([
    { id: 'staff-salary', label: 'Salaire du personnel', frequency: 'Mensuel', defaultAmount: 0, active: true },
    { id: 'teacher-salary', label: 'Salaire des enseignants', frequency: 'Mensuel', defaultAmount: 0, active: true },
  ]);
  readonly expenseTypeEditorOpen = signal(false);
  expenseTypeDraft: Pick<ExpenseType, 'label' | 'frequency' | 'defaultAmount'> = { label: '', frequency: 'Unique', defaultAmount: 0 };
  readonly expenses = signal<SchoolExpense[]>([
    { id: 1, typeId: 'custom-internet', label: 'Abonnement internet · août', category: '', frequency: 'Mensuel', amount: 35000, date: '2026-08-10', status: 'Payée', beneficiary: 'Fournisseur internet', staffIds: [], notes: '' },
  ]);
  readonly salaryPaymentRecords = signal<Record<string, string | null>>({
    '2026–2027::teacher-1::Oct': '2026-10-30',
    '2026–2027::teacher-2::Oct': '2026-10-30',
    '2026–2027::staff-1::Oct': '2026-10-30',
  });
  readonly salaryHourRecords = signal<Record<string, number>>({
    '2026–2027::teacher-4::Oct': 42,
  });
  expenseForm: ExpenseFormModel = this.createEmptyExpenseForm();
  readonly financeEntries = signal<FinanceEntry[]>([
    { id: 1, campusId: 'keur-massar', amount: 35000, reason: 'Mensualité', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Wave', thirdParty: 'Aïssatou Ndiaye · CM2 A', reference: 'ENC-260821-014', status: 'Validée', source: 'Encaissements', notes: 'Mensualité août' },
    { id: 2, campusId: 'keur-massar', amount: 50000, reason: 'Inscription', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Espèces', thirdParty: 'Mamadou Diallo · CI A', reference: 'ENC-260821-013', status: 'Validée', source: 'Encaissements', notes: 'Inscription 2026–2027' },
    { id: 3, campusId: 'keur-massar', amount: 325000, reason: 'Salaires du personnel', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Moussa Kane', reference: 'DEC-260820-008', status: 'Validée', source: 'Dépenses', notes: 'Salaire août' },
    { id: 4, campusId: 'keur-massar', amount: 118500, reason: 'Facture d’électricité', direction: 'Sortie', date: '2026-08-16', paymentMethod: 'Virement', thirdParty: 'Senelec', reference: 'DEC-260816-006', status: 'Validée', source: 'Dépenses', notes: 'Compteur principal' },
    { id: 5, campusId: 'keur-massar', amount: 25000, reason: 'Tenue scolaire', direction: 'Entrée', date: '2026-08-15', paymentMethod: 'Orange Money', thirdParty: 'Fatou Sarr · CE1 A', reference: 'ENC-260815-041', status: 'Validée', source: 'Encaissements', notes: '' },
    { id: 6, campusId: 'keur-massar', amount: 78500, reason: 'Facture d’eau', direction: 'Sortie', date: '2026-08-18', paymentMethod: 'Chèque', thirdParty: 'Sen’Eau', reference: 'DEC-260818-007', status: 'En attente', source: 'Dépenses', notes: 'En attente de signature' },
    { id: 7, campusId: 'keur-massar', amount: 35000, reason: 'Mensualité', direction: 'Entrée', date: '2026-08-14', paymentMethod: 'Espèces', thirdParty: 'Ibrahima Fall · CM2 A', reference: 'ENC-260814-038', status: 'Validée', source: 'Encaissements', notes: '' },
    { id: 8, campusId: 'keur-massar', amount: 450000, reason: 'Loyer des locaux', direction: 'Sortie', date: '2026-08-01', paymentMethod: 'Virement', thirdParty: 'Bailleur du campus', reference: 'DEC-260801-001', status: 'Validée', source: 'Dépenses', notes: 'Loyer août' },
    { id: 9, campusId: 'keur-massar', amount: 40000, reason: 'Mensualité', direction: 'Entrée', date: '2026-07-29', paymentMethod: 'Wave', thirdParty: 'Mariama Ba · CM1 A', reference: 'ENC-260729-112', status: 'Validée', source: 'Encaissements', notes: 'Mensualité juillet' },
    { id: 10, campusId: 'plateau', amount: 330000, reason: 'Salaires du personnel', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Mame Sow', reference: 'DEC-260820-009', status: 'Validée', source: 'Dépenses', notes: '' },
  ]);
  readonly selectedFinanceAcademicYear = signal(this.currentFeeAcademicYear);
  readonly selectedFinancePeriod = signal('2026-08');
  readonly selectedFinanceDirection = signal<'Tous' | FinanceDirection>('Tous');
  readonly selectedFinanceReason = signal('all');
  readonly financeSearch = signal('');
  readonly financeEditorOpen = signal(false);
  financeEntryForm: FinanceEntryForm = this.createEmptyFinanceEntryForm();
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
  readonly classCurriculumOpen = signal(false);
  readonly selectedCurriculumSubjectId = signal<number | null>(1);
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

  readonly campuses: Campus[] = [
    {
      id: 'keur-massar',
      name: 'Campus Keur Massar',
      shortName: 'Keur Massar',
      learners: 326,
      classes: 8,
      teachers: 17,
      attendance: '95,4%',
      collected: '5,8 M F',
    },
    {
      id: 'plateau',
      name: 'Campus Dakar Plateau',
      shortName: 'Dakar Plateau',
      learners: 248,
      classes: 6,
      teachers: 13,
      attendance: '94,8%',
      collected: '4,2 M F',
    },
    {
      id: 'rufisque',
      name: 'Campus Rufisque',
      shortName: 'Rufisque',
      learners: 186,
      classes: 5,
      teachers: 11,
      attendance: '96,1%',
      collected: '3,1 M F',
    },
  ];

  readonly rooms: SchoolRoom[] = [
    { id: 'room-01-km', campusId: 'keur-massar', name: 'Salle 01' },
    { id: 'room-03-km', campusId: 'keur-massar', name: 'Salle 03' },
    { id: 'room-07-km', campusId: 'keur-massar', name: 'Salle 07' },
    { id: 'room-11-km', campusId: 'keur-massar', name: 'Salle 11' },
    { id: 'room-02-dp', campusId: 'plateau', name: 'Salle 02' },
    { id: 'room-06-dp', campusId: 'plateau', name: 'Salle 06' },
    { id: 'room-10-dp', campusId: 'plateau', name: 'Salle 10' },
    { id: 'room-01-ru', campusId: 'rufisque', name: 'Salle 01' },
    { id: 'room-04-ru', campusId: 'rufisque', name: 'Salle 04' },
    { id: 'room-08-ru', campusId: 'rufisque', name: 'Salle 08' },
  ];

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
    'Étude du milieu',
    'Éducation civique et morale',
    'Arabe',
    'Éducation physique et sportive',
    'Éducation artistique',
  ];
  readonly subjectDomains = [
    'Langues et communication',
    'Mathématiques et sciences',
    'Découverte du monde',
    'Éducation à la citoyenneté',
    'Éducation physique',
    'Arts et culture',
  ];
  readonly subjects = signal<PrimarySubject[]>([
    { id: 1, name: 'Français', code: 'FR', domain: 'Langues et communication', scale: 20, levels: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'], teachers: 8, color: '#2f80ed' },
    { id: 2, name: 'Mathématiques', code: 'MATH', domain: 'Mathématiques et sciences', scale: 20, levels: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'], teachers: 8, color: '#7b61c9' },
    { id: 3, name: 'Étude du milieu', code: 'EDM', domain: 'Découverte du monde', scale: 20, levels: ['CE1', 'CE2', 'CM1', 'CM2'], teachers: 6, color: '#36a37c' },
    { id: 4, name: 'Éducation civique et morale', code: 'ECM', domain: 'Éducation à la citoyenneté', scale: 20, levels: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'], teachers: 5, color: '#e28b4f' },
    { id: 5, name: 'Arabe', code: 'AR', domain: 'Langues et communication', scale: 20, levels: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'], teachers: 4, color: '#2779b9' },
    { id: 6, name: 'Éducation physique et sportive', code: 'EPS', domain: 'Éducation physique', scale: 20, levels: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'], teachers: 3, color: '#d66f57' },
    { id: 7, name: 'Éducation artistique', code: 'ART', domain: 'Arts et culture', scale: 10, levels: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'], teachers: 3, color: '#e3a34b' },
  ]);

  readonly classSubjectAssignments = signal<Record<string, number[]>>({
    'ci-a-km': [1, 2, 4, 6, 7],
    'cp-a-km': [1, 2, 4, 5, 6, 7],
    'ce1-a-km': [1, 2, 3, 4, 5, 6, 7],
    'ce2-a-km': [1, 2, 3, 4, 5, 6, 7],
    'cm1-a-km': [1, 2, 3, 4, 5, 6, 7],
    'cm2-a-km': [1, 2, 3, 4, 5, 6, 7],
    'ci-a-dp': [1, 2, 4, 6, 7],
    'ce1-a-dp': [1, 2, 3, 4, 5, 6, 7],
    'cm2-a-dp': [1, 2, 3, 4, 5, 6, 7],
    'ci-a-ru': [1, 2, 4, 6, 7],
    'ce2-a-ru': [1, 2, 3, 4, 5, 6, 7],
    'cm2-a-ru': [1, 2, 3, 4, 5, 6, 7],
  });
  readonly collegeSubjectSettings = signal<Record<string, { coefficient: number; teacherId: number | null }>>({
    '3e-a-km::1': { coefficient: 4, teacherId: 1 },
    '3e-a-km::2': { coefficient: 4, teacherId: 2 },
    '3e-a-km::3': { coefficient: 3, teacherId: 3 },
    '3e-a-km::4': { coefficient: 3, teacherId: 4 },
    '3e-a-km::5': { coefficient: 2, teacherId: 1 },
    '3e-a-km::6': { coefficient: 2, teacherId: 2 },
    '3e-a-km::7': { coefficient: 1, teacherId: 3 },
  });

  readonly curriculumChapters = signal<CurriculumChapter[]>([
    {
      id: 'cm2-fr-lecture', classId: 'cm2-a-km', subjectId: 1, order: 1,
      title: 'Lecture et compréhension', period: 'Trimestre 1',
      objective: 'Comprendre des textes narratifs, informatifs et prescriptifs adaptés au niveau CM2.',
      lessons: [
        { id: 'cm2-fr-lecture-1', title: 'Comprendre un texte narratif', estimatedSessions: 3, status: 'Terminée' },
        { id: 'cm2-fr-lecture-2', title: 'Identifier les personnages et les événements', estimatedSessions: 2, status: 'Terminée' },
        { id: 'cm2-fr-lecture-3', title: 'Dégager l’idée générale d’un texte', estimatedSessions: 3, status: 'En cours' },
        { id: 'cm2-fr-lecture-4', title: 'Lire et exploiter un texte informatif', estimatedSessions: 3, status: 'À faire' },
      ],
    },
    {
      id: 'cm2-fr-grammaire', classId: 'cm2-a-km', subjectId: 1, order: 2,
      title: 'Grammaire', period: 'Trimestre 1',
      objective: 'Maîtriser la structure de la phrase et les principales fonctions grammaticales.',
      lessons: [
        { id: 'cm2-fr-grammar-1', title: 'Le groupe nominal', estimatedSessions: 2, status: 'Terminée' },
        { id: 'cm2-fr-grammar-2', title: 'Les compléments du verbe', estimatedSessions: 3, status: 'En cours' },
        { id: 'cm2-fr-grammar-3', title: 'La phrase complexe', estimatedSessions: 3, status: 'À faire' },
      ],
    },
    {
      id: 'cm2-fr-production', classId: 'cm2-a-km', subjectId: 1, order: 3,
      title: 'Production d’écrits', period: 'Trimestre 2',
      objective: 'Produire des écrits cohérents en respectant une consigne et une structure.',
      lessons: [
        { id: 'cm2-fr-writing-1', title: 'Rédiger un récit court', estimatedSessions: 4, status: 'À faire' },
        { id: 'cm2-fr-writing-2', title: 'Écrire une lettre', estimatedSessions: 3, status: 'À faire' },
      ],
    },
    {
      id: 'cm2-math-numeration', classId: 'cm2-a-km', subjectId: 2, order: 1,
      title: 'Numération', period: 'Trimestre 1',
      objective: 'Lire, écrire, comparer et décomposer les nombres entiers et décimaux.',
      lessons: [
        { id: 'cm2-math-num-1', title: 'Les grands nombres', estimatedSessions: 3, status: 'Terminée' },
        { id: 'cm2-math-num-2', title: 'Les nombres décimaux', estimatedSessions: 4, status: 'En cours' },
        { id: 'cm2-math-num-3', title: 'Comparer et ranger des nombres décimaux', estimatedSessions: 3, status: 'À faire' },
      ],
    },
    {
      id: 'cm2-math-calcul', classId: 'cm2-a-km', subjectId: 2, order: 2,
      title: 'Techniques opératoires', period: 'Trimestre 1',
      objective: 'Choisir et effectuer les opérations adaptées à une situation problème.',
      lessons: [
        { id: 'cm2-math-calc-1', title: 'Multiplication des nombres entiers', estimatedSessions: 3, status: 'Terminée' },
        { id: 'cm2-math-calc-2', title: 'La division décimale', estimatedSessions: 4, status: 'En cours' },
        { id: 'cm2-math-calc-3', title: 'Résolution de problèmes', estimatedSessions: 5, status: 'À faire' },
      ],
    },
  ]);

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

  readonly currentCampus = computed(
    () => this.campuses.find((campus) => campus.id === this.selectedCampusId()) ?? this.campuses[0],
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
  readonly enrollmentSourceStudents = computed(() =>
    this.students().filter(
      (student) =>
        student.campusId === this.selectedCampusId() &&
        (this.enrollmentSourceClassId() === 'unassigned'
          ? !student.classId
          : student.classId === this.enrollmentSourceClassId()),
    ),
  );
  readonly enrollmentSourceClass = computed(
    () =>
      this.classes().find((item) => item.id === this.enrollmentSourceClassId()) ?? null,
  );
  readonly enrollmentSourceLabel = computed(
    () => this.enrollmentSourceClass()?.name ?? 'Classe non définie',
  );
  readonly enrollmentTargetClass = computed(
    () => this.classes().find((item) => item.id === this.enrollmentTargetClassId()) ?? null,
  );
  readonly enrollmentAllSelected = computed(() => {
    const sourceStudents = this.enrollmentSourceStudents();
    const selectedIds = new Set(this.enrollmentSelectedStudentIds());
    return sourceStudents.length > 0 && sourceStudents.every((student) => selectedIds.has(student.id));
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
      progress: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
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
    this.rooms.filter((room) => room.campusId === this.selectedCampusId()),
  );
  readonly selectedRoom = computed(
    () =>
      this.rooms.find((room) => room.id === this.selectedRoomId()) ??
      this.campusRooms()[0],
  );
  readonly campusTeachers = computed(() =>
    this.teachers().filter((teacher) => teacher.campusId === this.selectedCampusId()),
  );
  readonly campusStaff = computed(() =>
    this.schoolStaff().filter((person) => person.campusId === this.selectedCampusId()),
  );
  readonly campusGuardians = computed(() =>
    this.guardians().filter((guardian) => guardian.campusId === this.selectedCampusId()),
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
  studentForm: StudentFormModel = this.createEmptyStudentForm();

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
  readonly highSchoolSeries = signal<HighSchoolSeries[]>([
    { id: 'serie-s', code: 'S', label: 'Série scientifique', description: 'Sciences, mathématiques et technologies.', color: '#2f80ed', active: true },
    { id: 'serie-l', code: 'L', label: 'Série littéraire', description: 'Lettres, langues et sciences humaines.', color: '#7b61c9', active: true },
    { id: 'serie-g', code: 'G', label: 'Série gestion', description: 'Gestion, économie, commerce et administration.', color: '#36a37c', active: true },
    { id: 'serie-t', code: 'T', label: 'Série technique', description: 'Technologies, industrie et enseignement technique.', color: '#e28b4f', active: true },
  ]);
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
      enrollments: 'Inscriptions & transferts',
      'staff-attendance': 'Absences du personnel',
      students: 'Élèves',
      'student-detail': 'Détails de l’élève',
      guardians: 'Tuteurs',
      classes: 'Classes',
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
      enrollments: 'Bind ak soppi kalaas yi',
      'staff-attendance': 'Ñàkk ci nit ñi ci ekool',
      students: 'Taalibé yi',
      'student-detail': 'Xibaaru taalibe bi',
      guardians: 'Kilifa yi',
      classes: 'Kalaas yi',
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
      enrollments: 'Enrollments & transfers',
      'staff-attendance': 'Staff absences',
      students: 'Students',
      'student-detail': 'Student details',
      guardians: 'Guardians',
      classes: 'Classes',
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
      enrollments: 'التسجيل والتحويلات',
      'staff-attendance': 'غيابات الموظفين',
      students: 'التلاميذ',
      'student-detail': 'تفاصيل التلميذ',
      guardians: 'الأولياء',
      classes: 'الأقسام',
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
    this.initializeFeeConfigurations();

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
      const selectedRoom = this.rooms.find((room) => room.id === this.selectedRoomId());
      if (selectedRoom?.campusId !== campusId) {
        const firstRoom = this.rooms.find((room) => room.campusId === campusId);
        if (firstRoom) {
          this.selectedRoomId.set(firstRoom.id);
        }
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
  }

  setLocale(locale: PrimaryLocale): void {
    this.locale.set(locale);
  }

  isRtl(): boolean {
    return this.locale() === 'ar';
  }

  t(key: string): string {
    return this.translations[this.locale()][key] ?? this.translations.fr[key] ?? key;
  }

  changeCampus(campusId: string): void {
    this.selectedCampusId.set(campusId);
    const campusClasses = this.classes().filter((item) => item.campusId === campusId);
    const firstClass = campusClasses[0];
    if (firstClass) {
      this.selectedClassId.set(firstClass.id);
      this.enrollmentSourceClassId.set(firstClass.id);
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

    if (operation === 'registration') {
      this.enrollmentSourceClassId.set('unassigned');
      return;
    }

    const campusClasses = this.campusClasses();
    this.enrollmentSourceClassId.set(campusClasses[0]?.id ?? 'unassigned');
    this.enrollmentTargetClassId.set(campusClasses[1]?.id ?? campusClasses[0]?.id ?? '');
  }

  changeEnrollmentTarget(classId: string): void {
    this.enrollmentTargetClassId.set(classId);
  }

  toggleEnrollmentStudent(studentId: number): void {
    this.enrollmentSelectedStudentIds.update((selectedIds) =>
      selectedIds.includes(studentId)
        ? selectedIds.filter((id) => id !== studentId)
        : [...selectedIds, studentId],
    );
  }

  toggleAllEnrollmentStudents(): void {
    if (this.enrollmentAllSelected()) {
      this.enrollmentSelectedStudentIds.set([]);
      return;
    }
    this.enrollmentSelectedStudentIds.set(
      this.enrollmentSourceStudents().map((student) => student.id),
    );
  }

  enrollmentActionLabel(): string {
    return this.enrollmentOperation() === 'registration'
      ? 'Inscrire / réinscrire et préparer l’encaissement'
      : 'Transférer vers la nouvelle classe';
  }

  applyEnrollmentAssignment(): void {
    const sourceClass = this.enrollmentSourceClass();
    const targetClass = this.enrollmentTargetClass();
    const selectedIds = new Set(this.enrollmentSelectedStudentIds());

    if (!targetClass || !selectedIds.size) {
      this.snackBar.open('Sélectionnez au moins un élève et une classe de destination.', 'Fermer', {
        duration: 2800,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
      return;
    }

    this.students.update((students) =>
      students.map((student) =>
        selectedIds.has(student.id)
          ? { ...student, classId: targetClass.id, status: 'Actif' }
          : student,
      ),
    );

    if (!sourceClass || sourceClass.id !== targetClass.id) {
      const movedCount = selectedIds.size;
      this.classes.update((classes) =>
        classes.map((classroom) => {
          if (sourceClass && classroom.id === sourceClass.id) {
            return { ...classroom, enrolled: Math.max(0, classroom.enrolled - movedCount) };
          }
          if (classroom.id === targetClass.id) {
            return { ...classroom, enrolled: classroom.enrolled + movedCount };
          }
          return classroom;
        }),
      );
    }

    const count = selectedIds.size;
    const isRegistration = this.enrollmentOperation() === 'registration';
    if (isRegistration) {
      const ledgerKey = `${this.selectedAcademicYear()}::${targetClass.id}::registrationFee`;
      this.oneTimePaymentRecords.update((records) => {
        const existingLedger = records[ledgerKey] ?? {};
        const updatedLedger = [...selectedIds].reduce<Record<number, string | null>>(
          (ledger, studentId) => ({ ...ledger, [studentId]: existingLedger[studentId] ?? null }),
          { ...existingLedger },
        );
        return { ...records, [ledgerKey]: updatedLedger };
      });
      this.selectedCollectionAcademicYear.set(this.selectedAcademicYear());
      this.selectCollectionClass(targetClass.id);
      this.selectedCollectionFeeId.set('registrationFee');
    }

    this.enrollmentSelectedStudentIds.set([]);
    const message = isRegistration
      ? `${count} élève(s) inscrit(s) ou réinscrit(s) en ${targetClass.name}. Les frais d’inscription sont prêts à encaisser.`
      : `${count} élève(s) transféré(s) en ${targetClass.name}.`;
    const snack = this.snackBar.open(message, isRegistration ? 'Voir encaissements' : 'Fermer', {
      duration: 3200,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
    if (isRegistration) {
      snack.onAction().subscribe(() => this.setView('payments'));
    }
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
    this.staffAbsences.update((absences) => absences.filter((absence) => absence.id !== absenceId));
    this.snackBar.open('Absence supprimée.', 'Fermer', { duration: 2200 });
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
      'lieu_naissance', 'nationalite', 'telephone_tuteur', 'prenom_tuteur',
      'nom_tuteur', 'profession_tuteur', 'email_tuteur', 'adresse_tuteur', 'regime',
    ];
    const example = [
      'PRI-260049', 'Awa', 'Ndiaye', 'F', '2015-03-12', 'Dakar', 'Sénégalaise',
      '77 842 10 24', 'Mariama', 'Ba', 'Commerçante', 'mariama.ba@example.sn',
      'Keur Massar', 'Externe',
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
      const campusId = this.selectedCampusId();
      const existingMatricules = new Set(this.students().map((student) => student.matricule.toLowerCase()));
      const guardians = this.guardians();
      let nextId = Math.max(...this.students().map((student) => student.id), 0) + 1;
      const imported = rows.flatMap((row) => {
        const firstName = this.studentImportValue(row, 'prenom_eleve', 'prenom', 'first_name');
        const lastName = this.studentImportValue(row, 'nom_eleve', 'nom', 'last_name');
        if (!firstName || !lastName) {
          return [];
        }
        const guardianPhone = this.studentImportValue(row, 'telephone_tuteur', 'telephone', 'phone_tuteur');
        const guardian = guardians.find((item) =>
          item.campusId === campusId && this.normalizedPhone(item.phone) === this.normalizedPhone(guardianPhone),
        );
        const id = nextId++;
        let matricule = this.studentImportValue(row, 'matricule');
        if (!matricule || existingMatricules.has(matricule.toLowerCase())) {
          matricule = `PRI-26${String(id + 46).padStart(4, '0')}`;
        }
        existingMatricules.add(matricule.toLowerCase());
        const importedGender = this.studentImportValue(row, 'sexe', 'gender').toLowerCase();
        const guardianFirstName = this.studentImportValue(row, 'prenom_tuteur');
        const guardianLastName = this.studentImportValue(row, 'nom_tuteur');
        const date = this.studentImportValue(row, 'date_naissance', 'birth_date');
        return [{
          id,
          campusId,
          classId: '',
          matricule,
          name: `${firstName} ${lastName}`.trim(),
          gender: importedGender.startsWith('f') ? 'F' : 'M',
          birthDate: this.toDisplayDate(date),
          birthPlace: this.studentImportValue(row, 'lieu_naissance', 'birth_place'),
          nationality: this.studentImportValue(row, 'nationalite') || 'Sénégalaise',
          guardianId: guardian?.id,
          parentName: guardian?.name || `${guardianFirstName} ${guardianLastName}`.trim(),
          parentFirstName: guardian?.firstName || guardianFirstName,
          parentLastName: guardian?.lastName || guardianLastName,
          parentProfession: guardian?.profession || this.studentImportValue(row, 'profession_tuteur'),
          parentPhone: guardian?.phone || guardianPhone,
          email: guardian?.email || this.studentImportValue(row, 'email_tuteur'),
          address: guardian?.address || this.studentImportValue(row, 'adresse_tuteur'),
          regime: this.studentImportValue(row, 'regime') || 'Externe',
          status: guardian ? 'Actif' : 'En attente',
          portalAccount: guardian?.accountStatus || 'Non créé',
        } as Student];
      });

      if (!imported.length) {
        this.snackBar.open('Aucun élève valide : renseignez au minimum prénom et nom.', 'Fermer', { duration: 3500 });
        return;
      }
      this.students.update((items) => [...imported, ...items]);
      this.selectClass('unassigned');
      this.closeStudentImport();
      this.snackBar.open(
        `${imported.length} dossier${imported.length > 1 ? 's' : ''} importé${imported.length > 1 ? 's' : ''} dans « Classe non définie ».`,
        'Fermer',
        { duration: 3600 },
      );
    } catch {
      this.snackBar.open('Le fichier ne peut pas être lu. Téléchargez le modèle puis enregistrez-le au format CSV.', 'Fermer', { duration: 4000 });
    }
  }

  openSessionGenerator(): void {
    this.selectedSessionId.set(null);
    this.sessionGeneratorOpen.set(true);
  }

  closeSessionGenerator(): void {
    this.sessionGeneratorOpen.set(false);
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

    const excludedDates = new Set(this.excludedSessionDates());
    const holidays = new Set(this.schoolHolidays.map((holiday) => holiday.date));
    const existingIds = new Set(this.sessions().map((session) => session.id));
    const generated: SchoolSession[] = [];
    const dayKeys: Partial<Record<number, TimetableDay>> = {
      1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday',
    };

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const date = this.toIsoDate(cursor);
      const day = dayKeys[cursor.getDay()];
      if (!day || excludedDates.has(date) || (!includeHolidays && holidays.has(date))) {
        continue;
      }

      this.timetableRows().forEach((row) => {
        const cell = row.cells[day];
        if (!cell.subject || cell.subject === 'Pause') {
          return;
        }
        const id = `session-${this.selectedClassId()}-${date}-${row.id}`;
        if (existingIds.has(id)) {
          return;
        }
        existingIds.add(id);
        generated.push({
          id,
          classId: this.selectedClassId(),
          roomId: this.selectedRoomId(),
          date,
          startTime: row.startTime,
          endTime: row.endTime,
          subject: cell.subject,
          teacherId: cell.teacherId,
          status: 'Planifiée',
          description: '',
          lessonTitle: '',
          programUnit: this.programUnitForSubject(cell.subject),
          programProgress: this.programProgressForSubject(cell.subject),
        });
      });
    }

    this.sessions.update((sessions) => [...sessions, ...generated]);
    this.sessionGeneratorOpen.set(false);
    this.snackBar.open(
      generated.length
        ? `${generated.length} séances ont été générées depuis l’emploi du temps.`
        : 'Aucune nouvelle séance à générer pour cette période.',
      'Fermer',
      { duration: 3200, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
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
    return this.rooms.find((room) => room.id === session.roomId)?.name ?? 'Salle non affectée';
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
    }
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
    this.timetableRows.set(this.cloneTimetableRows(this.timetableDraftRows));
    this.activeView.set('timetable');
    this.snackBar.open('L’emploi du temps a été enregistré.', 'Fermer', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
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

  startStudentRegistration(): void {
    this.studentForm = this.createEmptyStudentForm();
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
    if (!confirm(`Supprimer le dossier de ${student.name} ?`)) {
      return;
    }
    this.students.update((items) => items.filter((item) => item.id !== student.id));
    this.snackBar.open('Le dossier élève a été supprimé.', 'Fermer', {
      duration: 2500,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  deleteStudents(students: Student[]): void {
    if (!students.length || !confirm(`Supprimer les ${students.length} dossiers sélectionnés ?`)) {
      return;
    }
    const ids = new Set(students.map((student) => student.id));
    this.students.update((items) => items.filter((item) => !ids.has(item.id)));
    this.snackBar.open(`${students.length} dossiers élèves supprimés.`, 'Fermer', {
      duration: 2500,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  refreshStudents(): void {
    this.studentDataSource.data = [...this.studentDataSource.data];
  }

  refreshGuardians(): void {
    this.guardianDataSource.data = [...this.guardianDataSource.data];
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
    this.guardians.update((items) => items.map((guardian) => guardian.id !== guardianId ? guardian : {
      ...guardian,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      profession: form.profession.trim(),
      phone: form.phone.trim(),
      secondaryPhone: form.secondaryPhone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    }));
    this.students.update((items) => items.map((student) => student.guardianId !== guardianId ? student : {
      ...student,
      parentName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      parentFirstName: form.firstName.trim(),
      parentLastName: form.lastName.trim(),
      parentProfession: form.profession.trim(),
      parentPhone: form.phone.trim(),
      secondaryPhone: form.secondaryPhone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    }));
    this.snackBar.open('Le dossier tuteur a été mis à jour.', 'Fermer', { duration: 2800 });
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
    let guardian = form.guardianMode === 'existing'
      ? this.guardians().find((item) => item.id === Number(form.guardianId))
      : undefined;

    if (guardian) {
      const updatedGuardian: Guardian = {
        ...guardian,
        firstName: form.parentFirstName.trim(),
        lastName: form.parentLastName.trim(),
        name: `${form.parentFirstName.trim()} ${form.parentLastName.trim()}`.trim(),
        profession: form.parentProfession.trim(),
        phone: form.parentPhone.trim(),
        secondaryPhone: form.secondaryPhone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      };
      this.guardians.update((items) =>
        items.map((item) => item.id === updatedGuardian.id ? updatedGuardian : item),
      );
      guardian = updatedGuardian;
    }

    if (!guardian) {
      const guardianId = Math.max(...this.guardians().map((item) => item.id), 0) + 1;
      guardian = {
        id: guardianId,
        campusId: this.selectedCampusId(),
        firstName: form.parentFirstName.trim(),
        lastName: form.parentLastName.trim(),
        name: `${form.parentFirstName.trim()} ${form.parentLastName.trim()}`.trim(),
        profession: form.parentProfession.trim(),
        phone: form.parentPhone.trim(),
        secondaryPhone: form.secondaryPhone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        childrenCount: 1,
        accountStatus: form.email.trim() ? 'Invitation envoyée' : 'Non créé',
      };
      this.guardians.update((items) => [guardian as Guardian, ...items]);
    }

    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const nextId =
      form.id ?? Math.max(...this.students().map((student) => student.id), 0) + 1;
    const student: Student = {
      id: nextId,
      campusId: this.selectedCampusId(),
      classId:
        this.students().find((item) => item.id === form.id)?.classId ??
        (this.selectedClassId() === 'unassigned' ? '' : this.selectedClassId()),
      matricule:
        form.matricule.trim() ||
        `PRI-26${String(nextId + 46).padStart(4, '0')}`,
      name,
      gender: form.gender,
      birthDate: this.toDisplayDate(form.birthDate),
      guardianId: guardian.id,
      parentPhone: guardian.phone,
      parentName: guardian.name,
      status: 'Actif',
      birthPlace: form.birthPlace.trim(),
      nationality: form.nationality.trim(),
      parentRelationship: form.parentRelationship,
      parentFirstName: guardian.firstName,
      parentLastName: guardian.lastName,
      parentProfession: guardian.profession,
      secondaryPhone: guardian.secondaryPhone,
      email: guardian.email,
      address: guardian.address,
      bloodGroup: form.bloodGroup,
      medicalNotes: form.medicalNotes.trim(),
      regime: form.regime,
      transport: form.transport,
      canteen: form.canteen,
      attachments: [...form.attachments],
      portalAccount: guardian.accountStatus,
    };

    this.students.update((items) => {
      const existingIndex = items.findIndex((item) => item.id === nextId);
      if (existingIndex === -1) {
        return [student, ...items];
      }
      return items.map((item) => (item.id === nextId ? student : item));
    });
    this.attendance.update((state) => ({ ...state, [nextId]: state[nextId] ?? 'P' }));
    const gradeBookKey = this.subjectGradeBookKey();
    this.subjectGrades.update((gradeBooks) => ({
      ...gradeBooks,
      [gradeBookKey]: {
        ...(gradeBooks[gradeBookKey] ?? {}),
        [nextId]: gradeBooks[gradeBookKey]?.[nextId] ?? {
          homework1: null,
          homework2: null,
          composition: null,
        },
      },
    }));
    this.activeView.set('students');
    this.snackBar.open(
      form.id
        ? 'Le dossier élève a été mis à jour.'
        : 'Le dossier élève a été créé avec succès.',
      'Fermer',
      {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      },
    );
  }

  saveStudentRecord(): void {
    const studentId = this.studentForm.id;
    this.saveStudent();
    if (studentId !== null) {
      this.selectedStudentId.set(studentId);
      this.studentRecordTab.set('identity');
      this.activeView.set('student-detail');
    }
  }

  onStudentFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const names = Array.from(input.files ?? []).map((file) => file.name);
    this.studentForm.attachments = [
      ...new Set([...this.studentForm.attachments, ...names]),
    ];
    input.value = '';
  }

  removeStudentAttachment(name: string): void {
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
    const id =
      form.id ??
      `${form.level}-${form.name}-${this.selectedCampusId()}-${Date.now()}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
    const existingClassroom = this.classes().find((item) => item.id === id);
    const classroom: PrimaryClass = {
      id,
      campusId: this.selectedCampusId(),
      level: form.level,
      name: form.name.trim(),
      enrolled: existingClassroom?.enrolled ?? 0,
      registrationFee: form.registrationFee,
      monthlyFee: form.monthlyFee,
      seriesId: this.isHighSchool() ? form.seriesId : null,
    };

    this.classes.update((items) =>
      items.some((item) => item.id === id)
        ? items.map((item) => (item.id === id ? classroom : item))
        : [classroom, ...items],
    );
    if (!this.classFeeConfigurations().some((configuration) => configuration.classId === id)) {
      this.classFeeConfigurations.update((configurations) => [
        ...configurations,
        ...this.feeAcademicYears.map((academicYear) =>
          this.defaultFeeConfiguration(classroom, academicYear),
        ),
      ]);
    }
    if (!this.classSubjectAssignments()[id]) {
      const recommendedSubjects = this.subjects()
        .filter((subject) => subject.levels.includes(form.level))
        .map((subject) => subject.id);
      this.classSubjectAssignments.update((assignments) => ({
        ...assignments,
        [id]: recommendedSubjects,
      }));
    }
    this.selectedClassId.set(id);
    this.classEditorOpen.set(false);
    this.snackBar.open(
      form.id ? 'La classe a été mise à jour.' : 'La classe a été créée.',
      'Fermer',
      { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
  }

  availableClassLevels(): string[] {
    return this.schoolLevelSettings.map((level) => level.code);
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
    const id = this.seriesForm.id ?? `serie-${code.toLowerCase()}-${Date.now()}`;
    const series: HighSchoolSeries = {
      id,
      code,
      label,
      description: this.seriesForm.description.trim(),
      color: this.seriesForm.color || '#2f80ed',
      active: this.seriesForm.active,
    };
    this.highSchoolSeries.update((items) =>
      items.some((item) => item.id === id)
        ? items.map((item) => item.id === id ? series : item)
        : [...items, series],
    );
    this.seriesEditorOpen.set(false);
    this.snackBar.open(
      this.seriesForm.id ? 'La série a été mise à jour.' : 'La série a été ajoutée.',
      'Fermer',
      { duration: 2600 },
    );
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
    this.highSchoolSeries.update((items) => items.filter((item) => item.id !== series.id));
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
    field: keyof Pick<ClassFeeConfiguration, 'registrationFee' | 'monthlyFee' | 'schoolUniformFee' | 'sportsUniformFee'>,
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

    if (this.selectedFeeAcademicYear() === this.currentFeeAcademicYear) {
      const currentConfigurations = this.classFeeConfigurations();
      this.classes.update((classes) =>
        classes.map((classroom) => {
          const configuration = currentConfigurations.find(
            (item) =>
              item.academicYear === this.currentFeeAcademicYear && item.classId === classroom.id,
          );
          return configuration
            ? {
                ...classroom,
                registrationFee: configuration.registrationFee,
                monthlyFee: configuration.monthlyFee,
              }
            : classroom;
        }),
      );
    }

    this.snackBar.open(
      `${this.feeRows().length} tarification(s) enregistrée(s) pour ${this.selectedFeeAcademicYear()}.`,
      'Fermer',
      { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
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
    const classId =
      this.selectedFeeClassId() === 'all'
        ? this.campusClasses()[0]?.id ?? ''
        : this.selectedFeeClassId();
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
    this.additionalSchoolFees.update((fees) => [
      ...fees,
      {
        id: Date.now(),
        academicYear: this.selectedFeeAcademicYear(),
        classId: form.classId,
        label: form.label.trim(),
        amount: form.amount.replace(/[^0-9]/g, ''),
        frequency: form.frequency,
        required: form.required,
      },
    ]);
    this.feeEditorOpen.set(false);
    this.snackBar.open('Le paiement complémentaire a été ajouté.', 'Fermer', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  visibleAdditionalFees(): AdditionalSchoolFee[] {
    const campusClassIds = new Set(this.campusClasses().map((classroom) => classroom.id));
    return this.additionalSchoolFees().filter(
      (fee) =>
        fee.academicYear === this.selectedFeeAcademicYear() &&
        campusClassIds.has(fee.classId) &&
        (this.selectedFeeClassId() === 'all' || fee.classId === this.selectedFeeClassId()),
    );
  }

  additionalFeeClassName(classId: string): string {
    return this.classes().find((classroom) => classroom.id === classId)?.name ?? 'Classe';
  }

  removeAdditionalFee(feeId: number): void {
    if (this.isFeeYearLocked()) {
      return;
    }
    this.additionalSchoolFees.update((fees) => fees.filter((fee) => fee.id !== feeId));
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

  isSubjectAssignedToClass(subjectId: number): boolean {
    return (this.classSubjectAssignments()[this.selectedClassId()] ?? []).includes(subjectId);
  }

  toggleClassSubject(subjectId: number, assigned: boolean): void {
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

  collegeSubjectSetting(classId: string, subjectId: number): { coefficient: number; teacherId: number | null } {
    return this.collegeSubjectSettings()[`${classId}::${subjectId}`] ?? {
      coefficient: 1,
      teacherId: null,
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
      ? this.collegeSubjectSetting(this.selectedClassId(), subject.id).coefficient
      : 1;
  }

  selectedCollegeSubjectTeacher(): string {
    const subject = this.selectedCollegeSubject();
    return subject
      ? this.teacherName(this.collegeSubjectSetting(this.selectedClassId(), subject.id).teacherId)
      : 'Non affecté';
  }

  updateCollegeSubjectCoefficient(subjectId: number, value: string | number): void {
    const classId = this.selectedClassId();
    const key = `${classId}::${subjectId}`;
    const coefficient = Math.max(1, Math.min(10, Number(value) || 1));
    this.collegeSubjectSettings.update((settings) => ({
      ...settings,
      [key]: { ...this.collegeSubjectSetting(classId, subjectId), coefficient },
    }));
  }

  updateCollegeSubjectTeacher(subjectId: number, value: string | number): void {
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

  selectCurriculumSubject(subjectId: number): void {
    this.selectedCurriculumSubjectId.set(subjectId);
    this.curriculumChapterEditorOpen.set(false);
  }

  classSubjectCount(classId: string): number {
    return this.classSubjectAssignments()[classId]?.length ?? 0;
  }

  subjectAssignedClassCount(subjectId: number): number {
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
      (lessons.filter((lesson) => lesson.status === 'Terminée').length / lessons.length) * 100,
    );
  }

  subjectProgramProgress(classId: string, subjectId: number): number {
    const lessons = this.curriculumChapters()
      .filter((chapter) => chapter.classId === classId && chapter.subjectId === subjectId)
      .flatMap((chapter) => chapter.lessons);
    return lessons.length
      ? Math.round((lessons.filter((lesson) => lesson.status === 'Terminée').length / lessons.length) * 100)
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
    if (subjectId === null) {
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
    const classId = this.selectedClassId();
    const createdAt = Date.now();
    const order = this.selectedCurriculumChapters().length + 1;
    const chapter: CurriculumChapter = {
      id: `chapter-${classId}-${subjectId}-${createdAt}`,
      classId,
      subjectId,
      title: lessonTitle,
      objective: this.curriculumChapterForm.objective.trim(),
      period: this.curriculumChapterForm.period,
      order,
      lessons: [{
        id: `lesson-${classId}-${subjectId}-${createdAt}`,
        title: lessonTitle,
        estimatedSessions: Number(this.curriculumChapterForm.estimatedSessions) || 1,
        status: 'À faire',
      }],
    };
    this.curriculumChapters.update((chapters) => [...chapters, chapter]);
    this.curriculumChapterEditorOpen.set(false);
    this.snackBar.open('La leçon a été ajoutée au programme annuel.', 'Fermer', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  deleteCurriculumChapter(chapterId: string): void {
    this.curriculumChapters.update((chapters) =>
      chapters.filter((chapter) => chapter.id !== chapterId),
    );
  }

  deleteCurriculumLesson(chapterId: string, lessonId: string): void {
    this.curriculumChapters.update((chapters) =>
      chapters.flatMap((chapter) => {
        if (chapter.id !== chapterId) {
          return [chapter];
        }
        const lessons = chapter.lessons.filter((lesson) => lesson.id !== lessonId);
        return lessons.length ? [{ ...chapter, lessons }] : [];
      }),
    );
  }

  updateCurriculumLessonStatus(
    chapterId: string,
    lessonId: string,
    status: CurriculumLessonStatus,
  ): void {
    this.curriculumChapters.update((chapters) =>
      chapters.map((chapter) => chapter.id === chapterId
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson) =>
              lesson.id === lessonId ? { ...lesson, status } : lesson,
            ),
          }
        : chapter),
    );
  }

  curriculumChapterProgress(chapter: CurriculumChapter): number {
    return chapter.lessons.length
      ? Math.round(
          (chapter.lessons.filter((lesson) => lesson.status === 'Terminée').length /
            chapter.lessons.length) * 100,
        )
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
        ? Math.round((completed / lessons.length) * 100)
        : session.programProgress,
    };
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
    const nextId =
      form.id ?? Math.max(...this.subjects().map((subject) => subject.id), 0) + 1;
    const subject: PrimarySubject = {
      id: nextId,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      domain: form.domain,
      scale: Number(form.scale),
      levels: [...form.levels],
      teachers:
        this.subjects().find((item) => item.id === nextId)?.teachers ?? 0,
      color: form.color,
    };
    this.subjects.update((items) =>
      items.some((item) => item.id === nextId)
        ? items.map((item) => (item.id === nextId ? subject : item))
        : [subject, ...items],
    );
    this.subjectEditorOpen.set(false);
    this.snackBar.open(
      form.id ? 'La matière a été mise à jour.' : 'La matière a été ajoutée.',
      'Fermer',
      { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' },
    );
  }

  startTeacherRegistration(): void {
    this.teacherForm = this.createEmptyTeacherForm();
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
    if (!confirm(`Supprimer le dossier enseignant de ${teacher.name} ?`)) {
      return;
    }
    this.teachers.update((items) => items.filter((item) => item.id !== teacher.id));
    this.snackBar.open('Le dossier enseignant a été supprimé.', 'Fermer', {
      duration: 2500,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  deleteTeachers(teachers: Teacher[]): void {
    if (!teachers.length || !confirm(`Supprimer les ${teachers.length} enseignants sélectionnés ?`)) {
      return;
    }
    const ids = new Set(teachers.map((teacher) => teacher.id));
    this.teachers.update((items) => items.filter((item) => !ids.has(item.id)));
    this.snackBar.open(`${teachers.length} dossiers enseignants supprimés.`, 'Fermer', {
      duration: 2500,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  refreshTeachers(): void {
    this.teacherDataSource.data = [...this.teacherDataSource.data];
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
    const nextId =
      form.id ?? Math.max(...this.teachers().map((teacher) => teacher.id), 0) + 1;
    const teacher: Teacher = {
      id: nextId,
      campusId: this.selectedCampusId(),
      matricule:
        form.matricule.trim() ||
        `ENS-26${String(nextId).padStart(3, '0')}`,
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      gender: form.gender,
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: form.specialization.trim(),
      degree: form.degree.trim(),
      hireDate: this.toDisplayDate(form.hireDate),
      status: form.status,
      contractType: form.contractType,
      address: form.address.trim(),
      birthDate: this.toDisplayDate(form.birthDate),
      birthPlace: form.birthPlace.trim(),
      emergencyContact: form.emergencyContact.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      experience: form.experience,
      salary: form.salary,
      hourlyRate: form.hourlyRate,
      salaryMode: form.salaryMode,
      attachments: [...form.attachments],
      portalAccount:
        this.teachers().find((item) => item.id === nextId)?.portalAccount ??
        (form.email.trim() ? 'Invitation envoyée' : 'Non créé'),
    };

    this.teachers.update((items) => {
      const exists = items.some((item) => item.id === nextId);
      return exists
        ? items.map((item) => (item.id === nextId ? teacher : item))
        : [teacher, ...items];
    });
    this.teacherEditorOpen.set(false);
    this.snackBar.open(
      form.id
        ? 'Le dossier enseignant a été mis à jour.'
        : 'L’enseignant a été ajouté avec succès.',
      'Fermer',
      {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      },
    );
  }

  saveTeacherRecord(): void {
    const teacherId = this.teacherForm.id;
    this.saveTeacher();
    if (teacherId !== null) {
      this.selectedTeacherId.set(teacherId);
      this.teacherRecordTab.set('profile');
      this.activeView.set('teacher-detail');
    }
  }

  onTeacherFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const names = Array.from(input.files ?? []).map((file) => file.name);
    this.teacherForm.attachments = [
      ...new Set([...this.teacherForm.attachments, ...names]),
    ];
    input.value = '';
  }

  removeTeacherAttachment(name: string): void {
    this.teacherForm.attachments = this.teacherForm.attachments.filter(
      (attachment) => attachment !== name,
    );
  }

  startStaffRegistration(): void {
    this.staffForm = this.createEmptyStaffForm();
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
    if (!confirm(`Supprimer le dossier de ${person.name} ?`)) {
      return;
    }
    this.schoolStaff.update((items) => items.filter((item) => item.id !== person.id));
    this.snackBar.open('Le dossier du personnel a été supprimé.', 'Fermer', {
      duration: 2500,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  deleteStaffMembers(personnel: SchoolStaff[]): void {
    if (!personnel.length || !confirm(`Supprimer les ${personnel.length} dossiers sélectionnés ?`)) {
      return;
    }
    const ids = new Set(personnel.map((person) => person.id));
    this.schoolStaff.update((items) => items.filter((item) => !ids.has(item.id)));
    this.snackBar.open(`${personnel.length} dossiers du personnel supprimés.`, 'Fermer', {
      duration: 2500,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  refreshStaff(): void {
    this.staffDataSource.data = [...this.staffDataSource.data];
  }

  saveStaff(): void {
    const form = this.staffForm;
    const nextId = form.id ?? Math.max(...this.schoolStaff().map((person) => person.id), 0) + 1;
    const person: SchoolStaff = {
      id: nextId,
      campusId: this.selectedCampusId(),
      matricule: form.matricule.trim() || `PER-26${String(nextId).padStart(3, '0')}`,
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      gender: form.gender,
      email: form.email.trim(),
      phone: form.phone.trim(),
      function: form.function.trim(),
      birthDate: this.toDisplayDate(form.birthDate),
      birthPlace: form.birthPlace.trim(),
      address: form.address.trim(),
      hireDate: this.toDisplayDate(form.hireDate),
      contractType: form.contractType,
      status: form.status,
      salary: form.salary,
      hourlyRate: form.hourlyRate,
      emergencyContact: form.emergencyContact.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      attachments: [...form.attachments],
      portalAccount: this.schoolStaff().find((item) => item.id === nextId)?.portalAccount ??
        (form.email.trim() ? 'Invitation envoyée' : 'Non créé'),
    };
    this.schoolStaff.update((items) => items.some((item) => item.id === nextId)
      ? items.map((item) => item.id === nextId ? person : item)
      : [person, ...items]);
    this.staffEditorOpen.set(false);
    this.snackBar.open(form.id ? 'Le dossier du personnel a été mis à jour.' : 'Le membre du personnel a été ajouté.', 'Fermer', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  saveStaffRecord(): void {
    const staffId = this.staffForm.id;
    this.saveStaff();
    if (staffId !== null) {
      this.selectedStaffId.set(staffId);
      this.staffRecordTab.set('profile');
      this.activeView.set('staff-detail');
    }
  }

  onStaffFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const names = Array.from(input.files ?? []).map((file) => file.name);
    this.staffForm.attachments = [...new Set([...this.staffForm.attachments, ...names])];
    input.value = '';
  }

  removeStaffAttachment(name: string): void {
    this.staffForm.attachments = this.staffForm.attachments.filter((attachment) => attachment !== name);
  }

  private loadStaffForm(person: SchoolStaff): void {
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
      schoolUniformFee: String(Math.max(0, 15000 + yearDifference * 1000)),
      sportsUniformFee: String(Math.max(0, 10000 + yearDifference * 1000)),
    };
  }

  private academicYearStart(academicYear: string): number {
    return Number(academicYear.split(/[–-]/)[0]) || 0;
  }

  addPrimaryLevelSetting(): void {
    const nextId = Math.max(0, ...this.schoolLevelSettings.map((level) => level.id)) + 1;
    this.schoolLevelSettings = [
      ...this.schoolLevelSettings,
      { id: nextId, code: '', label: '' },
    ];
  }

  removePrimaryLevelSetting(id: number): void {
    if (this.schoolLevelSettings.length <= 1) {
      this.snackBar.open('Conservez au moins un niveau.', 'Fermer', { duration: 2600 });
      return;
    }
    this.schoolLevelSettings = this.schoolLevelSettings.filter((level) => level.id !== id);
  }

  saveSchoolSettings(): void {
    const year = this.schoolYearSettings;
    const invalidLevel = this.schoolLevelSettings.some((level) => !level.code.trim() || !level.label.trim());
    const invalidTerm = this.trimesterSettings.some((term) => !term.label.trim() || !term.startDate || !term.endDate || term.startDate > term.endDate);
    const periodLabel = this.isCollege() ? 'semestres' : 'trimestres';

    if (!year.label.trim() || !year.startDate || !year.endDate || year.startDate > year.endDate || invalidLevel || invalidTerm) {
      this.snackBar.open(`Vérifiez l’année scolaire, les niveaux et les dates des ${periodLabel}.`, 'Fermer', { duration: 3500 });
      return;
    }

    const academicYear = year.label.trim();
    if (!this.feeAcademicYears.includes(academicYear)) {
      this.workspace.academicYears.update((years) => [...years, academicYear].sort());
    }
    this.workspace.selectedAcademicYear.set(academicYear);
    this.selectedFeeAcademicYear.set(academicYear);
    this.selectedCollectionAcademicYear.set(academicYear);
    this.selectedExpenseAcademicYear.set(academicYear);
    this.selectedFinanceAcademicYear.set(academicYear);
    this.workspace.selectedPeriod.set(this.trimesterSettings[0].label);
    this.snackBar.open(
      `Paramètres ${this.isHighSchool() ? 'du lycée' : this.isCollege() ? 'du collège' : 'du primaire'} enregistrés.`,
      'Fermer',
      { duration: 2800 },
    );
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
                lesson.title === lessonTitle ? { ...lesson, status: 'Terminée' } : lesson,
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
      name: 'Français',
      code: '',
      domain: 'Langues et communication',
      scale: 20,
      levels: ['CI'],
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

  openAssessmentFromStudentRecord(assessment: PrimaryAssessment): void {
    this.activeView.set('assessments');
    this.selectedEvaluationDomainId.set(assessment.evaluationDomainId);
    this.selectedAssessmentId.set(assessment.id);
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }

  backToAssessmentList(): void {
    this.selectedAssessmentId.set(null);
  }

  saveAssessmentResults(): void {
    this.snackBar.open('Les notes et appréciations ont été enregistrées.', 'Fermer', {
      duration: 2800,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
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
      const coefficient = this.collegeSubjectSetting(this.selectedClassId(), subject.id).coefficient;
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
    const previewUrl = this.uploadedReportTemplate()?.previewUrl;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    this.uploadedReportTemplate.set(null);
    this.reportTemplateSource.set('default');
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
      { id: 'schoolUniformFee', label: 'Tenue scolaire', amount: configuration.schoolUniformFee, frequency: 'Paiement unique', required: false },
      { id: 'sportsUniformFee', label: 'Tenue sportive', amount: configuration.sportsUniformFee, frequency: 'Paiement unique', required: false },
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
    this.monthlyPaymentRecords.update((records) => ({
      ...records,
      [ledgerKey]: {
        ...(records[ledgerKey] ?? {}),
        [studentId]: {
          ...(records[ledgerKey]?.[studentId] ?? {}),
          [month]: currentDate ? null : this.currentIsoDate(),
        },
      },
    }));
  }

  oneTimePaymentDate(studentId: number): string | null {
    return this.oneTimePaymentRecords()[this.collectionLedgerKey()]?.[studentId] ?? null;
  }

  toggleOneTimePayment(studentId: number): void {
    const ledgerKey = this.collectionLedgerKey();
    const currentDate = this.oneTimePaymentDate(studentId);
    this.oneTimePaymentRecords.update((records) => ({
      ...records,
      [ledgerKey]: {
        ...(records[ledgerKey] ?? {}),
        [studentId]: currentDate ? null : this.currentIsoDate(),
      },
    }));
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
    return this.expenseTypes().find((type) => type.id === this.selectedExpenseTypeId()) ?? this.expenseTypes()[0];
  }

  expenseTotal(): number {
    return Number(this.expenseForm.amount || 0);
  }

  isSalaryExpenseType(): boolean {
    return this.selectedExpenseTypeId() === 'staff-salary' || this.selectedExpenseTypeId() === 'teacher-salary';
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
    this.expenseTypeDraft = { label: '', frequency: 'Unique', defaultAmount: 0 };
    this.expenseTypeEditorOpen.set(true);
  }

  saveExpenseType(): void {
    const label = this.expenseTypeDraft.label.trim();
    if (!label) {
      return;
    }
    const id = `custom-${Date.now()}`;
    this.expenseTypes.update((types) => [...types, { id, ...this.expenseTypeDraft, active: true }]);
    this.expenseTypeEditorOpen.set(false);
    this.selectExpenseType(id);
    this.snackBar.open('Type de dépense ajouté.', 'Fermer', { duration: 2500 });
  }

  updateExpenseType(typeId: string, field: 'frequency' | 'defaultAmount', value: string | number): void {
    this.expenseTypes.update((types) => types.map((type) => type.id === typeId ? { ...type, [field]: field === 'defaultAmount' ? Number(value) : value } as ExpenseType : type));
  }

  removeExpenseType(typeId: string): void {
    if (!typeId.startsWith('custom-')) {
      this.snackBar.open('Les types par défaut peuvent être modifiés mais pas supprimés.', 'Fermer', { duration: 3000 });
      return;
    }
    this.expenseTypes.update((types) => types.filter((type) => type.id !== typeId));
    if (this.selectedExpenseTypeId() === typeId) {
      this.selectExpenseType('staff-salary');
    }
  }

  selectExpensePeriod(period: string): void {
    this.selectedExpensePeriod.set(period);
    this.expenseUnpaidOnly.set(false);
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
    return this.selectedExpenseTypeId() === 'teacher-salary'
      ? this.teachers().filter((person) => person.campusId === campusId).map((person) => ({ key: `teacher-${person.id}`, name: person.name, reference: person.matricule, role: `Enseignant · ${person.subject}`, salary: Number(person.salary || 0), salaryMode: person.salaryMode ?? 'Mensuel', hourlyRate: Number(person.hourlyRate || 0) }))
      : this.schoolStaff().filter((person) => person.campusId === campusId).map((person) => ({ key: `staff-${person.id}`, name: person.name, reference: person.matricule, role: person.function, salary: Number(person.salary || 0), salaryMode: 'Mensuel', hourlyRate: 0 }));
  }

  visibleSalaryPeople(): ExpensePayee[] {
    const people = this.salaryPeople();
    return this.expenseUnpaidOnly() ? people.filter((person) => this.paymentMonths.some((month) => !this.salaryMonthlyPaymentDate(person.key, month))) : people;
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
    if (person?.salaryMode === 'Horaire' && this.salaryMonthlyHours(person, month) <= 0) {
      this.snackBar.open('Renseignez les heures effectuées avant de marquer ce salaire comme payé.', 'Fermer', { duration: 3200 });
      return;
    }
    const key = `${this.selectedExpenseAcademicYear()}::${personKey}::${month}`;
    this.salaryPaymentRecords.update((records) => ({ ...records, [key]: records[key] ? null : this.currentIsoDate() }));
  }

  salaryMonthlyBalance(person: ExpensePayee): string {
    const outstanding = this.paymentMonths.reduce((total, month) => total + (this.salaryMonthlyPaymentDate(person.key, month) ? 0 : this.salaryMonthlyAmount(person, month)), 0);
    return this.formatExpenseAmount(outstanding);
  }

  expenseExpectedEntries(): number {
    return this.isSalaryExpenseType() ? this.salaryPeople().length * this.paymentMonths.length : this.expenseEntriesForSelection().length;
  }

  expensePaidEntries(): number {
    return this.isSalaryExpenseType()
      ? this.salaryPeople().reduce((total, person) => total + this.paymentMonths.filter((month) => Boolean(this.salaryMonthlyPaymentDate(person.key, month))).length, 0)
      : this.expenseEntriesForSelection().filter((item) => item.status === 'Payée').length;
  }

  expenseSelectedTotal(): number {
    return this.isSalaryExpenseType()
      ? this.salaryPeople().reduce((total, person) => total + this.paymentMonths.reduce((personTotal, month) => personTotal + this.salaryMonthlyAmount(person, month), 0), 0)
      : this.expenseEntriesForSelection().reduce((total, item) => total + item.amount, 0);
  }

  expenseSelectedPaidTotal(): number {
    return this.isSalaryExpenseType()
      ? this.salaryPeople().reduce((total, person) => total + this.paymentMonths.reduce((personTotal, month) => personTotal + (this.salaryMonthlyPaymentDate(person.key, month) ? this.salaryMonthlyAmount(person, month) : 0), 0), 0)
      : this.expenseEntriesForSelection().filter((item) => item.status === 'Payée').reduce((total, item) => total + item.amount, 0);
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
    const record: SchoolExpense = {
      id: this.expenseForm.id ?? Math.max(...this.expenses().map((item) => item.id), 0) + 1,
      typeId: type.id,
      label: this.expenseForm.label.trim(),
      category: '',
      frequency: this.expenseForm.frequency,
      amount,
      date: this.expenseForm.date,
      status: this.expenseForm.status,
      beneficiary: this.expenseForm.beneficiary.trim() || 'À renseigner',
      staffIds: [],
      notes: this.expenseForm.notes.trim(),
    };
    this.expenses.update((items) => this.expenseForm.id ? items.map((item) => item.id === record.id ? record : item) : [record, ...items]);
    this.expenseEditorOpen.set(false);
    this.snackBar.open('Dépense enregistrée.', 'Fermer', { duration: 2500 });
  }

  markExpensePaid(expense: SchoolExpense): void {
    this.expenses.update((items) => items.map((item) => item.id === expense.id ? { ...item, status: item.status === 'Payée' ? 'Prévue' : 'Payée', date: this.currentIsoDate() } : item));
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
      'Tenue scolaire',
      'Tenue sportive',
      ...this.additionalSchoolFees().map((fee) => fee.label),
      ...this.expenseTypes().map((type) => type.label),
    ])];
  }

  financeReasonsForDirection(direction: FinanceDirection): string[] {
    return direction === 'Entrée'
      ? [
          'Mensualité',
          'Inscription',
          'Tenue scolaire',
          'Tenue sportive',
          ...this.additionalSchoolFees().map((fee) => fee.label),
          'Autre encaissement',
        ]
      : [...this.expenseTypes().map((type) => type.label), 'Autre dépense'];
  }

  filteredFinanceEntries(): FinanceEntry[] {
    const query = this.financeSearch().trim().toLocaleLowerCase('fr');
    return this.financeEntries()
      .filter((entry) => entry.campusId === this.selectedCampusId())
      .filter((entry) => entry.date.startsWith(this.selectedFinancePeriod()))
      .filter((entry) => this.selectedFinanceDirection() === 'Tous' || entry.direction === this.selectedFinanceDirection())
      .filter((entry) => this.selectedFinanceReason() === 'all' || entry.reason === this.selectedFinanceReason())
      .filter((entry) => !query || `${entry.reason} ${entry.thirdParty} ${entry.reference} ${entry.paymentMethod}`.toLocaleLowerCase('fr').includes(query))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }

  financePeriods(): Array<{ value: string; label: string }> {
    const academicYearStart = this.academicYearStart(this.selectedFinanceAcademicYear());
    const months = [
      { month: 7, label: 'Juillet' }, { month: 8, label: 'Août' }, { month: 9, label: 'Septembre' },
      { month: 10, label: 'Octobre' }, { month: 11, label: 'Novembre' }, { month: 12, label: 'Décembre' },
      { month: 1, label: 'Janvier' }, { month: 2, label: 'Février' }, { month: 3, label: 'Mars' },
      { month: 4, label: 'Avril' }, { month: 5, label: 'Mai' }, { month: 6, label: 'Juin' },
    ];
    return months.map(({ month, label }) => {
      const year = month >= 7 ? academicYearStart : academicYearStart + 1;
      return { value: `${year}-${String(month).padStart(2, '0')}`, label: `${label} ${year}` };
    });
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

  setFinanceSearch(value: string): void {
    this.financeSearch.set(value);
  }

  selectFinancePeriod(period: string): void {
    this.selectedFinancePeriod.set(period);
  }

  selectFinanceAcademicYear(academicYear: string): void {
    this.selectedFinanceAcademicYear.set(academicYear);
    const firstPeriod = this.financePeriods()[0]?.value;
    if (firstPeriod) this.selectedFinancePeriod.set(firstPeriod);
  }

  selectFinanceDirection(direction: 'Tous' | FinanceDirection): void {
    this.selectedFinanceDirection.set(direction);
  }

  selectFinanceReason(reason: string): void {
    this.selectedFinanceReason.set(reason);
  }

  openFinanceEntryEditor(): void {
    this.financeEntryForm = this.createEmptyFinanceEntryForm();
    this.financeEntryForm.date = `${this.selectedFinancePeriod()}-01`;
    this.financeEditorOpen.set(true);
  }

  closeFinanceEntryEditor(): void {
    this.financeEditorOpen.set(false);
  }

  changeFinanceFormDirection(direction: FinanceDirection): void {
    this.financeEntryForm.direction = direction;
    this.financeEntryForm.reason = this.financeReasonsForDirection(direction)[0];
  }

  isFinanceSalaryReason(reason: string = this.financeEntryForm.reason): boolean {
    return reason === 'Salaire du personnel' || reason === 'Salaire des enseignants' || reason === 'Salaires du personnel';
  }

  saveFinanceEntry(): void {
    const form = this.financeEntryForm;
    if (!form.reason || form.amount <= 0 || (!this.isFinanceSalaryReason(form.reason) && !form.thirdParty.trim())) {
      this.snackBar.open('Renseignez le motif, le montant et le tiers concerné.', 'Fermer', { duration: 3000 });
      return;
    }
    const id = Math.max(...this.financeEntries().map((entry) => entry.id), 0) + 1;
    const prefix = form.direction === 'Entrée' ? 'ENC' : 'DEC';
    const compactDate = form.date.replaceAll('-', '').slice(2);
    this.financeEntries.update((entries) => [{
      id,
      campusId: this.selectedCampusId(),
      amount: Number(form.amount),
      reason: form.reason,
      direction: form.direction,
      date: form.date,
      paymentMethod: form.paymentMethod,
      thirdParty: form.thirdParty.trim() || (this.isFinanceSalaryReason(form.reason) ? 'Personnel de l’établissement' : 'À renseigner'),
      reference: form.reference.trim() || `${prefix}-${compactDate}-${String(id).padStart(3, '0')}`,
      status: form.status,
      source: 'Saisie manuelle',
      notes: form.notes.trim(),
    }, ...entries]);
    this.financeEditorOpen.set(false);
    this.snackBar.open('Opération financière enregistrée.', 'Fermer', { duration: 2500 });
  }

  toggleFinanceEntryStatus(entry: FinanceEntry): void {
    const nextStatus: FinanceStatus = entry.status === 'Validée' ? 'Annulée' : 'Validée';
    this.financeEntries.update((entries) => entries.map((item) => item.id === entry.id ? { ...item, status: nextStatus } : item));
  }

  private createEmptyFinanceEntryForm(): FinanceEntryForm {
    return { direction: 'Entrée', reason: 'Mensualité', amount: 0, date: this.currentIsoDate(), paymentMethod: 'Espèces', thirdParty: '', reference: '', status: 'Validée', notes: '' };
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
