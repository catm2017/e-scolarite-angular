import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { PrimarySchoolComponent } from '../primary-school/primary-school.component';
import { PrimaryWorkspaceService } from '../primary-school/primary-workspace.service';

/**
 * Le lycée reprend le socle du collège et ajoute la gestion des séries.
 * Les données restent locales à la maquette afin de pouvoir valider le métier
 * avant le branchement sur l'API SaaS.
 */
@Component({
  selector: 'app-high-school',
  standalone: true,
  imports: [PrimarySchoolComponent],
  template: '<app-primary-school />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighSchoolComponent implements OnInit, AfterViewInit {
  private readonly workspace = inject(PrimaryWorkspaceService);
  @ViewChild(PrimarySchoolComponent) private readonly school!: PrimarySchoolComponent;

  ngOnInit(): void {
    this.workspace.establishmentType.set('lycee');
    this.workspace.selectedAcademicYear.set('2026–2027');
    this.workspace.selectedPeriod.set('Semestre 1');
    this.workspace.selectView('dashboard');
  }

  ngAfterViewInit(): void {
    // Le contexte est réaffirmé une fois le sous-espace chargé : la topbar,
    // partagée par les établissements, doit toujours afficher l'année lycée.
    this.workspace.selectedAcademicYear.set('2026–2027');
    this.workspace.selectedPeriod.set('Semestre 1');
    this.school.schoolYearSettings = {
      label: '2026–2027',
      startDate: '2026-10-01',
      endDate: '2027-07-15',
    };
    this.school.schoolLevelSettings = [
      { id: 1, code: '2nde', label: 'Seconde' },
      { id: 2, code: '1re', label: 'Première' },
      { id: 3, code: 'Tle', label: 'Terminale' },
    ];
    this.school.trimesterSettings = [
      { id: 1, label: 'Semestre 1', startDate: '2026-10-01', endDate: '2027-01-31' },
      { id: 2, label: 'Semestre 2', startDate: '2027-02-01', endDate: '2027-07-15' },
    ];

    this.school.classes.set([
      { id: '2nde-s-a-km', campusId: 'keur-massar', name: 'Seconde S A', level: '2nde', seriesId: 'serie-s', enrolled: 44, registrationFee: '45000', monthlyFee: '32000' },
      { id: '2nde-l-a-km', campusId: 'keur-massar', name: 'Seconde L A', level: '2nde', seriesId: 'serie-l', enrolled: 41, registrationFee: '45000', monthlyFee: '32000' },
      { id: '1re-s-a-km', campusId: 'keur-massar', name: 'Première S A', level: '1re', seriesId: 'serie-s', enrolled: 39, registrationFee: '50000', monthlyFee: '35000' },
      { id: '1re-l-a-km', campusId: 'keur-massar', name: 'Première L A', level: '1re', seriesId: 'serie-l', enrolled: 38, registrationFee: '50000', monthlyFee: '35000' },
      { id: 'tle-s-a-km', campusId: 'keur-massar', name: 'Terminale S A', level: 'Tle', seriesId: 'serie-s', enrolled: 37, registrationFee: '55000', monthlyFee: '38000' },
      { id: 'tle-l-a-km', campusId: 'keur-massar', name: 'Terminale L A', level: 'Tle', seriesId: 'serie-l', enrolled: 36, registrationFee: '55000', monthlyFee: '38000' },
      { id: 'tle-g-a-km', campusId: 'keur-massar', name: 'Terminale G A', level: 'Tle', seriesId: 'serie-g', enrolled: 32, registrationFee: '55000', monthlyFee: '40000' },
      { id: 'tle-t-a-km', campusId: 'keur-massar', name: 'Terminale T A', level: 'Tle', seriesId: 'serie-t', enrolled: 30, registrationFee: '55000', monthlyFee: '42000' },
      { id: '2nde-s-a-dp', campusId: 'plateau', name: 'Seconde S A', level: '2nde', seriesId: 'serie-s', enrolled: 40, registrationFee: '45000', monthlyFee: '32000' },
      { id: 'tle-l-a-dp', campusId: 'plateau', name: 'Terminale L A', level: 'Tle', seriesId: 'serie-l', enrolled: 34, registrationFee: '55000', monthlyFee: '38000' },
      { id: '2nde-l-a-ru', campusId: 'rufisque', name: 'Seconde L A', level: '2nde', seriesId: 'serie-l', enrolled: 38, registrationFee: '45000', monthlyFee: '32000' },
      { id: 'tle-s-a-ru', campusId: 'rufisque', name: 'Terminale S A', level: 'Tle', seriesId: 'serie-s', enrolled: 33, registrationFee: '55000', monthlyFee: '38000' },
    ]);

    this.school.subjects.set([
      { id: 1, name: 'Français', code: 'FR', domain: 'Langues et lettres', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 2, color: '#2f80ed' },
      { id: 2, name: 'Mathématiques', code: 'MATH', domain: 'Sciences', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 2, color: '#7b61c9' },
      { id: 3, name: 'Anglais', code: 'ANG', domain: 'Langues', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 2, color: '#36a37c' },
      { id: 4, name: 'Histoire-Géographie', code: 'HG', domain: 'Sciences humaines', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 2, color: '#e28b4f' },
      { id: 5, name: 'Sciences de la vie et de la terre', code: 'SVT', domain: 'Sciences', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 1, color: '#2779b9' },
      { id: 6, name: 'Physique-Chimie', code: 'PC', domain: 'Sciences', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 1, color: '#d66f57' },
      { id: 7, name: 'Philosophie', code: 'PHILO', domain: 'Lettres et pensée', scale: 20, levels: ['1re', 'Tle'], teachers: 1, color: '#7357a8' },
      { id: 8, name: 'Économie et gestion', code: 'ECO-G', domain: 'Économie et gestion', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 1, color: '#258262' },
      { id: 9, name: 'Sciences et techniques industrielles', code: 'STI', domain: 'Technique', scale: 20, levels: ['2nde', '1re', 'Tle'], teachers: 1, color: '#c06a3b' },
    ]);

    this.school.classSubjectAssignments.set({
      '2nde-s-a-km': [1, 2, 3, 4, 5, 6],
      '2nde-l-a-km': [1, 2, 3, 4],
      '1re-s-a-km': [1, 2, 3, 4, 5, 6, 7],
      '1re-l-a-km': [1, 2, 3, 4, 7],
      'tle-s-a-km': [1, 2, 3, 4, 5, 6, 7],
      'tle-l-a-km': [1, 2, 3, 4, 7],
      'tle-g-a-km': [1, 2, 3, 4, 7, 8],
      'tle-t-a-km': [1, 2, 3, 4, 6, 9],
      '2nde-s-a-dp': [1, 2, 3, 4, 5, 6],
      'tle-l-a-dp': [1, 2, 3, 4, 7],
      '2nde-l-a-ru': [1, 2, 3, 4],
      'tle-s-a-ru': [1, 2, 3, 4, 5, 6, 7],
    });

    this.school.collegeSubjectSettings.set({
      'tle-s-a-km::1': { coefficient: 3, teacherId: 2 },
      'tle-s-a-km::2': { coefficient: 5, teacherId: 1 },
      'tle-s-a-km::3': { coefficient: 2, teacherId: 3 },
      'tle-s-a-km::4': { coefficient: 2, teacherId: 4 },
      'tle-s-a-km::5': { coefficient: 4, teacherId: 5 },
      'tle-s-a-km::6': { coefficient: 4, teacherId: 6 },
      'tle-s-a-km::7': { coefficient: 2, teacherId: 1 },
    });

    this.school.students.update((students) => students.map((student) => ({
      ...student,
      classId: student.campusId === 'keur-massar' && student.classId ? 'tle-s-a-km'
        : student.campusId === 'plateau' && student.classId ? 'tle-l-a-dp'
          : student.campusId === 'rufisque' && student.classId ? 'tle-s-a-ru'
            : student.classId,
    })));
    this.school.teachers.update((teachers) => teachers.map((teacher, index) => ({
      ...teacher,
      subject: ['Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Physique-Chimie', 'Philosophie'][index % 7],
    })));

    this.school.subjectGrades.update((gradeBooks) => ({
      ...gradeBooks,
      'Semestre 1::tle-s-a-km::Mathématiques': {
        1: { homework1: 15, homework2: 14, composition: 16 },
        2: { homework1: 11, homework2: 13, composition: 12 },
        3: { homework1: 17, homework2: 16, composition: 18 },
        4: { homework1: 9, homework2: 10, composition: 11 },
        5: { homework1: 14, homework2: 13, composition: 15 },
        6: { homework1: 8, homework2: null, composition: null },
      },
      'Semestre 1::tle-s-a-km::Français': {
        1: { homework1: 14, homework2: 16, composition: 15 },
        2: { homework1: 12, homework2: 11, composition: 13 },
        3: { homework1: 16, homework2: 17, composition: 17 },
        4: { homework1: 10, homework2: 9, composition: 11 },
        5: { homework1: 13, homework2: 15, composition: 14 },
        6: { homework1: 11, homework2: null, composition: null },
      },
    }));

    this.school.assessments.set([
      {
        id: 'lycee-math-devoir-1', title: 'Devoir 1 de mathématiques', type: 'Devoir',
        trimester: 'Semestre 1', classId: 'tle-s-a-km', subject: 'Mathématiques',
        evaluationDomainId: 'mathematics', componentId: 'homework1', date: '2026-10-22',
        scale: 20, teacherId: 1, status: 'Corrigée',
        results: this.school.buildAssessmentResults([15, 11, 17, 9, 14, 8, null, null], [1, 2, 3], 20),
      },
      {
        id: 'lycee-math-composition-s1', title: 'Composition du premier semestre', type: 'Composition',
        trimester: 'Semestre 1', classId: 'tle-s-a-km', subject: 'Mathématiques',
        evaluationDomainId: 'mathematics', componentId: 'composition', date: '2027-01-20',
        scale: 20, teacherId: 1, status: 'À corriger',
        results: this.school.buildAssessmentResults([16, 12, 18, 11, 15, null, null, null], [1, 2, 3], 20),
      },
    ]);

    this.school.additionalSchoolFees.set([
      { id: 1, academicYear: '2026–2027', classId: 'tle-s-a-km', label: 'Frais d’examen du baccalauréat', amount: '20000', frequency: 'Paiement unique', required: true },
    ]);
    this.school.monthlyPaymentRecords.set({
      '2026–2027::tle-s-a-km::monthlyFee': {
        1: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
        2: { Oct: '2026-10-06', Nov: '2026-11-08', Déc: null, Jan: null },
        3: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
        4: { Oct: '2026-10-09', Nov: null, Déc: null, Jan: null },
        5: { Oct: '2026-10-05', Nov: '2026-11-07', Déc: '2026-12-08', Jan: null },
        6: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
      },
    });
    this.school.oneTimePaymentRecords.set({
      '2026–2027::tle-s-a-km::registrationFee': {
        1: '2026-09-12', 2: '2026-09-14', 3: '2026-09-14', 4: null,
        5: '2026-09-18', 6: '2026-09-19', 7: null, 8: null,
      },
      '2026–2027::tle-s-a-km::additional-1': {
        1: '2027-01-10', 2: null, 3: '2027-01-12', 4: null,
        5: null, 6: null, 7: null, 8: null,
      },
    });
    this.school.financeEntries.set([
      { id: 1, campusId: 'keur-massar', amount: 38000, reason: 'Mensualité', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Wave', thirdParty: 'Aïssatou Ba · Terminale S A', reference: 'ENC-LYC-260821-014', status: 'Validée', source: 'Encaissements', notes: 'Mensualité août' },
      { id: 2, campusId: 'keur-massar', amount: 55000, reason: 'Inscription', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Espèces', thirdParty: 'Mamadou Diop · Terminale S A', reference: 'ENC-LYC-260821-013', status: 'Validée', source: 'Encaissements', notes: 'Inscription 2026–2027' },
      { id: 3, campusId: 'keur-massar', amount: 520000, reason: 'Salaire du personnel', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Équipe administrative du lycée', reference: 'DEC-LYC-260820-008', status: 'Validée', source: 'Dépenses', notes: 'Salaires août' },
      { id: 4, campusId: 'keur-massar', amount: 390000, reason: 'Salaire des enseignants', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Enseignants du lycée', reference: 'DEC-LYC-260820-009', status: 'Validée', source: 'Dépenses', notes: 'Vacations août' },
      { id: 5, campusId: 'keur-massar', amount: 20000, reason: 'Frais d’examen du baccalauréat', direction: 'Entrée', date: '2026-08-15', paymentMethod: 'Orange Money', thirdParty: 'Fatou Kiné Sow · Terminale S A', reference: 'ENC-LYC-260815-041', status: 'Validée', source: 'Encaissements', notes: '' },
    ]);

    this.school.selectedClassId.set('tle-s-a-km');
    this.school.selectedCurriculumSubjectId.set(1);
    this.school.selectedSubject.set('Mathématiques');
    this.school.additionalFeeForm.classId = 'tle-s-a-km';
  }
}
