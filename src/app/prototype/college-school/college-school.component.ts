import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild, inject } from '@angular/core';
import { PrimarySchoolComponent } from '../primary-school/primary-school.component';
import { PrimaryWorkspaceService } from '../primary-school/primary-workspace.service';

/**
 * Le collège réutilise le socle d'administration d'un établissement : dossiers,
 * finances, emplois du temps et personnels. Les règles pédagogiques sont
 * sélectionnées par le contexte « college » du workspace.
 */
@Component({
  selector: 'app-college-school',
  standalone: true,
  imports: [PrimarySchoolComponent],
  template: '<app-primary-school />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollegeSchoolComponent implements OnInit, AfterViewInit {
  private readonly workspace = inject(PrimaryWorkspaceService);
  @ViewChild(PrimarySchoolComponent) private readonly school!: PrimarySchoolComponent;

  ngOnInit(): void {
    this.workspace.establishmentType.set('college');
    this.workspace.selectedPeriod.set('Semestre 1');
    this.workspace.selectView('dashboard');
  }

  ngAfterViewInit(): void {
    this.school.schoolYearSettings = {
      label: '2026–2027',
      startDate: '2026-10-01',
      endDate: '2027-07-15',
    };
    this.school.schoolLevelSettings = [
      { id: 1, code: '6e', label: 'Sixième' },
      { id: 2, code: '5e', label: 'Cinquième' },
      { id: 3, code: '4e', label: 'Quatrième' },
      { id: 4, code: '3e', label: 'Troisième' },
    ];
    this.school.trimesterSettings = [
      { id: 1, label: 'Semestre 1', startDate: '2026-10-01', endDate: '2027-01-31' },
      { id: 2, label: 'Semestre 2', startDate: '2027-02-01', endDate: '2027-07-15' },
    ];
    this.school.classes.set([
      { id: '6e-a-km', campusId: 'keur-massar', name: '6e A', level: '6e', enrolled: 42, registrationFee: '35000', monthlyFee: '25000' },
      { id: '5e-a-km', campusId: 'keur-massar', name: '5e A', level: '5e', enrolled: 40, registrationFee: '35000', monthlyFee: '25000' },
      { id: '4e-a-km', campusId: 'keur-massar', name: '4e A', level: '4e', enrolled: 39, registrationFee: '40000', monthlyFee: '28000' },
      { id: '3e-a-km', campusId: 'keur-massar', name: '3e A', level: '3e', enrolled: 41, registrationFee: '40000', monthlyFee: '28000' },
      { id: '6e-a-dp', campusId: 'plateau', name: '6e A', level: '6e', enrolled: 38, registrationFee: '35000', monthlyFee: '25000' },
      { id: '3e-a-dp', campusId: 'plateau', name: '3e A', level: '3e', enrolled: 37, registrationFee: '40000', monthlyFee: '28000' },
      { id: '6e-a-ru', campusId: 'rufisque', name: '6e A', level: '6e', enrolled: 36, registrationFee: '35000', monthlyFee: '25000' },
      { id: '3e-a-ru', campusId: 'rufisque', name: '3e A', level: '3e', enrolled: 35, registrationFee: '40000', monthlyFee: '28000' },
    ]);
    this.school.subjects.set([
      { id: 1, name: 'Français', code: 'FR', domain: 'Langues', scale: 20, levels: ['6e', '5e', '4e', '3e'], teachers: 2, color: '#2f80ed' },
      { id: 2, name: 'Mathématiques', code: 'MATH', domain: 'Sciences et technologies', scale: 20, levels: ['6e', '5e', '4e', '3e'], teachers: 2, color: '#7b61c9' },
      { id: 3, name: 'Anglais', code: 'ANG', domain: 'Langues', scale: 20, levels: ['6e', '5e', '4e', '3e'], teachers: 2, color: '#36a37c' },
      { id: 4, name: 'Histoire-Géographie', code: 'HG', domain: 'Sciences humaines', scale: 20, levels: ['6e', '5e', '4e', '3e'], teachers: 2, color: '#e28b4f' },
      { id: 5, name: 'Sciences de la vie et de la terre', code: 'SVT', domain: 'Sciences et technologies', scale: 20, levels: ['6e', '5e', '4e', '3e'], teachers: 1, color: '#2779b9' },
      { id: 6, name: 'Physique-Chimie', code: 'PC', domain: 'Sciences et technologies', scale: 20, levels: ['4e', '3e'], teachers: 1, color: '#d66f57' },
      { id: 7, name: 'Éducation civique', code: 'EC', domain: 'Citoyenneté', scale: 20, levels: ['6e', '5e', '4e', '3e'], teachers: 1, color: '#e3a34b' },
    ]);
    this.school.classSubjectAssignments.set({
      '6e-a-km': [1, 2, 3, 4, 5, 7], '5e-a-km': [1, 2, 3, 4, 5, 7],
      '4e-a-km': [1, 2, 3, 4, 5, 6, 7], '3e-a-km': [1, 2, 3, 4, 5, 6, 7],
      '6e-a-dp': [1, 2, 3, 4, 5, 7], '3e-a-dp': [1, 2, 3, 4, 5, 6, 7],
      '6e-a-ru': [1, 2, 3, 4, 5, 7], '3e-a-ru': [1, 2, 3, 4, 5, 6, 7],
    });
    this.school.students.update((students) => students.map((student) => ({
      ...student,
      classId: student.campusId === 'keur-massar' && student.classId ? '3e-a-km'
        : student.campusId === 'plateau' && student.classId ? '3e-a-dp'
          : student.campusId === 'rufisque' && student.classId ? '3e-a-ru'
            : student.classId,
    })));
    this.school.teachers.update((teachers) => teachers.map((teacher, index) => ({
      ...teacher,
      subject: ['Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Physique-Chimie'][index % 6],
    })));
    this.school.subjectGrades.update((gradeBooks) => ({
      ...gradeBooks,
      'Semestre 1::3e-a-km::Mathématiques': {
        1: { homework1: 15, homework2: 14, composition: 16 },
        2: { homework1: 11, homework2: 13, composition: 12 },
        3: { homework1: 17, homework2: 16, composition: 18 },
        4: { homework1: 9, homework2: 10, composition: 11 },
        5: { homework1: 14, homework2: 13, composition: 15 },
        6: { homework1: 8, homework2: null, composition: null },
      },
      'Semestre 1::3e-a-km::Français': {
        1: { homework1: 14, homework2: 16, composition: 15 },
        2: { homework1: 12, homework2: 11, composition: 13 },
        3: { homework1: 16, homework2: 17, composition: 17 },
        4: { homework1: 10, homework2: 9, composition: 11 },
        5: { homework1: 13, homework2: 15, composition: 14 },
        6: { homework1: 11, homework2: null, composition: null },
      },
      'Semestre 1::3e-a-km::Anglais': {
        1: { homework1: 13, homework2: 15, composition: 14 },
        2: { homework1: 10, homework2: 12, composition: 11 },
        3: { homework1: 15, homework2: 16, composition: 16 },
        4: { homework1: 8, homework2: 10, composition: 9 },
        5: { homework1: 14, homework2: 14, composition: 15 },
        6: { homework1: 9, homework2: 11, composition: 10 },
      },
      'Semestre 1::3e-a-km::Histoire-Géographie': {
        1: { homework1: 14, homework2: 13, composition: 15 },
        2: { homework1: 11, homework2: 12, composition: 12 },
        3: { homework1: 16, homework2: 15, composition: 17 },
        4: { homework1: 9, homework2: 10, composition: 10 },
        5: { homework1: 13, homework2: 14, composition: 14 },
        6: { homework1: 10, homework2: null, composition: 11 },
      },
    }));
    this.school.assessments.set([
      {
        id: 'college-math-devoir-1', title: 'Devoir 1 de mathématiques', type: 'Devoir',
        trimester: 'Semestre 1', classId: '3e-a-km', subject: 'Mathématiques',
        evaluationDomainId: 'mathematics', componentId: 'homework1', date: '2026-10-22',
        scale: 20, teacherId: 1, status: 'Corrigée',
        results: this.school.buildAssessmentResults([15, 11, 17, 9, 14, 8, null, null], [1, 2, 3], 20),
      },
      {
        id: 'college-math-devoir-2', title: 'Devoir 2 de mathématiques', type: 'Devoir',
        trimester: 'Semestre 1', classId: '3e-a-km', subject: 'Mathématiques',
        evaluationDomainId: 'mathematics', componentId: 'homework2', date: '2026-11-19',
        scale: 20, teacherId: 1, status: 'Corrigée',
        results: this.school.buildAssessmentResults([14, 13, 16, 10, 13, null, null, null], [1, 3, 5], 20),
      },
      {
        id: 'college-math-composition-s1', title: 'Composition du premier semestre', type: 'Composition',
        trimester: 'Semestre 1', classId: '3e-a-km', subject: 'Mathématiques',
        evaluationDomainId: 'mathematics', componentId: 'composition', date: '2026-12-17',
        scale: 20, teacherId: 1, status: 'À corriger',
        results: this.school.buildAssessmentResults([16, 12, 18, 11, 15, null, null, null], [1, 2, 3, 4], 20),
      },
      {
        id: 'college-francais-devoir-1', title: 'Devoir 1 de français', type: 'Devoir',
        trimester: 'Semestre 1', classId: '3e-a-km', subject: 'Français',
        evaluationDomainId: 'language-communication', componentId: 'homework1', date: '2026-10-29',
        scale: 20, teacherId: 2, status: 'Corrigée',
        results: this.school.buildAssessmentResults([14, 12, 16, 10, 13, 11, null, null], [1, 3], 20),
      },
    ]);
    this.school.additionalSchoolFees.set([
      { id: 1, academicYear: '2026–2027', classId: '3e-a-km', label: 'Frais d’examen BFEM', amount: '15000', frequency: 'Paiement unique', required: true },
      { id: 2, academicYear: '2026–2027', classId: '6e-a-km', label: 'Tenue sportive', amount: '12000', frequency: 'Paiement unique', required: false },
    ]);
    this.school.additionalFeeForm.classId = '3e-a-km';
    this.school.monthlyPaymentRecords.set({
      '2026–2027::3e-a-km::monthlyFee': {
        1: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
        2: { Oct: '2026-10-06', Nov: '2026-11-08', Déc: null, Jan: null },
        3: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
        4: { Oct: '2026-10-09', Nov: null, Déc: null, Jan: null },
        5: { Oct: '2026-10-05', Nov: '2026-11-07', Déc: '2026-12-08', Jan: null },
        6: { Oct: '2026-10-05', Nov: '2026-11-05', Déc: '2026-12-05', Jan: '2027-01-05' },
      },
    });
    this.school.oneTimePaymentRecords.set({
      '2026–2027::3e-a-km::registrationFee': {
        1: '2026-09-12', 2: '2026-09-14', 3: '2026-09-14', 4: null,
        5: '2026-09-18', 6: '2026-09-19', 7: null, 8: null,
      },
      '2026–2027::3e-a-km::additional-1': {
        1: '2027-01-10', 2: null, 3: '2027-01-12', 4: null,
        5: null, 6: null, 7: null, 8: null,
      },
    });
    this.school.financeEntries.set([
      { id: 1, campusId: 'keur-massar', amount: 28000, reason: 'Mensualité', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Wave', thirdParty: 'Aïssatou Ba · 3e A', reference: 'ENC-COL-260821-014', status: 'Validée', source: 'Encaissements', notes: 'Mensualité août' },
      { id: 2, campusId: 'keur-massar', amount: 35000, reason: 'Inscription', direction: 'Entrée', date: '2026-08-21', paymentMethod: 'Espèces', thirdParty: 'Mamadou Diop · 6e A', reference: 'ENC-COL-260821-013', status: 'Validée', source: 'Encaissements', notes: 'Inscription 2026–2027' },
      { id: 3, campusId: 'keur-massar', amount: 420000, reason: 'Salaire du personnel', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Équipe administrative du collège', reference: 'DEC-COL-260820-008', status: 'Validée', source: 'Dépenses', notes: 'Salaires août' },
      { id: 4, campusId: 'keur-massar', amount: 285000, reason: 'Salaire des enseignants', direction: 'Sortie', date: '2026-08-20', paymentMethod: 'Virement', thirdParty: 'Enseignants du collège', reference: 'DEC-COL-260820-009', status: 'Validée', source: 'Dépenses', notes: 'Vacations et salaires août' },
      { id: 5, campusId: 'keur-massar', amount: 118500, reason: 'Facture d’électricité', direction: 'Sortie', date: '2026-08-16', paymentMethod: 'Virement', thirdParty: 'Senelec', reference: 'DEC-COL-260816-006', status: 'Validée', source: 'Dépenses', notes: 'Bâtiment du collège' },
      { id: 6, campusId: 'keur-massar', amount: 15000, reason: 'Frais d’examen BFEM', direction: 'Entrée', date: '2026-08-15', paymentMethod: 'Orange Money', thirdParty: 'Fatou Kiné Sow · 3e A', reference: 'ENC-COL-260815-041', status: 'Validée', source: 'Encaissements', notes: '' },
      { id: 7, campusId: 'keur-massar', amount: 78500, reason: 'Facture d’eau', direction: 'Sortie', date: '2026-08-18', paymentMethod: 'Chèque', thirdParty: 'Sen’Eau', reference: 'DEC-COL-260818-007', status: 'En attente', source: 'Dépenses', notes: 'En attente de signature' },
      { id: 8, campusId: 'plateau', amount: 28000, reason: 'Mensualité', direction: 'Entrée', date: '2026-08-20', paymentMethod: 'Wave', thirdParty: 'Élève de 3e A', reference: 'ENC-COL-260820-021', status: 'Validée', source: 'Encaissements', notes: '' },
    ]);
    this.school.selectedClassId.set('3e-a-km');
    this.school.selectedCurriculumSubjectId.set(1);
    this.school.selectedSubject.set('Mathématiques');
  }
}
