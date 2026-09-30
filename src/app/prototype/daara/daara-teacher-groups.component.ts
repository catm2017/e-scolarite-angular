import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppToastService } from '@core/service/app-toast.service';
import { LanguageService } from '@core/service/language.service';
import { translatePlatformText } from '../../core/i18n/platform-translations';
import { CentralApiService, GroupesDaaraApi } from '../central-api.service';
import { TemplateMultiselectDirective } from '@shared/directives/template-multiselect.directive';

@Component({ selector: 'app-daara-teacher-groups', standalone: true, imports: [FormsModule, TemplateMultiselectDirective], templateUrl: './daara-teacher-groups.component.html', styleUrl: './daara-teacher-groups.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class DaaraTeacherGroupsComponent implements OnChanges {
  @Input({ required: true }) campusId = '';
  @Input({ required: true }) academicYearId = '';
  private readonly api = inject(CentralApiService); private readonly toast = inject(AppToastService); private readonly language = inject(LanguageService);
  readonly data = signal<GroupesDaaraApi | null>(null); readonly loading = signal(false); readonly saving = signal(false); readonly pending = signal<Record<string, string[]>>({});
  ngOnChanges(): void { this.load(); }
  t(value: string): string { return translatePlatformText(value, this.language.locale()); }
  load(): void { if (!this.campusId || !this.academicYearId || this.loading()) return; this.loading.set(true); this.api.groupesDaara(this.campusId, this.academicYearId).subscribe({ next: ({ data }) => { this.data.set(data); this.loading.set(false); }, error: (e) => { this.loading.set(false); this.toast.error(e.error?.message ?? this.t('Les groupes et enseignants ne peuvent pas être chargés.')); } }); }
  members(groupId: string): string[] { return this.pending()[groupId] ?? this.data()?.groupes.find((g) => g.id === groupId)?.enseignant_ids ?? []; }
  changed(groupId: string, event: Event): void { const select = event.target as HTMLSelectElement; this.pending.update((items) => ({ ...items, [groupId]: Array.from(select.selectedOptions).map((option) => option.value) })); }
  save(groupId: string): void { const ids = this.pending()[groupId] ?? this.members(groupId); this.saving.set(true); this.api.modifierGroupeDaara(groupId, this.campusId, this.academicYearId, { enseignant_ids: ids }).subscribe({ next: ({ message }) => { this.saving.set(false); this.toast.success(this.t(message)); this.pending.update((items) => { const next = { ...items }; delete next[groupId]; return next; }); this.load(); }, error: (e) => { this.saving.set(false); this.toast.error(e.error?.message ?? this.t('Les enseignants du groupe n’ont pas pu être enregistrés.')); } }); }
}
