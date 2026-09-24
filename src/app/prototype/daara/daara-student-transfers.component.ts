import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { AppToastService } from '@core/service/app-toast.service';
import { ColumnDefinition, MasterTableComponent } from '@shared/components/master-table/master-table.component';
import { CentralApiService } from '../central-api.service';

interface DaaraCandidate { id: string; matricule: string; name: string; sourceId: string; source: string; }

@Component({ selector: 'app-daara-student-transfers', standalone: true, imports: [FormsModule, MasterTableComponent], templateUrl: './daara-student-transfers.component.html', styleUrl: './daara-student-transfers.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class DaaraStudentTransfersComponent implements OnChanges {
  @Input({ required: true }) campusId = '';
  @Input({ required: true }) academicYearId = '';
  @Output() completed = new EventEmitter<void>();
  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  readonly loading = signal(false); readonly saving = signal(false); readonly confirmOpen = signal(false);
  readonly sources = signal<Array<{ id: string; nom: string; type: string }>>([]);
  readonly allRows = signal<DaaraCandidate[]>([]); readonly rows = signal<DaaraCandidate[]>([]);
  readonly selectedSourceId = signal(''); readonly selectedIds = signal<string[]>([]); readonly daaraClass = signal('Daara');
  readonly dataSource = new MatTableDataSource<DaaraCandidate>([]);
  readonly selectedRows = computed(() => this.rows().filter((row) => this.selectedIds().includes(row.id)));
  readonly columns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true }, { def: 'matricule', label: 'Matricule', type: 'text', visible: true, sortable: true },
    { def: 'name', label: 'Élève', type: 'nameWithImage', visible: true, sortable: true }, { def: 'source', label: 'Établissement d’origine', type: 'text', visible: true, sortable: true },
  ];
  ngOnChanges(): void { if (this.campusId && this.academicYearId) this.load(); }
  load(): void { this.loading.set(true); this.api.transfertsDaara(this.campusId, this.academicYearId).subscribe({ next: (result) => { this.loading.set(false); this.sources.set(result.sources); this.daaraClass.set(result.classe_daara.libelle); this.allRows.set(result.data.map((item, index) => ({ id: item.id, matricule: item.matricule, name: `${item.prenom} ${item.nom}`.trim(), sourceId: item.etablissement_source_id, source: item.etablissement_source, img: `assets/images/user/user${(index % 9) + 1}.jpg` }))); this.selectSource(this.selectedSourceId() || result.sources[0]?.id || ''); }, error: (error) => { this.loading.set(false); this.toast.error(error?.error?.message ?? 'Les apprenants disponibles n’ont pas pu être chargés.'); } }); }
  selectSource(id: string): void { this.selectedSourceId.set(id); this.selectedIds.set([]); const rows = this.allRows().filter((row) => !id || row.sourceId === id); this.rows.set(rows); this.dataSource.data = rows; }
  selectRows(rows: DaaraCandidate[]): void { this.selectedIds.set(rows.map((row) => row.id)); }
  requestAdd(): void { if (!this.selectedIds().length) { this.toast.error('Sélectionnez au moins un apprenant.'); return; } this.confirmOpen.set(true); }
  confirmAdd(): void { if (!this.selectedIds().length || this.saving()) return; this.saving.set(true); this.api.ajouterElevesAuDaara(this.campusId, this.academicYearId, this.selectedIds()).subscribe({ next: (result) => { this.saving.set(false); this.confirmOpen.set(false); this.toast.success(result.message); this.completed.emit(); this.load(); }, error: (error) => { this.saving.set(false); this.confirmOpen.set(false); this.toast.error(error?.error?.message ?? 'L’ajout au Daara a échoué.'); } }); }
}
