import { ChangeDetectionStrategy, Component, Input, OnChanges, computed, effect, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AppToastService } from '@core/service/app-toast.service';
import { LanguageService } from '@core/service/language.service';
import { translatePlatformText } from '../../core/i18n/platform-translations';
import { CentralApiService, LeconCoranApi, LeconsCoranDaaraApi, SuiviCoranDaaraApi } from '../central-api.service';
import { TemplateMultiselectDirective } from '@shared/directives/template-multiselect.directive';
import { ColumnDefinition, MasterTableComponent } from '@shared/components/master-table/master-table.component';
import { MatTableDataSource } from '@angular/material/table';

type LessonView = 'assign' | 'history';
type ReaderMode = 'all' | 'sourate' | 'juz' | 'hizb' | 'rub';

@Component({
  selector: 'app-quran-lessons', standalone: true, imports: [FormsModule, TemplateMultiselectDirective, MasterTableComponent],
  templateUrl: './quran-lessons.component.html', styleUrls: ['./quran-lessons.component.scss', './quran-lessons-modal.scss', './quran-typography.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuranLessonsComponent implements OnChanges {
  @Input({ required: true }) campusId = '';
  @Input({ required: true }) academicYearId = '';
  @Input() view: LessonView = 'assign';
  @Input() mode: 'lecons' | 'mouradja' = 'lecons';
  readonly completed = output<void>();
  readonly assignmentOpen = signal(false);

  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  private readonly language = inject(LanguageService);
  readonly locale = this.language.locale;
  readonly reader = signal<SuiviCoranDaaraApi | null>(null);
  readonly lessonsData = signal<LeconsCoranDaaraApi | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly readerMode = signal<ReaderMode>('sourate');
  readonly readerNumber = signal(1);
  readonly selectedStudentId = signal('');
  readonly startAyahId = signal('');
  readonly endAyahId = signal('');
  readonly historyStudentId = signal('');
  readonly historyStatus = signal('');
  readonly historyMode = signal<ReaderMode>('all');
  readonly historyNumber = signal(1);
  readonly historyDateStart = signal('');
  readonly historyDateEnd = signal('');
  readonly selectedLessonId = signal('');
  readonly validationLessonId = signal('');
  readonly boppouSourateEffectue = signal(false);
  readonly filterModes: ReaderMode[] = ['all', 'sourate', 'juz', 'hizb', 'rub'];
  readonly historyColumns = computed<ColumnDefinition[]>(() => [
    { def: 'eleve', label: this.t('ÉLÈVE'), type: 'nameWithImage', visible: true },
    { def: 'debut', label: this.t('DÉBUT'), type: 'text', visible: true },
    { def: 'fin', label: this.t('FIN'), type: 'text', visible: true },
    { def: 'sourates', label: this.t('SOURATE(S)'), type: 'text', visible: true },
    { def: 'status', label: this.t('STATUT'), type: 'status', visible: true, statusBadgeMap: { [this.t('À réciter')]: 'badge badge-solid-orange', [this.t('Déjà récité')]: 'badge badge-solid-green' } },
    ...(this.mode === 'lecons' ? [{ def: 'boppou', label: this.t('DÉBUT SOURATE'), type: 'status', visible: true, statusBadgeMap: { [this.t('Effectué')]: 'badge badge-solid-blue', '—': 'badge badge-solid-gray' } } as ColumnDefinition] : []),
    { def: 'assignedAt', label: this.t('Date d’affectation'), type: 'dateCard', visible: true },
    { def: 'completedAt', label: this.t('Date de récitation'), type: 'dateCard', visible: true },
    { def: 'duration', label: this.t('Durée d’apprentissage'), type: 'text', visible: true },
    { def: 'actions', label: this.t('Actions'), type: 'actionBtn', visible: true, sortable: false },
  ]);
  readonly historyDataSource = new MatTableDataSource<any>([]);

  readonly selectedLesson = computed(() => this.lessonsData()?.lecons.find((lesson) => lesson.id === this.selectedLessonId()) ?? null);
  readonly selectedLessonVersets = computed(() => {
    const lesson = this.selectedLesson();
    const verses = this.reader()?.versets ?? [];
    if (!lesson || !verses.length) return [];
    return verses.filter((verse) => verse.position_memorisation >= lesson.debut.position_memorisation && verse.position_memorisation <= lesson.fin.position_memorisation);
  });
  readonly validationLesson = computed(() => this.lessonsData()?.lecons.find((lesson) => lesson.id === this.validationLessonId()) ?? null);

  private readonly historyTableEffect = effect(() => {
    this.historyDataSource.data = this.filteredLessons().map((lesson) => ({
      id: lesson.id, eleve: `${lesson.eleve} · ${lesson.matricule}`, debut: lesson.debut.cle_verset, fin: lesson.fin.cle_verset,
      sourates: `${lesson.debut.sourate_latin || lesson.debut.sourate_arabe} → ${lesson.fin.sourate_latin || lesson.fin.sourate_arabe}`,
      status: this.t(this.labelStatus(lesson.statut)), boppou: lesson.boppou_sourate_effectue ? this.t('Effectué') : '—', assignedAt: lesson.assigned_at, completedAt: lesson.completed_at, duration: this.formatDuration(lesson), canToggleStatus: true,
    }));
  });

  readonly visibleVersets = computed(() => {
    const data = this.reader(); if (!data) return [];
    const mode = this.readerMode(); const number = this.readerNumber();
    if (mode === 'all') return data.versets;
    return data.versets.filter((verse) => mode === 'sourate' ? verse.numero_sourate === number : mode === 'juz' ? verse.numero_juz === number : mode === 'hizb' ? verse.numero_hizb === number : verse.numero_rub === number);
  });
  readonly filteredLessons = computed(() => {
    const data = this.lessonsData(); if (!data) return [];
    const student = this.historyStudentId(); const status = this.historyStatus(); const mode = this.historyMode(); const number = this.historyNumber();
    return data.lecons.filter((lesson) => {
      if (student && lesson.eleve_id !== student) return false;
      if (status && lesson.statut !== status) return false;
      const assignedDate = lesson.assigned_at.slice(0, 10);
      if (this.historyDateStart() && assignedDate < this.historyDateStart()) return false;
      if (this.historyDateEnd() && assignedDate > this.historyDateEnd()) return false;
      if (mode !== 'all') {
        const debut = lesson.debut; const fin = lesson.fin;
        const ok = mode === 'sourate' ? debut.numero_sourate === number || fin.numero_sourate === number : mode === 'juz' ? debut.numero_juz === number || fin.numero_juz === number : mode === 'hizb' ? debut.numero_hizb === number || fin.numero_hizb === number : debut.numero_rub === number || fin.numero_rub === number;
        if (!ok) return false;
      }
      return true;
    });
  });

  ngOnChanges(): void { this.load(); }

  load(): void {
    if (!this.campusId || !this.academicYearId || this.loading()) return;
    this.loading.set(true);
    forkJoin({ reader: this.api.suiviCoranDaara(this.campusId, this.academicYearId, 'all', 1), lessons: this.api.leconsCoranDaara(this.campusId, this.academicYearId, { mode: this.mode }) }).subscribe({
      next: ({ reader, lessons }) => { this.reader.set(reader.data); this.lessonsData.set(lessons.data); this.loading.set(false); },
      error: (response) => { this.loading.set(false); this.toast.error(response.error?.message ?? this.t('Les données des leçons coraniques ne peuvent pas être chargées.')); },
    });
  }

  changeReaderMode(mode: ReaderMode): void { this.readerMode.set(mode); this.readerNumber.set(this.numberOptions(mode)[0] ?? 1); }
  changeHistoryMode(mode: ReaderMode): void { this.historyMode.set(mode); this.historyNumber.set(this.numberOptions(mode)[0] ?? 1); }
  numberOptions(mode: ReaderMode): number[] {
    const data = this.reader(); if (!data) return [];
    if (mode === 'sourate') return data.sourates.map((item) => item.numero);
    if (mode === 'juz') return data.juzs; if (mode === 'hizb') return data.hizbs; if (mode === 'rub') return data.rubs; return [];
  }
  verse(id: string) { return this.reader()?.versets.find((item) => item.id === id) ?? null; }
  selectVerse(id: string): void {
    if (!this.startAyahId() || this.endAyahId()) { this.startAyahId.set(id); this.endAyahId.set(''); return; }
    const start = this.verse(this.startAyahId()); const end = this.verse(id);
    if (!start || !end) return;
    if (end.position_memorisation < start.position_memorisation) { const previousStart = this.startAyahId(); this.startAyahId.set(id); this.endAyahId.set(previousStart); }
    else this.endAyahId.set(id);
  }
  clearSelection(): void { this.startAyahId.set(''); this.endAyahId.set(''); }
  saveLesson(): void {
    const student = this.selectedStudentId(); const start = this.startAyahId(); const end = this.endAyahId();
    if (this.saving()) return;
    if (!student) { this.toast.error(this.t('Choisissez un élève avant d’enregistrer la leçon.')); return; }
    if (!start) { this.toast.error(this.t('Cliquez sur le premier verset de la leçon.')); return; }
    if (!end) { this.toast.error(this.t('Cliquez sur le second verset pour définir la fin de la leçon.')); return; }
    this.saving.set(true);
    this.api.affecterLeconCoranDaara(student, start, end, this.campusId, this.academicYearId, this.mode).subscribe({ next: ({ message }) => { this.saving.set(false); this.toast.success(this.t(message)); this.selectedStudentId.set(''); this.clearSelection(); this.assignmentOpen.set(false); this.load(); if (this.mode === 'lecons') this.completed.emit(); }, error: (response) => { this.saving.set(false); this.toast.error(response.error?.message ?? this.t('La leçon n’a pas pu être affectée.')); } });
  }
  changeStatus(lesson: LeconCoranApi, status: 'a_reciter' | 'deja_recite', boppou = false): void {
    this.api.mettreAJourStatutLeconCoranDaara(lesson.id, status, this.campusId, this.academicYearId, boppou, this.mode).subscribe({ next: ({ message }) => { this.toast.success(this.t(message)); this.load(); }, error: (response) => this.toast.error(response.error?.message ?? this.t('Le statut n’a pas pu être mis à jour.')) });
  }
  toggleHistoryStatus(row: { id: string; status: string }): void {
    const lesson = this.lessonsData()?.lecons.find((item) => item.id === row.id);
    if (!lesson) return;
    if (lesson.statut === 'a_reciter') {
      this.validationLessonId.set(lesson.id);
      this.boppouSourateEffectue.set(false);
      return;
    }
    this.changeStatus(lesson, 'a_reciter');
  }
  confirmLessonValidation(): void {
    const lesson = this.validationLesson();
    if (!lesson) return;
    const boppou = this.mode === 'lecons' && this.boppouSourateEffectue();
    this.closeValidationModal();
    this.changeStatus(lesson, 'deja_recite', boppou);
  }
  closeValidationModal(): void { this.validationLessonId.set(''); this.boppouSourateEffectue.set(false); }
  lessonModeTitle(): string { return this.mode === 'mouradja' ? this.t('Révision coranique') : this.t('Affectation des leçons'); }
  openAssignment(): void { this.assignmentOpen.set(true); }
  openLesson(row: { id?: string }): void { if (row?.id) this.selectedLessonId.set(row.id); }
  closeLesson(): void { this.selectedLessonId.set(''); }
  labelStatus(status: string): string { return status === 'deja_recite' ? 'Déjà récité' : 'À réciter'; }
  t(value: string): string { return translatePlatformText(value, this.locale()); }
  formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : '—'; }
  formatDuration(lesson: LeconCoranApi): string {
    if (lesson.duree_jours === null || !lesson.completed_at) return '—';
    const start = new Date(lesson.assigned_at).getTime(); const end = new Date(lesson.completed_at).getTime();
    const hours = Math.max(0, Math.floor((end - start) / 3_600_000));
    if (hours < 24) return `${hours} ${this.t(hours === 1 ? 'heure' : 'heures')}`;
    const days = Math.max(1, Math.floor(hours / 24));
    return `${days} ${this.t(days === 1 ? 'jour' : 'jours')}`;
  }
}
