import { DatePipe, NgClass, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CentralApiService, DetailSeanceFamilleApi, DossierEleveApi, EnfantEspaceFamilleApi, EspaceFamilleApi } from '../central-api.service';

type VueFamille = 'accueil' | 'tableau-de-bord' | 'emploi-du-temps' | 'seances' | 'matieres-programmes' | 'notes-bulletins' | 'absences' | 'paiements' | 'documents' | 'messages' | 'suivi-coran' | 'profil';

@Component({
  selector: 'app-family-space',
  standalone: true,
  imports: [DatePipe, NgClass, SlicePipe],
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
  readonly detailSeance = signal<DetailSeanceFamilleApi | null>(null);
  readonly chargementSeance = signal(false);
  readonly erreurSeance = signal<string | null>(null);
  readonly recherchePaiement = signal('');
  readonly lignesPaiement = signal(10);
  readonly pagePaiement = signal(1);
  readonly rechercheSeance = signal('');
  readonly lignesSeance = signal(10);
  readonly pageSeance = signal(1);
  readonly rechercheLecon = signal('');
  readonly lignesLecon = signal(10);
  readonly pageLecon = signal(1);
  readonly rechercheRevision = signal('');
  readonly lignesRevision = signal(10);
  readonly pageRevision = signal(1);

  readonly enfants = computed(() => {
    const uniques = new Map<string, EnfantEspaceFamilleApi>();
    for (const enfant of this.espace()?.enfants ?? []) {
      if (!uniques.has(enfant.id)) uniques.set(enfant.id, enfant);
    }
    return [...uniques.values()];
  });
  readonly estTuteur = computed(() => this.espace()?.mode === 'tuteur');
  readonly paiements = computed(() => this.dossier()?.paiements ?? []);
  readonly echeances = computed(() => this.dossier()?.echeances ?? []);
  readonly presences = computed(() => this.dossier()?.presences ?? []);
  readonly evaluations = computed(() => this.dossier()?.evaluations ?? []);
  readonly evaluationsAvecPieces = computed(() => this.evaluations().filter((evaluation) => Boolean(evaluation.piece_jointe)));
  readonly bulletins = computed(() => this.dossier()?.bulletins ?? []);
  readonly seances = computed(() => this.dossier()?.seances ?? []);
  readonly seancesFiltrees = computed(() => {
    const recherche = this.rechercheSeance().trim().toLowerCase();
    if (!recherche) return this.seances();
    return this.seances().filter((item) => [item.reference, item.date_seance, item.matiere, item.enseignant, item.statut]
      .some((value) => String(value ?? '').toLowerCase().includes(recherche)));
  });
  readonly seancesPage = computed(() => {
    const debut = (this.pageSeance() - 1) * this.lignesSeance();
    return this.seancesFiltrees().slice(debut, debut + this.lignesSeance());
  });
  readonly pagesSeances = computed(() => Math.max(1, Math.ceil(this.seancesFiltrees().length / this.lignesSeance())));
  readonly matieresProgrammes = computed(() => this.dossier()?.matieres_programmes ?? []);
  readonly emploiTemps = computed(() => this.dossier()?.emploi_temps ?? []);
  readonly leconsCoran = computed(() => this.dossier()?.suivi_coran?.lecons ?? []);
  readonly revisionsCoran = computed(() => this.dossier()?.suivi_coran?.revisions ?? []);
  readonly leconsCoranFiltrees = computed(() => this.filtrerCoran(this.leconsCoran(), this.rechercheLecon()));
  readonly leconsCoranPage = computed(() => {
    const debut = (this.pageLecon() - 1) * this.lignesLecon();
    return this.leconsCoranFiltrees().slice(debut, debut + this.lignesLecon());
  });
  readonly pagesLeconsCoran = computed(() => Math.max(1, Math.ceil(this.leconsCoranFiltrees().length / this.lignesLecon())));
  readonly revisionsCoranFiltrees = computed(() => this.filtrerCoran(this.revisionsCoran(), this.rechercheRevision()));
  readonly revisionsCoranPage = computed(() => {
    const debut = (this.pageRevision() - 1) * this.lignesRevision();
    return this.revisionsCoranFiltrees().slice(debut, debut + this.lignesRevision());
  });
  readonly pagesRevisionsCoran = computed(() => Math.max(1, Math.ceil(this.revisionsCoranFiltrees().length / this.lignesRevision())));
  readonly afficherSuiviCoran = computed(() => {
    const enfant = this.enfantSelectionne();
    return enfant?.type_code?.toLowerCase() === 'daara' || this.leconsCoran().length > 0 || this.revisionsCoran().length > 0;
  });
  readonly montantRestant = computed(() => this.echeances().reduce((total, item) => total + Math.max(Number(item.montant_initial) - Number(item.montant_regle), 0), 0));
  readonly absences = computed(() => this.presences().filter((presence) => ['absent', 'absence'].includes((presence.statut ?? '').toLowerCase())));
  readonly retards = computed(() => this.presences().filter((presence) => (presence.statut ?? '').toLowerCase() === 'retard'));
  readonly echeancesFiltrees = computed(() => {
    const recherche = this.recherchePaiement().trim().toLowerCase();
    if (!recherche) return this.echeances();
    return this.echeances().filter((item) => [item.motif, item.periode, item.statut, item.annee, item.date_echeance]
      .some((value) => String(value ?? '').toLowerCase().includes(recherche)));
  });
  readonly echeancesPage = computed(() => {
    const debut = (this.pagePaiement() - 1) * this.lignesPaiement();
    return this.echeancesFiltrees().slice(debut, debut + this.lignesPaiement());
  });
  readonly pagesPaiement = computed(() => Math.max(1, Math.ceil(this.echeancesFiltrees().length / this.lignesPaiement())));
  readonly joursEmploi = [
    { numero: 1, libelle: 'Lundi' }, { numero: 2, libelle: 'Mardi' }, { numero: 3, libelle: 'Mercredi' },
    { numero: 4, libelle: 'Jeudi' }, { numero: 5, libelle: 'Vendredi' }, { numero: 6, libelle: 'Samedi' },
  ];

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const candidate = params.get('vue') as VueFamille | null;
      this.vue.set(candidate && this.estVue(candidate) ? candidate : 'accueil');
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
        // Un compte élève ne choisit pas un dossier : il est déjà rattaché à
        // son propre dossier scolaire et arrive directement sur son tableau.
        if (data.mode === 'eleve') {
          const enfant = this.enfants()[0];
          if (enfant) {
            this.enfantSelectionne.set(enfant);
            this.chargerDossier(enfant);
            if (this.vue() === 'accueil') {
              void this.router.navigate(['/famille/tableau-de-bord'], { replaceUrl: true });
            }
          }
        } else if (this.vue() !== 'accueil') {
          // Un tuteur doit toujours choisir l’enfant avant d’ouvrir une
          // rubrique, contrairement au compte élève qui est déjà contextualisé.
          void this.router.navigate(['/famille/accueil'], { replaceUrl: true });
        }
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
    this.detailSeance.set(null);
    this.recherchePaiement.set('');
    this.pagePaiement.set(1);
    this.rechercheSeance.set('');
    this.pageSeance.set(1);
    this.rechercheLecon.set('');
    this.pageLecon.set(1);
    this.rechercheRevision.set('');
    this.pageRevision.set(1);
    this.chargerDossier(enfant);
    void this.router.navigate(['/famille/tableau-de-bord']);
  }

  changerEnfant(): void {
    this.enfantSelectionne.set(null);
    this.dossier.set(null);
    this.erreurDossier.set(null);
    this.detailSeance.set(null);
    this.recherchePaiement.set('');
    this.pagePaiement.set(1);
    this.rechercheSeance.set('');
    this.pageSeance.set(1);
    this.rechercheLecon.set('');
    this.pageLecon.set(1);
    this.rechercheRevision.set('');
    this.pageRevision.set(1);
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

  emploiTempsParCreneau(): Array<{ debut: string; fin: string; cellules: Map<number, DossierEleveApi['emploi_temps'][number]> }> {
    const groupes = new Map<string, Map<number, DossierEleveApi['emploi_temps'][number]>>();
    this.emploiTemps().forEach((ligne) => {
      const cle = `${ligne.heure_debut}|${ligne.heure_fin}`;
      const cellules = groupes.get(cle) ?? new Map<number, DossierEleveApi['emploi_temps'][number]>();
      cellules.set(Number(ligne.jour_semaine), ligne);
      groupes.set(cle, cellules);
    });
    return [...groupes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([cle, cellules]) => {
      const [debut, fin] = cle.split('|');
      return { debut, fin, cellules };
    });
  }

  ouvrirDetailSeance(seance: DossierEleveApi['seances'][number]): void {
    const enfant = this.enfantSelectionne();
    if (!enfant || !seance.id) return;
    this.detailSeance.set(null);
    this.erreurSeance.set(null);
    this.chargementSeance.set(true);
    this.api.detailSeanceFamille(enfant.id, seance.id, enfant.type_code || 'primaire', enfant.campus_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ data }) => { this.detailSeance.set(data); this.chargementSeance.set(false); },
      error: (error) => { this.erreurSeance.set(error?.error?.message ?? 'Le détail de la séance est indisponible.'); this.chargementSeance.set(false); },
    });
  }

  fermerDetailSeance(): void { this.detailSeance.set(null); this.erreurSeance.set(null); }

  telechargerPiece(piece: DetailSeanceFamilleApi['pieces_jointes'][number]): void {
    const enfant = this.enfantSelectionne();
    const seance = this.detailSeance()?.seance;
    if (!enfant || !seance) return;
    this.api.telechargerPieceSeanceFamille(enfant.id, seance.id, piece.id, enfant.type_code || 'primaire', enfant.campus_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const lien = document.createElement('a'); lien.href = url; lien.download = piece.nom_original; lien.click(); URL.revokeObjectURL(url); },
      error: () => this.erreurSeance.set('Le document n’a pas pu être téléchargé.'),
    });
  }

  telechargerCopieEvaluation(evaluation: DossierEleveApi['evaluations'][number]): void {
    const enfant = this.enfantSelectionne();
    if (!enfant || !evaluation.piece_jointe) return;
    this.api.telechargerCopieEvaluationFamille(enfant.id, evaluation.id, enfant.type_code || 'primaire', enfant.campus_id).subscribe({
      next: (response) => {
        const url = URL.createObjectURL(response.body as Blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = evaluation.piece_jointe?.nom_original || 'copie-evaluation.pdf';
        lien.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.erreurDossier.set('La pièce jointe n’a pas pu être téléchargée.'),
    });
  }

  photoEnfant(enfant: EnfantEspaceFamilleApi): string {
    return enfant.photo_url || 'assets/images/user/student.jpg';
  }

  libelleStatut(statut: string | null | undefined): string {
    const valeurs: Record<string, string> = { paye: 'Payé', regle: 'Payé', a_payer: 'À payer', impaye: 'Impayé', en_attente: 'En attente', present: 'Présent', absent: 'Absent', retard: 'Retard', justifie: 'Justifié', non_renseigne: 'Non renseigné', planifiee: 'Planifiée', a_completer: 'À renseigner', terminee: 'Terminée', realisee: 'Effectuée', ratee: 'Ratée' };
    return valeurs[(statut ?? '').toLowerCase()] ?? statut ?? '—';
  }

  classeStatut(statut: string | null | undefined): string {
    const value = (statut ?? '').toLowerCase();
    return ['paye', 'regle', 'present', 'terminee', 'realisee'].includes(value) ? 'is-success' : ['en_attente', 'planifiee', 'a_completer', 'retard'].includes(value) ? 'is-warning' : 'is-danger';
  }

  formatMontant(montant: number | string | null | undefined): string {
    return `${new Intl.NumberFormat('fr-FR').format(Number(montant ?? 0))} FCFA`;
  }

  rechercherPaiements(value: string): void {
    this.recherchePaiement.set(value);
    this.pagePaiement.set(1);
  }

  changerLignesPaiements(value: string): void {
    const nombre = Number(value);
    this.lignesPaiement.set([5, 10, 25, 50].includes(nombre) ? nombre : 10);
    this.pagePaiement.set(1);
  }

  pagePaiementPrecedente(): void {
    this.pagePaiement.update((page) => Math.max(1, page - 1));
  }

  pagePaiementSuivante(): void {
    this.pagePaiement.update((page) => Math.min(this.pagesPaiement(), page + 1));
  }

  rechercherSeances(value: string): void { this.rechercheSeance.set(value); this.pageSeance.set(1); }
  changerLignesSeances(value: string): void { const nombre = Number(value); this.lignesSeance.set([5, 10, 25, 50].includes(nombre) ? nombre : 10); this.pageSeance.set(1); }
  pageSeancePrecedente(): void { this.pageSeance.update((page) => Math.max(1, page - 1)); }
  pageSeanceSuivante(): void { this.pageSeance.update((page) => Math.min(this.pagesSeances(), page + 1)); }

  rechercherLecons(value: string): void { this.rechercheLecon.set(value); this.pageLecon.set(1); }
  changerLignesLecons(value: string): void { const nombre = Number(value); this.lignesLecon.set([5, 10, 25, 50].includes(nombre) ? nombre : 10); this.pageLecon.set(1); }
  pageLeconPrecedente(): void { this.pageLecon.update((page) => Math.max(1, page - 1)); }
  pageLeconSuivante(): void { this.pageLecon.update((page) => Math.min(this.pagesLeconsCoran(), page + 1)); }

  rechercherRevisions(value: string): void { this.rechercheRevision.set(value); this.pageRevision.set(1); }
  changerLignesRevisions(value: string): void { const nombre = Number(value); this.lignesRevision.set([5, 10, 25, 50].includes(nombre) ? nombre : 10); this.pageRevision.set(1); }
  pageRevisionPrecedente(): void { this.pageRevision.update((page) => Math.max(1, page - 1)); }
  pageRevisionSuivante(): void { this.pageRevision.update((page) => Math.min(this.pagesRevisionsCoran(), page + 1)); }

  libelleJour(jour: number): string {
    return ({ 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' } as Record<number, string>)[jour] ?? `Jour ${jour}`;
  }

  libelleStatutCoran(statut: string | null | undefined): string {
    return ({ a_reciter: 'À réciter', deja_recite: 'Déjà récité', en_cours: 'En cours', valide: 'Validée' } as Record<string, string>)[(statut ?? '').toLowerCase()] ?? statut ?? '—';
  }

  dureeCoran(debut: string | null | undefined, fin: string | null | undefined): string {
    if (!debut || !fin) return '—';
    const secondes = Math.max(0, (new Date(fin).getTime() - new Date(debut).getTime()) / 1000);
    const heures = Math.floor(secondes / 3600);
    const minutes = Math.floor((secondes % 3600) / 60);
    return heures ? `${heures} h${minutes ? ` ${minutes} min` : ''}` : `${minutes} min`;
  }

  titreVue(): string {
    const titres: Record<VueFamille, string> = {
      accueil: 'Mes enfants',
      'tableau-de-bord': 'Tableau de bord',
      'emploi-du-temps': 'Emploi du temps',
      seances: 'Séances',
      'matieres-programmes': 'Matières & programmes',
      'notes-bulletins': 'Évaluations',
      absences: 'Présences et absences',
      paiements: 'Paiements et échéances',
      documents: 'Documents',
      messages: 'Messages',
      'suivi-coran': 'Suivi du Coran',
      profil: 'Profil de l’élève',
    };
    return titres[this.vue()];
  }

  private filtrerCoran(lignes: DossierEleveApi['suivi_coran']['lecons'], terme: string) {
    const recherche = terme.trim().toLowerCase();
    if (!recherche) return lignes;
    return lignes.filter((item) => [item.debut, item.fin, item.statut, item.assigned_at, item.completed_at, item.juz, item.hizb, item.rub]
      .some((value) => String(value ?? '').toLowerCase().includes(recherche)));
  }

  private chargerDossier(enfant: EnfantEspaceFamilleApi): void {
    this.chargementDossier.set(true);
    this.erreurDossier.set(null);
    this.api.dossierEleveEtablissement(enfant.type_code || 'primaire', enfant.campus_id, enfant.id).pipe(takeUntil(this.destroy$)).subscribe({
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
    return ['accueil', 'tableau-de-bord', 'emploi-du-temps', 'seances', 'matieres-programmes', 'notes-bulletins', 'absences', 'paiements', 'documents', 'messages', 'suivi-coran', 'profil'].includes(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
