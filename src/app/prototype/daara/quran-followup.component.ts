import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CentralApiService, SuiviCoranDaaraApi, SuiviCoranEleveApi } from '../central-api.service';
import { AppToastService } from '@core/service/app-toast.service';
import { LanguageService } from '@core/service/language.service';
import { translatePlatformText } from '../../core/i18n/platform-translations';

@Component({
  selector: 'app-quran-followup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './quran-followup.component.html',
  styleUrls: ['./quran-followup.component.scss', './quran-typography.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuranFollowupComponent implements OnChanges {
  @Input({ required: true }) campusId = '';
  @Input({ required: true }) academicYearId = '';

  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  private readonly language = inject(LanguageService);
  readonly locale = this.language.locale;
  readonly data = signal<SuiviCoranDaaraApi | null>(null);
  readonly loading = signal(false);
  readonly filterModes = ['sourate', 'juz', 'hizb', 'rub'] as const;
  readonly selectedMode = signal<'sourate' | 'juz' | 'hizb' | 'rub'>('sourate');
  readonly selectedNumber = signal(1);
  readonly studentsModalOpen = signal(false);

  ngOnChanges(): void { this.load(); }

  load(versetId?: string, openStudents = false): void {
    if (!this.campusId || !this.academicYearId || this.loading()) return;
    this.loading.set(true);
    this.api.suiviCoranDaara(this.campusId, this.academicYearId, this.selectedMode(), this.selectedNumber(), versetId).subscribe({
      next: ({ data }) => {
        this.data.set(data);
        this.loading.set(false);
        if (openStudents) this.studentsModalOpen.set(true);
      },
      error: (response) => { this.loading.set(false); this.toast.error(response.error?.message ?? this.t('Le suivi du Coran ne peut pas être chargé pour le moment.')); },
    });
  }

  changeMode(mode: 'sourate' | 'juz' | 'hizb' | 'rub'): void {
    this.selectedMode.set(mode);
    const data = this.data();
    const first = mode === 'sourate' ? 1 : (mode === 'juz' ? data?.juzs[0] : mode === 'hizb' ? data?.hizbs[0] : data?.rubs[0]);
    this.selectedNumber.set(first ?? 1); this.load(undefined, true);
  }

  selectNumber(value: string): void { this.selectedNumber.set(Number(value)); this.load(undefined, true); }
  selectVerse(id: string): void { this.load(id, true); }
  closeStudentsModal(): void { this.studentsModalOpen.set(false); }
  t(value: string): string { return translatePlatformText(value, this.locale()); }

  progression(student: SuiviCoranEleveApi): string {
    return student.avancement ? `${this.t('Sourate')} ${student.avancement.sourate} · ${this.t('verset')} ${student.avancement.verset}` : this.t('Début de parcours');
  }
}
