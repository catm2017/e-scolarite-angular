import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CentralApiService, DossierEleveApi, EnfantEspaceFamilleApi, EspaceFamilleApi } from '../central-api.service';

type VueFamille = 'accueil' | 'tableau-de-bord' | 'emploi-du-temps' | 'notes-bulletins' | 'absences' | 'paiements' | 'documents' | 'messages' | 'suivi-coran' | 'profil';

@Component({
  selector: 'app-family-space',
  standalone: true,
  imports: [DatePipe, NgClass],
  templateUrl: './family-space.component.html',
  styleUrl: './family-space.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilySpaceComponent implements OnInit, OnDestroy {
  private readonly api = inject(CentralApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly espace = signal<EspaceFamilleApi | null>(null);
  readonly vue = signal<VueFamille>('accueil');
  readonly enfantSelectionne = signal<EnfantEspaceFamilleApi | null>(null);
  readonly dossier = signal<DossierEleveApi | null>(null);
  readonly chargementDossier = signal(false);
  readonly erreurDossier = signal<string | null>(null);

  readonly enfants = computed(() => this.espace()?.enfants ?? []);
  readonly estTuteur = computed(() => this.espace()?.mode === 'tuteur');
  readonly paiements = computed(() => this.dossier()?.paiements ?? []);
  readonly echeances = computed(() => this.dossier()?.echeances ?? []);
  readonly presences = computed(() => this.dossier()?.presences ?? []);
  readonly evaluations = computed(() => this.dossier()?.evaluations ?? []);
  readonly montantRestant = computed(() => this.echeances().reduce((total, item) => total + Math.max(Number(item.montant_initial) - Number(item.montant_regle), 0), 0));
  readonly absences = computed(() => this.presences().filter((presence) => ['absent', 'absence'].includes((presence.statut ?? '').toLowerCase())));
  readonly retards = computed(() => this.presences().filter((presence) => (presence.statut ?? '').toLowerCase() === 'retard'));

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const candidate = params.get('vue') as VueFamille | null;
      this.vue.set(candidate && this.estVue(candidate) ? candidate : 'accueil');
      if (this.vue() !== 'accueil' && !this.enfantSelectionne()) {
        void this.router.navigate(['/famille/accueil'], { replaceUrl: true });
      }
    });
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.espaceFamille().pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ data }) => {
        this.espace.set(data);
        this.chargement.set(false);
      },
      error: (error) => {
        this.erreur.set(error?.error?.message ?? 'Les informations de votre famille sont momentanément indisponibles.');
        this.chargement.set(false);
      },
    });
  }

  choisirEnfant(enfant: EnfantEspaceFamilleApi): void {
    this.enfantSelectionne.set(enfant);
    this.dossier.set(null);
    this.chargerDossier(enfant);
    void this.router.navigate(['/famille/tableau-de-bord']);
  }

  changerEnfant(): void {
    this.enfantSelectionne.set(null);
    this.dossier.set(null);
    this.erreurDossier.set(null);
    void this.router.navigate(['/famille/accueil']);
  }

  ouvrir(vue: VueFamille): void {
    if (!this.enfantSelectionne()) {
      void this.router.navigate(['/famille/accueil']);
      return;
    }
    void this.router.navigate(['/famille', vue]);
  }

  actualiserDossier(): void {
    const enfant = this.enfantSelectionne();
    if (enfant) this.chargerDossier(enfant);
  }

  photoEnfant(enfant: EnfantEspaceFamilleApi): string {
    return enfant.photo_url || 'assets/images/user/student.jpg';
  }

  libelleStatut(statut: string | null | undefined): string {
    const valeurs: Record<string, string> = { paye: 'Payé', regle: 'Payé', impaye: 'Impayé', en_attente: 'En attente', present: 'Présent', absent: 'Absent', retard: 'Retard' };
    return valeurs[(statut ?? '').toLowerCase()] ?? statut ?? '—';
  }

  classeStatut(statut: string | null | undefined): string {
    const value = (statut ?? '').toLowerCase();
    return value.includes('paye') || value.includes('regle') || value === 'present' ? 'is-success' : value.includes('attente') || value === 'retard' ? 'is-warning' : 'is-danger';
  }

  formatMontant(montant: number | string | null | undefined): string {
    return `${new Intl.NumberFormat('fr-FR').format(Number(montant ?? 0))} FCFA`;
  }

  titreVue(): string {
    const titres: Record<VueFamille, string> = {
      accueil: 'Mes enfants',
      'tableau-de-bord': 'Tableau de bord',
      'emploi-du-temps': 'Emploi du temps',
      'notes-bulletins': 'Notes et bulletins',
      absences: 'Présences et absences',
      paiements: 'Paiements et échéances',
      documents: 'Documents',
      messages: 'Messages',
      'suivi-coran': 'Suivi du Coran',
      profil: 'Profil de l’élève',
    };
    return titres[this.vue()];
  }

  private chargerDossier(enfant: EnfantEspaceFamilleApi): void {
    this.chargementDossier.set(true);
    this.erreurDossier.set(null);
    this.api.dossierEleveEtablissement(enfant.type_code || 'primary', enfant.campus_id, enfant.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ data }) => {
        this.dossier.set(data);
        this.chargementDossier.set(false);
      },
      error: (error) => {
        this.erreurDossier.set(error?.error?.message ?? 'Le dossier de cet élève est momentanément indisponible.');
        this.chargementDossier.set(false);
      },
    });
  }

  private estVue(value: string): value is VueFamille {
    return ['accueil', 'tableau-de-bord', 'emploi-du-temps', 'notes-bulletins', 'absences', 'paiements', 'documents', 'messages', 'suivi-coran', 'profil'].includes(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
