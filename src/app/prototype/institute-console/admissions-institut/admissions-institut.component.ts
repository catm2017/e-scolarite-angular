import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CentralApiService, AdmissionInstitutApi } from '../../central-api.service';
import { AppToastService } from '@core/service/app-toast.service';
import { ColumnDefinition, MasterTableComponent } from '@shared/components/master-table/master-table.component';

interface AdmissionTableRow extends AdmissionInstitutApi {
  eleve: string;
  responsable: string;
  parcours: string;
  status: string;
  canToggleStatus: boolean;
}

@Component({ selector: 'app-admissions-institut', imports: [MasterTableComponent], templateUrl: './admissions-institut.component.html', styleUrl: './admissions-institut.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AdmissionsInstitutComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly toast = inject(AppToastService);
  readonly demandes = signal<AdmissionInstitutApi[]>([]);
  readonly chargement = signal(true);
  readonly statutFiltre = signal('toutes');
  readonly demandeASupprimer = signal<AdmissionInstitutApi | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly columns: ColumnDefinition[] = [
    { def: 'eleve', label: 'Élève', type: 'nameWithImage', visible: true, sortable: true },
    { def: 'telephone_eleve', label: 'Téléphone élève', type: 'phone', visible: true, sortable: true },
    { def: 'responsable', label: 'Responsable', type: 'text', visible: true, sortable: true },
    { def: 'parcours', label: 'Parcours demandé', type: 'text', visible: true, sortable: true },
    { def: 'soumise_at', label: 'Soumise le', type: 'dateCard', visible: true, sortable: true },
    { def: 'status', label: 'État', type: 'status', visible: true, sortable: true, statusBadgeMap: { 'À traiter': 'badge badge-solid-orange', Acceptée: 'badge badge-solid-green' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
  readonly dataSource = new MatTableDataSource<AdmissionTableRow>([]);

  demandesFiltrees(): AdmissionInstitutApi[] {
    const filtre = this.statutFiltre();
    return filtre === 'toutes' ? this.demandes() : this.demandes().filter((item) => item.statut === filtre);
  }

  selectionnerStatut(statut: string): void {
    this.statutFiltre.set(statut);
    this.actualiserTableau();
  }

  private actualiserTableau(): void {
    this.dataSource.data = this.demandesFiltrees().map((demande) => ({
      ...demande,
      eleve: `${demande.prenom} ${demande.nom}`.trim(),
      responsable: `${demande.prenom_tuteur ?? ''} ${demande.nom_tuteur ?? ''}`.trim() || 'Non renseigné',
      parcours: [demande.type_etablissement_libelle || demande.type_etablissement_code, demande.campus_nom, demande.classe_libelle].filter(Boolean).join(' · '),
      status: demande.statut === 'acceptee' ? 'Acceptée' : 'À traiter',
      canToggleStatus: demande.statut === 'soumise',
    }));
  }

  ngOnInit(): void { this.charger(); }
  charger(force = false): void { this.chargement.set(true); this.erreur.set(null); this.api.admissionsInstitut(force).subscribe({ next: ({ data }) => { this.demandes.set(data ?? []); this.actualiserTableau(); this.chargement.set(false); }, error: () => { this.erreur.set('Les demandes d’admission sont momentanément indisponibles.'); this.chargement.set(false); } }); }
  accepter(demande: AdmissionInstitutApi): void { if (demande.statut !== 'soumise') return; this.api.accepterAdmissionInstitut(demande.id).subscribe({ next: ({ message }) => { this.toast.success(message); this.demandes.update((items) => items.map((item) => item.id === demande.id ? { ...item, statut: 'acceptee', traitee_at: new Date().toISOString() } : item)); this.actualiserTableau(); }, error: (error) => this.toast.error(error?.error?.message ?? 'La demande n’a pas pu être acceptée.') }); }
  accepterDepuisTable(row: AdmissionTableRow): void { this.accepter(row); }
  confirmerSuppression(demande: AdmissionInstitutApi): void { this.demandeASupprimer.set(demande); }
  annulerSuppression(): void { this.demandeASupprimer.set(null); }
  supprimerConfirme(): void { const demande = this.demandeASupprimer(); if (!demande) return; this.api.supprimerAdmissionInstitut(demande.id).subscribe({ next: ({ message }) => { this.toast.success(message); this.demandes.update((items) => items.filter((item) => item.id !== demande.id)); this.actualiserTableau(); this.annulerSuppression(); }, error: (error) => this.toast.error(error?.error?.message ?? 'La demande n’a pas pu être supprimée.') }); }
}
