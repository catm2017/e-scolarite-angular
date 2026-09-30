import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppToastService } from '@core/service/app-toast.service';
import { LanguageService } from '@core/service/language.service';
import { translatePlatformText } from '../../core/i18n/platform-translations';
import { CentralApiService, GroupesDaaraApi } from '../central-api.service';
import { TemplateMultiselectDirective } from '@shared/directives/template-multiselect.directive';

@Component({
  selector: 'app-daara-groups', standalone: true, imports: [FormsModule, TemplateMultiselectDirective],
  templateUrl: './daara-groups.component.html', styleUrl: './daara-groups.component.scss', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaaraGroupsComponent implements OnChanges {
  @Input({ required: true }) campusId = '';
  @Input({ required: true }) academicYearId = '';
  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  private readonly language = inject(LanguageService);
  readonly data = signal<GroupesDaaraApi | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly newName = signal('');
  readonly editingId = signal<string | null>(null);
  readonly editingName = signal('');
  readonly deleteId = signal<string | null>(null);
  readonly pendingMembers = signal<Record<string, string[]>>({});

  ngOnChanges(): void { this.load(); }
  t(value: string): string { return translatePlatformText(value, this.language.locale()); }
  load(): void {
    if (!this.campusId || !this.academicYearId || this.loading()) return;
    this.loading.set(true);
    this.api.groupesDaara(this.campusId, this.academicYearId).subscribe({ next: ({ data }) => { this.data.set(data); this.loading.set(false); }, error: (e) => { this.loading.set(false); this.toast.error(e.error?.message ?? this.t('Les groupes du Daara ne peuvent pas être chargés.')); } });
  }
  create(): void {
    const nom = this.newName().trim(); if (!nom || this.saving()) return;
    this.saving.set(true); this.api.creerGroupeDaara(this.campusId, this.academicYearId, nom).subscribe({ next: ({ message }) => { this.toast.success(this.t(message)); this.newName.set(''); this.saving.set(false); this.load(); }, error: (e) => { this.saving.set(false); this.toast.error(e.error?.message ?? this.t('Le groupe n’a pas pu être créé.')); } });
  }
  members(groupId: string): string[] { return this.pendingMembers()[groupId] ?? this.data()?.groupes.find((g) => g.id === groupId)?.eleve_ids ?? []; }
  availableStudents(groupId: string) {
    // Le groupe général sert de liste de départ : ses élèves restent
    // disponibles tant qu’ils ne sont pas affectés à un groupe de travail.
    const assigned = new Set((this.data()?.groupes ?? []).filter((group) => group.id !== groupId && group.code !== 'GRP-001').flatMap((group) => group.eleve_ids));
    return (this.data()?.eleves ?? []).filter((student) => !assigned.has(student.id) || this.members(groupId).includes(student.id));
  }
  selectionChanged(groupId: string, event: Event): void {
    const select = event.target as HTMLSelectElement; const ids = Array.from(select.selectedOptions).map((option) => option.value);
    this.pendingMembers.update((pending) => ({ ...pending, [groupId]: ids }));
  }
  saveMembers(groupId: string): void {
    const ids = this.pendingMembers()[groupId] ?? this.members(groupId);
    this.saving.set(true); this.api.modifierGroupeDaara(groupId, this.campusId, this.academicYearId, { eleve_ids: ids }).subscribe({ next: ({ message }) => { this.toast.success(this.t(message)); this.saving.set(false); this.pendingMembers.update((pending) => { const next = { ...pending }; delete next[groupId]; return next; }); this.load(); }, error: (e) => { this.saving.set(false); this.toast.error(e.error?.message ?? this.t('Les membres du groupe n’ont pas pu être enregistrés.')); } });
  }
  startEdit(groupId: string): void { const group = this.data()?.groupes.find((item) => item.id === groupId); if (group) { this.editingId.set(groupId); this.editingName.set(group.nom); } }
  cancelEdit(): void { this.editingId.set(null); this.editingName.set(''); }
  saveEdit(groupId: string): void {
    const nom = this.editingName().trim(); if (!nom || this.saving()) return;
    this.saving.set(true); this.api.modifierGroupeDaara(groupId, this.campusId, this.academicYearId, { nom }).subscribe({ next: ({ message }) => { this.toast.success(this.t(message)); this.saving.set(false); this.cancelEdit(); this.load(); }, error: (e) => { this.saving.set(false); this.toast.error(e.error?.message ?? this.t('Le groupe n’a pas pu être mis à jour.')); } });
  }
  askDelete(groupId: string): void { this.deleteId.set(groupId); }
  cancelDelete(): void { this.deleteId.set(null); }
  delete(): void {
    const groupId = this.deleteId(); if (!groupId || this.saving()) return;
    this.saving.set(true); this.api.supprimerGroupeDaara(groupId, this.campusId, this.academicYearId).subscribe({ next: ({ message }) => { this.toast.success(this.t(message)); this.saving.set(false); this.cancelDelete(); this.load(); }, error: (e) => { this.saving.set(false); this.toast.error(e.error?.message ?? this.t('Le groupe n’a pas pu être supprimé.')); } });
  }
}
