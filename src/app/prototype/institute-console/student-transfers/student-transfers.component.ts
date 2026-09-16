import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { AppToastService } from '@core/service/app-toast.service';
import { ColumnDefinition, MasterTableComponent } from '@shared/components/master-table/master-table.component';
import {
  CentralApiService,
  DestinationTransfertEleve,
  EleveTransferableInstitut,
} from '../../central-api.service';

interface TransferRow {
  id: string;
  matricule: string;
  name: string;
  guardian: string;
  guardianPhone: string;
  source: string;
  currentClass: string;
}

@Component({
  selector: 'app-student-transfers',
  imports: [FormsModule, MasterTableComponent],
  templateUrl: './student-transfers.component.html',
  styleUrl: './student-transfers.component.scss',
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
  readonly rows = signal<TransferRow[]>([]);
  readonly selectedYearId = signal('');
  readonly selectedDestinationId = signal('');
  readonly selectedCampusId = signal('');
  readonly selectedStudentIds = signal<string[]>([]);
  motif = '';
  readonly dataSource = new MatTableDataSource<TransferRow>([]);
  readonly columns: ColumnDefinition[] = [
    { def: 'select', label: 'Sélection', type: 'check', visible: true },
    { def: 'matricule', label: 'Matricule', type: 'text', visible: true, sortable: true },
    { def: 'name', label: 'Élève', type: 'nameWithImage', visible: true, sortable: true },
    { def: 'guardian', label: 'Tuteur', type: 'text', visible: true, sortable: true },
    { def: 'guardianPhone', label: 'Téléphone tuteur', type: 'text', visible: true },
    { def: 'source', label: 'Périmètre actuel', type: 'text', visible: true, sortable: true },
    { def: 'currentClass', label: 'Classe actuelle', type: 'text', visible: true, sortable: true },
  ];

  readonly selectedDestination = computed(() =>
    this.destinations().find((destination) => destination.id === this.selectedDestinationId()) ?? null,
  );
  readonly destinationCampuses = computed(() => this.selectedDestination()?.campus ?? []);
  readonly eligibleDestinations = computed(() => this.destinations().filter((destination) => destination.annee_configuree));
  readonly selectedRows = computed(() =>
    this.rows().filter((row) => this.selectedStudentIds().includes(row.id)),
  );
  readonly canTransfer = computed(() =>
    !!this.selectedYearId()
    && !!this.selectedDestinationId()
    && !!this.selectedCampusId()
    && this.selectedStudentIds().length > 0
    && !this.saving(),
  );
  readonly targetLabel = computed(() => {
    const destination = this.selectedDestination();
    const campus = this.destinationCampuses().find((item) => item.id === this.selectedCampusId());
    return destination && campus ? `${destination.type} · ${destination.nom} — ${campus.nom}` : 'Destination non définie';
  });

  ngOnInit(): void {
    this.load();
  }

  load(yearId = this.selectedYearId()): void {
    this.loading.set(true);
    this.api.transfertsElevesInstitut(yearId || undefined).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.years.set(result.annees);
        const selectedYear = yearId || result.annees.find((year) => year.est_courante)?.id || result.annees[0]?.id || '';
        this.selectedYearId.set(selectedYear);
        this.destinations.set(result.destinations);
        this.applyRows(result.data);
        this.ensureDestination();
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(error?.error?.message ?? 'Les élèves transférables n’ont pas pu être chargés.');
      },
    });
  }

  changeYear(yearId: string): void {
    this.selectedYearId.set(yearId);
    this.selectedStudentIds.set([]);
    this.selectedDestinationId.set('');
    this.selectedCampusId.set('');
    this.load(yearId);
  }

  changeDestination(destinationId: string): void {
    this.selectedDestinationId.set(destinationId);
    const destination = this.destinations().find((item) => item.id === destinationId);
    this.selectedCampusId.set(destination?.campus[0]?.id ?? '');
  }

  changeCampus(campusId: string): void {
    this.selectedCampusId.set(campusId);
  }

  changeSelection(rows: TransferRow[]): void {
    this.selectedStudentIds.set(rows.map((row) => row.id));
  }

  requestTransfer(): void {
    if (!this.canTransfer()) {
      this.toast.error('Choisissez une année, une destination et au moins un élève.');
      return;
    }
    const hasSameDestination = this.selectedRows().some((row) => {
      const source = this.rows().find((item) => item.id === row.id);
      return source?.source === this.targetLabel();
    });
    if (hasSameDestination) {
      this.toast.error('Un ou plusieurs élèves sélectionnés appartiennent déjà à cette destination.');
      return;
    }
    this.confirmOpen.set(true);
  }

  confirmTransfer(): void {
    if (!this.canTransfer() || this.saving()) return;
    this.saving.set(true);
    this.api.enregistrerTransfertsElevesInstitut({
      annee_scolaire_centrale_id: this.selectedYearId(),
      etablissement_cible_id: this.selectedDestinationId(),
      campus_cible_id: this.selectedCampusId(),
      eleve_ids: this.selectedStudentIds(),
      motif: this.motif.trim() || null,
    }).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.confirmOpen.set(false);
        this.selectedStudentIds.set([]);
        this.motif = '';
        this.toast.success(result.message);
        this.load(this.selectedYearId());
      },
      error: (error) => {
        this.saving.set(false);
        this.confirmOpen.set(false);
        this.toast.error(error?.error?.message ?? 'Le transfert n’a pas pu être enregistré.');
      },
    });
  }

  private ensureDestination(): void {
    const destinations = this.eligibleDestinations();
    const current = destinations.find((item) => item.id === this.selectedDestinationId()) ?? destinations[0];
    this.selectedDestinationId.set(current?.id ?? '');
    const campus = current?.campus.find((item) => item.id === this.selectedCampusId()) ?? current?.campus[0];
    this.selectedCampusId.set(campus?.id ?? '');
  }

  private applyRows(eleves: EleveTransferableInstitut[]): void {
    const rows = eleves.map((eleve, index) => ({
      id: eleve.id,
      matricule: eleve.matricule,
      name: `${eleve.prenom} ${eleve.nom}`.trim(),
      guardian: eleve.tuteur,
      guardianPhone: eleve.telephone_tuteur || 'Non renseigné',
      source: `${eleve.type_etablissement} · ${eleve.etablissement} — ${eleve.campus}`,
      currentClass: eleve.classe,
      img: `assets/images/user/user${(index % 9) + 1}.jpg`,
    }));
    this.rows.set(rows);
    this.dataSource.data = rows;
  }
}
