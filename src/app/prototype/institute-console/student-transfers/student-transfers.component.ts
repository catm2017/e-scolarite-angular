import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { AppToastService } from '@core/service/app-toast.service';
import { ColumnDefinition, MasterTableComponent } from '@shared/components/master-table/master-table.component';
import { CentralApiService, DestinationTransfertEleve, EleveTransferableInstitut } from '../../central-api.service';

type TransferMode = 'etablissement' | 'campus';
interface TransferRow {
  id: string; matricule: string; name: string; guardian: string; guardianPhone: string;
  source: string; currentClass: string; establishmentId: string; campusId: string;
}
interface CampusChoice { id: string; nom: string; }

@Component({
  selector: 'app-student-transfers', imports: [FormsModule, MasterTableComponent],
  templateUrl: './student-transfers.component.html', styleUrl: './student-transfers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentTransfersComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly confirmOpen = signal(false);
  readonly years = signal<Array<{ id: string; libelle: string; est_courante: boolean }>>([]);
  readonly destinations = signal<DestinationTransfertEleve[]>([]);
  readonly allRows = signal<TransferRow[]>([]);
  readonly rows = signal<TransferRow[]>([]);
  readonly selectedYearId = signal('');
  readonly transferMode = signal<TransferMode>('etablissement');
  readonly selectedSourceEstablishmentId = signal('');
  readonly selectedTargetEstablishmentId = signal('');
  readonly selectedSourceCampusId = signal('');
  readonly selectedTargetCampusId = signal('');
  readonly selectedStudentIds = signal<string[]>([]);
  motif = '';
  readonly dataSource = new MatTableDataSource<TransferRow>([]);
  readonly columns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true, sortable: true },
    { def: 'name', label: 'Élève', type: 'nameWithImage', visible: true, sortable: true },
    { def: 'guardian', label: 'Tuteur', type: 'text', visible: true, sortable: true },
    { def: 'guardianPhone', label: 'Téléphone tuteur', type: 'text', visible: true },
    { def: 'source', label: 'Source', type: 'text', visible: true, sortable: true },
    { def: 'currentClass', label: 'Classe d’origine', type: 'text', visible: true, sortable: true },
  ];

  readonly sourceEstablishments = computed(() => this.destinations());
  readonly targetEstablishments = computed(() => this.destinations().filter((item) => item.annee_configuree && item.id !== this.selectedSourceEstablishmentId()));
  readonly campuses = computed<CampusChoice[]>(() => {
    const unique = new Map<string, CampusChoice>();
    this.destinations().forEach((item) => item.campus.forEach((campus) => unique.set(campus.id, campus)));
    return [...unique.values()].sort((a, b) => a.nom.localeCompare(b.nom));
  });
  readonly targetCampuses = computed(() => this.campuses().filter((campus) => campus.id !== this.selectedSourceCampusId()));
  readonly selectedTargetEstablishment = computed(() => this.destinations().find((item) => item.id === this.selectedTargetEstablishmentId()) ?? null);
  readonly selectedTargetCampus = computed(() => this.campuses().find((item) => item.id === this.selectedTargetCampusId()) ?? null);
  readonly selectedRows = computed(() => this.rows().filter((row) => this.selectedStudentIds().includes(row.id)));
  readonly canTransfer = computed(() => {
    const hasRoute = this.transferMode() === 'etablissement'
      ? !!this.selectedSourceEstablishmentId() && !!this.selectedTargetEstablishmentId()
      : !!this.selectedSourceCampusId() && !!this.selectedTargetCampusId();
    return !!this.selectedYearId() && hasRoute && this.selectedStudentIds().length > 0 && !this.saving();
  });
  readonly destinationLabel = computed(() => this.transferMode() === 'etablissement'
    ? `${this.selectedTargetEstablishment()?.type ?? 'Établissement'} · ${this.selectedTargetEstablishment()?.nom ?? 'Destination non définie'} · campus conservé`
    : `${this.selectedTargetCampus()?.nom ?? 'Destination non définie'} · établissement conservé`);
  readonly modeDescription = computed(() => this.transferMode() === 'etablissement'
    ? 'L’élève change d’espace, mais reste dans son campus actuel.'
    : 'L’élève change de campus, mais reste dans son type d’établissement actuel.');

  ngOnInit(): void { this.load(); }
  load(yearId = this.selectedYearId()): void {
    this.loading.set(true);
    this.api.transfertsElevesInstitut(yearId || undefined).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.years.set(result.annees);
        this.selectedYearId.set(yearId || result.annees.find((year) => year.est_courante)?.id || result.annees[0]?.id || '');
        this.destinations.set(result.destinations);
        this.applyRows(result.data);
        this.ensureSelections();
      },
      error: (error) => { this.loading.set(false); this.toast.error(error?.error?.message ?? 'Les élèves transférables n’ont pas pu être chargés.'); },
    });
  }
  changeYear(yearId: string): void { this.selectedYearId.set(yearId); this.resetSelection(); this.load(yearId); }
  changeMode(mode: TransferMode): void { if (this.transferMode() !== mode) { this.transferMode.set(mode); this.resetSelection(); this.ensureSelections(); } }
  changeSourceEstablishment(id: string): void { this.selectedSourceEstablishmentId.set(id); if (this.selectedTargetEstablishmentId() === id) this.selectedTargetEstablishmentId.set(''); this.resetSelection(); this.ensureSelections(); }
  changeTargetEstablishment(id: string): void { this.selectedTargetEstablishmentId.set(id); this.resetSelection(); this.refreshVisibleRows(); }
  changeSourceCampus(id: string): void { this.selectedSourceCampusId.set(id); if (this.selectedTargetCampusId() === id) this.selectedTargetCampusId.set(''); this.resetSelection(); this.ensureSelections(); }
  changeTargetCampus(id: string): void { this.selectedTargetCampusId.set(id); this.resetSelection(); this.refreshVisibleRows(); }
  changeSelection(rows: TransferRow[]): void { this.selectedStudentIds.set(rows.map((row) => row.id)); }
  requestTransfer(): void {
    if (!this.canTransfer()) { this.toast.error('Choisissez une année, une source, une destination et au moins un élève.'); return; }
    this.confirmOpen.set(true);
  }
  confirmTransfer(): void {
    if (!this.canTransfer() || this.saving()) return;
    this.saving.set(true);
    const etablissement = this.transferMode() === 'etablissement';
    this.api.enregistrerTransfertsElevesInstitut({
      annee_scolaire_centrale_id: this.selectedYearId(), mode: this.transferMode(),
      ...(etablissement
        ? { etablissement_source_id: this.selectedSourceEstablishmentId(), etablissement_cible_id: this.selectedTargetEstablishmentId() }
        : { campus_source_id: this.selectedSourceCampusId(), campus_cible_id: this.selectedTargetCampusId() }),
      eleve_ids: this.selectedStudentIds(), motif: this.motif.trim() || null,
    }).subscribe({
      next: (result) => { this.saving.set(false); this.confirmOpen.set(false); this.resetSelection(); this.motif = ''; this.toast.success(result.message); this.load(this.selectedYearId()); },
      error: (error) => { this.saving.set(false); this.confirmOpen.set(false); this.toast.error(error?.error?.message ?? 'Le transfert n’a pas pu être enregistré.'); },
    });
  }

  private resetSelection(): void { this.selectedStudentIds.set([]); }
  private ensureSelections(): void {
    const sourceEstablishment = this.sourceEstablishments().find((item) => item.id === this.selectedSourceEstablishmentId()) ?? this.sourceEstablishments()[0];
    this.selectedSourceEstablishmentId.set(sourceEstablishment?.id ?? '');
    const targetEstablishment = this.targetEstablishments().find((item) => item.id === this.selectedTargetEstablishmentId()) ?? this.targetEstablishments()[0];
    this.selectedTargetEstablishmentId.set(targetEstablishment?.id ?? '');
    const sourceCampus = this.campuses().find((item) => item.id === this.selectedSourceCampusId()) ?? this.campuses()[0];
    this.selectedSourceCampusId.set(sourceCampus?.id ?? '');
    const targetCampus = this.targetCampuses().find((item) => item.id === this.selectedTargetCampusId()) ?? this.targetCampuses()[0];
    this.selectedTargetCampusId.set(targetCampus?.id ?? '');
    this.refreshVisibleRows();
  }
  private refreshVisibleRows(): void {
    let rows = this.allRows();
    if (this.transferMode() === 'etablissement') {
      rows = rows.filter((row) => row.establishmentId === this.selectedSourceEstablishmentId());
      const target = this.selectedTargetEstablishment();
      if (target) rows = rows.filter((row) => target.campus.some((campus) => campus.id === row.campusId));
    } else {
      rows = rows.filter((row) => row.campusId === this.selectedSourceCampusId());
      const targetCampusId = this.selectedTargetCampusId();
      if (targetCampusId) rows = rows.filter((row) => this.destinations().find((item) => item.id === row.establishmentId)?.campus.some((campus) => campus.id === targetCampusId));
    }
    this.rows.set(rows); this.dataSource.data = rows;
  }
  private applyRows(eleves: EleveTransferableInstitut[]): void {
    this.allRows.set(eleves.map((eleve, index) => ({
      id: eleve.id, matricule: eleve.matricule, name: `${eleve.prenom} ${eleve.nom}`.trim(), guardian: eleve.tuteur,
      guardianPhone: eleve.telephone_tuteur || 'Non renseigné', source: `${eleve.type_etablissement} · ${eleve.etablissement} — ${eleve.campus}`,
      currentClass: eleve.classe, establishmentId: eleve.etablissement_id, campusId: eleve.campus_id,
      img: `assets/images/user/user${(index % 9) + 1}.jpg`,
    })));
  }
}
