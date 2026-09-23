import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CentralApiService, SuiviCoranDaaraApi, SuiviCoranEleveApi } from '../central-api.service';
import { AppToastService } from '@core/service/app-toast.service';

@Component({
  selector: 'app-quran-followup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './quran-followup.component.html',
  styleUrl: './quran-followup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuranFollowupComponent implements OnChanges {
  @Input({ required: true }) campusId = '';
  @Input({ required: true }) academicYearId = '';

  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  readonly data = signal<SuiviCoranDaaraApi | null>(null);
  readonly loading = signal(false);
  readonly filterModes = ['sourate', 'juz', 'hizb', 'rub'] as const;
  readonly selectedMode = signal<'sourate' | 'juz' | 'hizb' | 'rub'>('sourate');
  readonly selectedNumber = signal(1);
  readonly selectedStudent = signal<SuiviCoranEleveApi | null>(null);
  readonly saving = signal(false);

  ngOnChanges(): void { this.load(); }

  load(versetId?: string): void {
    if (!this.campusId || !this.academicYearId || this.loading()) return;
    this.loading.set(true);
    this.api.suiviCoranDaara(this.campusId, this.academicYearId, this.selectedMode(), this.selectedNumber(), versetId).subscribe({
      next: ({ data }) => { this.data.set(data); this.loading.set(false); },
      error: (response) => { this.loading.set(false); this.toast.error(response.error?.message ?? 'Le suivi du Coran ne peut pas être chargé pour le moment.'); },
    });
  }

  changeMode(mode: 'sourate' | 'juz' | 'hizb' | 'rub'): void {
    this.selectedMode.set(mode);
    const data = this.data();
    const first = mode === 'sourate' ? 1 : (mode === 'juz' ? data?.juzs[0] : mode === 'hizb' ? data?.hizbs[0] : data?.rubs[0]);
    this.selectedNumber.set(first ?? 1); this.load();
  }

  selectNumber(value: string): void { this.selectedNumber.set(Number(value)); this.load(); }
  selectVerse(id: string): void { this.load(id); }
  chooseStudent(student: SuiviCoranEleveApi): void { this.selectedStudent.set(student); }

  enregistrerProgression(): void {
    const student = this.selectedStudent(); const selection = this.data()?.selection;
    if (!student || !selection || this.saving()) return;
    this.saving.set(true);
    this.api.enregistrerAvancementCoranDaara(student.id, this.campusId, this.academicYearId, selection.id).subscribe({
      next: ({ message }) => { this.saving.set(false); this.toast.success(message); this.load(selection.id); },
      error: (response) => { this.saving.set(false); this.toast.error(response.error?.message ?? 'La progression n’a pas pu être enregistrée.'); },
    });
  }

  progression(student: SuiviCoranEleveApi): string {
    return student.avancement ? `Sourate ${student.avancement.sourate} · verset ${student.avancement.verset}` : 'Début de parcours';
  }
}
