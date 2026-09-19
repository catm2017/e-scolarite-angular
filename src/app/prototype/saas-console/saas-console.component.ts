import { ChangeDetectionStrategy, Component, OnInit, effect, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MasterTableComponent, ColumnDefinition } from '../../shared/components/master-table/master-table.component';
import {
  AnneeScolaireCentrale,
  AbonnementSaas,
  CentralApiService,
  DemandeAdhesion,
  FactureSouscriptionSaas,
  PackageTarification,
  PackageTarificationPayload,
  InstitutSaas,
  InstitutActivationCompte,
  TarificationFonctionnalite,
  TypeEtablissementCatalogue,
} from '../central-api.service';

@Component({
  selector: 'app-saas-console',
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule, MasterTableComponent, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  templateUrl: './saas-console.component.html',
  styleUrl: './saas-console.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaasConsoleComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly router = inject(Router);

  readonly activeView = signal<'dashboard' | 'pricing' | 'schools' | 'adhesions' | 'account-activations' | 'academic-years' | 'subscription-invoices' | 'subscription-history'>('dashboard');
  readonly demandes = signal<DemandeAdhesion[]>([]);
  readonly traitementId = signal<string | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly metrics = signal({ instituts_actifs: 0, adhesions_en_attente: 0, essais_en_cours: 0, revenu_mensuel: 0 });
  readonly user = signal(this.api.utilisateur());
  readonly catalogueFonctionnalites = signal<TarificationFonctionnalite[]>([]);
  readonly catalogueTypes = signal<TypeEtablissementCatalogue[]>([]);
  readonly catalogueTypeActif = signal('primaire');
  readonly fonctionnalitesFiltrees = computed(() => this.catalogueFonctionnalites()
    .filter((item) => item.type_etablissement_id === this.catalogueTypes().find((type) => type.code === this.catalogueTypeActif())?.id));
  readonly tarificationEnCours = signal<string | null>(null);
  readonly packages = signal<PackageTarification[]>([]);
  readonly packageEnEdition = signal<(PackageTarificationPayload & { id: string | null }) | null>(null);
  readonly packageEnregistrement = signal(false);
  readonly anneesScolaires = signal<AnneeScolaireCentrale[]>([]);
  readonly anneeScolaireEnEdition = signal<AnneeScolaireCentrale | null>(null);
  readonly enregistrementAnneeScolaire = signal(false);
  readonly activationsComptes = signal<InstitutActivationCompte[]>([]);
  readonly institutActivationId = signal('');
  readonly activationEnCours = signal(false);
  readonly activationFeedback = signal<string | null>(null);
  readonly lienActivation = `${window.location.origin}/#/activation-compte`;

  /* Legacy demonstration data removed from the visible dashboard. */
  readonly modules = [
    { name: 'Socle E‑Scolarité', category: 'Essentiel', price: 15000, clients: 38, enabled: true },
    { name: 'Finance scolaire', category: 'Gestion', price: 7500, clients: 31, enabled: true },
    { name: 'Emplois du temps', category: 'Pédagogie', price: 5000, clients: 27, enabled: true },
    { name: 'Site web établissement', category: 'Communication', price: 3500, clients: 19, enabled: true },
    { name: 'Espace Daara', category: 'Enseignement religieux', price: 6000, clients: 12, enabled: true },
    { name: 'Assistant IA', category: 'Automatisation', price: 5000, clients: 8, enabled: false },
  ];

  readonly schools = [
    { initials: 'JS', name: 'Institut Le Joyau du Savoir', city: 'Keur Massar', plan: '4 modules', students: 684, amount: 31000, status: 'Actif', color: '#2F80ED' },
    { initials: 'LM', name: 'Groupe scolaire Les Mimosas', city: 'Thiès', plan: '3 modules', students: 421, amount: 27500, status: 'Essai', color: '#8665c5' },
    { initials: 'AN', name: 'Académie Nourou', city: 'Saint-Louis', plan: '5 modules', students: 1190, amount: 38000, status: 'Actif', color: '#d17b45' },
    { initials: 'SD', name: 'School of Digital Dakar', city: 'Dakar', plan: '2 modules', students: 208, amount: 22500, status: 'À relancer', color: '#477fc5' },
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly pricingTab = signal<'features' | 'packages'>('features');
  readonly tarifEnEdition = signal<TarificationFonctionnalite | null>(null);
  readonly demandeEnDetail = signal<DemandeAdhesion | null>(null);
  readonly institutEnDetail = signal<{ institut: InstitutSaas; abonnement_actuel: AbonnementSaas | null; abonnements: AbonnementSaas[] } | null>(null);
  readonly tarifsSource = new MatTableDataSource<TarificationFonctionnalite>();
  readonly packagesSource = new MatTableDataSource<PackageTarification>();
  readonly anneesSource = new MatTableDataSource<AnneeScolaireCentrale>();
  readonly demandesSource = new MatTableDataSource<DemandeAdhesion>();
  readonly etablissements = signal<InstitutSaas[]>([]);
  readonly etablissementsSource = new MatTableDataSource<InstitutSaas>();
  readonly abonnements = signal<AbonnementSaas[]>([]);
  readonly abonnementsSource = new MatTableDataSource<AbonnementSaas>();
  readonly detailAbonnementsSource = new MatTableDataSource<AbonnementSaas>();
  readonly facturesSouscriptions = signal<FactureSouscriptionSaas[]>([]);
  readonly facturesSouscriptionsSource = new MatTableDataSource<FactureSouscriptionSaas & { etat_paiement: string }>();
  readonly factureARegler = signal<FactureSouscriptionSaas | null>(null);
  readonly reglementFactureEnCours = signal(false);
  readonly pageTitle = computed(() => ({
    dashboard: 'Vue d’ensemble', pricing: 'Tarification et packages', schools: 'Instituts',
    adhesions: 'Demandes d’adhésion', 'account-activations': 'Activations de comptes', 'academic-years': 'Années scolaires', 'subscription-invoices': 'Factures de souscription', 'subscription-history': 'Historique des abonnements',
  })[this.activeView()]);
  private columns(items: [string, string, ColumnDefinition['type']][]): ColumnDefinition[] {
    return items.map(([def, label, type]) => ({ def, label, type, visible: true, sortable: type !== 'actionBtn' }));
  }
  readonly tarifsColumns = this.columns([
    ['fonctionnalite', 'Fonctionnalité', 'text'], ['prix_unitaire_jour', 'F CFA / jour', 'number'],
    ['prix_unitaire_eleve', 'F CFA / élève', 'number'], ['prix_unitaire_personnel', 'F CFA / collaborateur', 'number'],
    ['actif', 'Disponible', 'check'], ['actions', 'Actions', 'actionBtn'],
  ]);
  readonly packagesColumns = this.columns([
    ['libelle', 'Package', 'text'], ['types_etablissements', 'Établissements', 'text'],
    ['duree_jours', 'Durée (jours)', 'number'], ['prix_unitaire_eleve', 'F CFA / élève', 'number'],
    ['prix_unitaire_personnel', 'F CFA / collaborateur', 'number'], ['actif', 'Actif', 'check'], ['actions', 'Actions', 'actionBtn'],
  ]);
  readonly anneesColumns = this.columns([
    ['libelle', 'Année scolaire', 'text'], ['statut', 'Statut', 'text'],
    ['est_courante', 'Année courante', 'check'], ['actions', 'Actions', 'actionBtn'],
  ]);
  readonly demandesColumns = this.columns([
    ['nom_institut', 'Institut', 'text'], ['ville', 'Ville', 'text'],
    ['prenom_responsable', 'Prénom', 'text'], ['nom_responsable', 'Nom', 'text'],
    ['identifiant_responsable', 'E-mail / identifiant', 'text'], ['telephone_responsable', 'Téléphone', 'phone'], ['statut', 'Statut', 'text'],
    ['actions', 'Consulter', 'actionBtn'],
  ]);
  readonly etablissementsColumns: ColumnDefinition[] = [
    { def: 'nom', label: 'Institut', type: 'text', visible: true, sortable: true },
    { def: 'prenom_responsable', label: 'Prénom responsable', type: 'text', visible: true, sortable: true },
    { def: 'nom_responsable', label: 'Nom responsable', type: 'text', visible: true, sortable: true },
    { def: 'email_responsable', label: 'Adresse e-mail', type: 'email', visible: true, sortable: true },
    { def: 'telephone_responsable', label: 'Téléphone', type: 'phone', visible: true, sortable: true },
    { def: 'abonnement_en_cours', label: 'Abonnement en cours', type: 'text', visible: true, sortable: true },
    { def: 'actions', label: 'Détails', type: 'actionBtn', visible: true, sortable: false },
  ];
  readonly abonnementsColumns: ColumnDefinition[] = [
    { def: 'institut', label: 'Institut', type: 'text', visible: true, sortable: true },
    { def: 'offre', label: 'Package / offre', type: 'text', visible: true, sortable: true },
    { def: 'date_debut', label: 'Début', type: 'date', visible: true, sortable: true },
    { def: 'date_fin', label: 'Fin', type: 'date', visible: true, sortable: true },
    { def: 'montant_actuel', label: 'Montant', type: 'number', visible: true, sortable: true },
    { def: 'etat_abonnement', label: 'Abonnement', type: 'status', visible: true, sortable: true, statusBadgeMap: { 'En cours': 'badge badge-solid-green', Expiré: 'badge badge-solid-red', Interrompu: 'badge badge-solid-orange' } },
    { def: 'etat_paiement', label: 'Paiement', type: 'status', visible: true, sortable: true, statusBadgeMap: { Payé: 'badge badge-solid-green', 'À payer': 'badge badge-solid-red', 'À facturer': 'badge badge-solid-orange' } },
  ];
  readonly facturesSouscriptionsColumns: ColumnDefinition[] = [
    { def: 'numero', label: 'Facture', type: 'text', visible: true, sortable: true },
    { def: 'institut', label: 'Institut', type: 'text', visible: true, sortable: true },
    { def: 'montant_ttc', label: 'Montant TTC', type: 'number', visible: true, sortable: true },
    { def: 'emise_at', label: 'Émise le', type: 'date', visible: true, sortable: true },
    { def: 'echeance_at', label: 'Échéance', type: 'date', visible: true, sortable: true },
    { def: 'etat_paiement', label: 'État', type: 'status', visible: true, sortable: true, statusBadgeMap: { Payé: 'badge badge-solid-green', 'À régler': 'badge badge-solid-red' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true, sortable: false },
  ];
  constructor() {
    effect(() => { this.tarifsSource.data = this.fonctionnalitesFiltrees(); });
    effect(() => { this.packagesSource.data = this.packages(); });
    effect(() => { this.anneesSource.data = this.anneesScolaires(); });
    effect(() => {
      this.demandesSource.data = this.demandes();
      this.etablissementsSource.data = this.etablissements();
    });
    effect(() => { this.abonnementsSource.data = this.abonnements(); });
    effect(() => { this.facturesSouscriptionsSource.data = this.facturesSouscriptions().map((facture) => ({
      ...facture,
      etat_paiement: facture.statut === 'reglee' ? 'Payé' : 'À régler',
    })); });
  }
  modifierTarif(item: TarificationFonctionnalite): void {
    this.tarifEnEdition.set({ ...item });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setView(view: string): void {
    const paths: Record<string, string> = { dashboard: 'tableau-de-bord', pricing: 'tarification',
      schools: 'etablissements', adhesions: 'adhesions', 'account-activations': 'activations-comptes', 'academic-years': 'annees-scolaires', 'subscription-invoices': 'factures-souscriptions', 'subscription-history': 'abonnements' };
    void this.router.navigate(['/saas', paths[view] ?? 'tableau-de-bord']);
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const views = { 'tableau-de-bord': 'dashboard', tarification: 'pricing', etablissements: 'schools',
        adhesions: 'adhesions', 'activations-comptes': 'account-activations', 'annees-scolaires': 'academic-years', 'factures-souscriptions': 'subscription-invoices', abonnements: 'subscription-history' } as const;
      this.activeView.set(views[params.get('vue') as keyof typeof views] ?? 'dashboard');
    });

    if (!this.api.estConnecte()) {
      this.router.navigateByUrl('/connexion');
      return;
    }

    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.api.invaliderCache('centrale:');
    this.api.tableauBord().subscribe({ next: (metrics) => this.metrics.set(metrics), error: (error) => this.gererSessionExpiree(error) });
    this.api.demandesAdhesion().subscribe({ next: ({ data }) => this.demandes.set(data), error: (error) => this.gererSessionExpiree(error) });
    this.api.institutsSaas().subscribe({ next: ({ data }) => this.etablissements.set(data), error: (error) => this.gererSessionExpiree(error) });
    this.api.activationsComptesSaas().subscribe({
      next: ({ data }) => {
        this.activationsComptes.set(data);
        if (!data.some((item) => item.id === this.institutActivationId())) this.institutActivationId.set(data[0]?.id ?? '');
      },
      error: (error) => this.gererSessionExpiree(error),
    });
    this.api.abonnementsSaas().subscribe({ next: ({ data }) => this.abonnements.set(data), error: (error) => this.gererSessionExpiree(error) });
    this.api.catalogueFonctionnalites().subscribe({
      next: ({ types, data }) => {
        this.catalogueTypes.set(types);
        this.catalogueFonctionnalites.set(data);
        if (!types.some((type) => type.code === this.catalogueTypeActif())) {
          this.catalogueTypeActif.set(types[0]?.code ?? '');
        }
      },
      error: (error) => this.gererSessionExpiree(error),
    });
    this.api.packagesTarification().subscribe({
      next: ({ data }) => this.packages.set(data),
      error: (error) => this.gererSessionExpiree(error),
    });
    this.api.anneesScolairesCentrales().subscribe({
      next: ({ data }) => this.anneesScolaires.set(data),
      error: (error) => this.gererSessionExpiree(error),
    });
    this.api.facturesSouscriptionsSaas().subscribe({
      next: ({ data }) => this.facturesSouscriptions.set(data.data),
      error: (error) => this.gererSessionExpiree(error),
    });
  }

  reglerFactureSouscription(facture: FactureSouscriptionSaas): void {
    if (facture.statut === 'reglee') return;
    this.factureARegler.set(facture);
  }

  ouvrirDetailInstitut(institut: InstitutSaas): void {
    this.api.detailInstitutSaas(institut.id).subscribe({
      next: (detail) => {
        this.institutEnDetail.set(detail);
        this.detailAbonnementsSource.data = detail.abonnements;
      },
      error: (error) => this.gererSessionExpiree(error),
    });
  }

  confirmerReglementFacture(): void {
    const facture = this.factureARegler();
    if (!facture || this.reglementFactureEnCours()) return;
    this.reglementFactureEnCours.set(true);
    this.api.reglerFactureSouscriptionSaas(facture.id).subscribe({
      next: () => {
        this.factureARegler.set(null);
        this.chargerDonnees();
      },
      error: () => this.erreur.set('La facture n’a pas pu être confirmée comme réglée.'),
      complete: () => this.reglementFactureEnCours.set(false),
    });
  }

  approuver(demande: DemandeAdhesion): void {
    if (this.traitementId() || demande.statut !== 'soumise') return;

    this.erreur.set(null);
    this.traitementId.set(demande.id);
    this.api.approuverDemande(demande.id).subscribe({
      next: () => this.chargerDonnees(),
      error: (response) => this.erreur.set(response.error?.message ?? 'L’approbation a échoué.'),
      complete: () => this.traitementId.set(null),
    });
  }

  envoyerCodeActivation(): void {
    const institutId = this.institutActivationId();
    if (!institutId || this.activationEnCours()) return;
    this.erreur.set(null);
    this.activationFeedback.set(null);
    this.activationEnCours.set(true);
    this.api.envoyerCodeActivationSaas(institutId).subscribe({
      next: ({ message }) => {
        this.activationFeedback.set(message);
        this.chargerDonnees();
      },
      error: (response) => this.erreur.set(response.error?.message ?? 'Le code d’activation n’a pas pu être envoyé.'),
      complete: () => this.activationEnCours.set(false),
    });
  }

  lienActivationPourInstitut(): string {
    const institutId = this.institutActivationId();
    return institutId ? `${this.lienActivation}?institut_id=${encodeURIComponent(institutId)}` : this.lienActivation;
  }

  deconnexion(): void {
    this.api.deconnexion().subscribe({
      next: () => this.router.navigateByUrl('/connexion'),
      error: () => {
        this.api.effacerSession();
        this.router.navigateByUrl('/connexion');
      },
    });
  }

  enregistrerTarification(item: TarificationFonctionnalite): void {
    if (this.tarificationEnCours()) return;
    this.tarificationEnCours.set(item.id);
    this.api.enregistrerTarificationFonctionnalite(item.id, item.prix_unitaire_jour, item.prix_unitaire_eleve, item.prix_unitaire_personnel, item.actif).subscribe({
      next: () => {
        this.tarificationEnCours.set(null);
        this.tarifEnEdition.set(null);
        this.catalogueFonctionnalites.update(items => items.map(current => current.id === item.id ? { ...item } : current));
      },
      error: () => {
        this.erreur.set('La tarification n’a pas pu être enregistrée.');
        this.tarificationEnCours.set(null);
      },
    });
  }

  nouveauPackage(): void {
    this.pricingTab.set('packages');
    const type = this.catalogueTypes().find((item) => item.code === this.catalogueTypeActif());
    this.packageEnEdition.set({
      id: null,
      code: '',
      libelle: '',
      description: null,
      actif: true,
      type_etablissement_ids: type ? [type.id] : [],
      duree_jours: 30,
      prix_unitaire_eleve: 500,
      prix_unitaire_personnel: 1000,
      fonctionnalites_types_ids: [],
    });
  }

  modifierPackage(item: PackageTarification): void {
    const fonctionnalites = this.catalogueFonctionnalites()
      .filter((fonctionnalite) => item.type_etablissement_ids.includes(fonctionnalite.type_etablissement_id) && item.fonctionnalites_codes.includes(fonctionnalite.code))
      .map((fonctionnalite) => fonctionnalite.id);
    this.packageEnEdition.set({
      id: item.id,
      code: item.code,
      libelle: item.libelle,
      description: item.description,
      actif: item.actif,
      type_etablissement_ids: [...item.type_etablissement_ids],
      duree_jours: item.duree_jours,
      prix_unitaire_eleve: item.prix_unitaire_eleve,
      prix_unitaire_personnel: item.prix_unitaire_personnel,
      fonctionnalites_types_ids: fonctionnalites,
    });
  }

  fonctionnalitesPackageParType(): Array<{
    type: TypeEtablissementCatalogue;
    fonctionnalites: TarificationFonctionnalite[];
  }> {
    const edition = this.packageEnEdition();
    if (!edition) return [];
    return this.catalogueTypes()
      .filter((type) => edition.type_etablissement_ids.includes(type.id))
      .map((type) => ({
        type,
        fonctionnalites: this.catalogueFonctionnalites()
          .filter((item) => item.type_etablissement_id === type.id)
          .sort((a, b) => a.ordre - b.ordre),
      }));
  }

  fonctionnalitePackageSelectionnee(code: string): boolean {
    const edition = this.packageEnEdition();
    if (!edition) return false;
    return this.catalogueFonctionnalites()
      .filter((item) =>
        item.code === code
        && edition.type_etablissement_ids.includes(item.type_etablissement_id),
      )
      .some((item) => edition.fonctionnalites_types_ids.includes(item.id));
  }

  basculerTypePackage(id: string): void {
    this.packageEnEdition.update((edition) => !edition ? edition : {
      ...edition,
      type_etablissement_ids: edition.type_etablissement_ids.includes(id)
        ? edition.type_etablissement_ids.filter((item) => item !== id)
        : [...edition.type_etablissement_ids, id],
      fonctionnalites_types_ids: edition.fonctionnalites_types_ids.filter((fonctionnaliteId) => {
        const fonctionnalite = this.catalogueFonctionnalites().find((item) => item.id === fonctionnaliteId);
        return fonctionnalite ? (edition.type_etablissement_ids.includes(id)
          ? fonctionnalite.type_etablissement_id !== id
          : true) : false;
      }),
    });
  }

  basculerFonctionnalitePackage(id: string): void {
    this.packageEnEdition.update((edition) => {
      if (!edition) return edition;
      const fonctionnalite = this.catalogueFonctionnalites().find((item) => item.id === id);
      if (!fonctionnalite) return edition;
      const idsDuPackage = this.catalogueFonctionnalites()
        .filter((item) => item.code === fonctionnalite.code && edition.type_etablissement_ids.includes(item.type_etablissement_id))
        .map((item) => item.id);
      const dejaSelectionnee = idsDuPackage.some((item) => edition.fonctionnalites_types_ids.includes(item));
      return {
        ...edition,
        fonctionnalites_types_ids: dejaSelectionnee
          ? edition.fonctionnalites_types_ids.filter((item) => !idsDuPackage.includes(item))
          : [...new Set([...edition.fonctionnalites_types_ids, ...idsDuPackage])],
      };
    });
  }

  enregistrerPackage(): void {
    const edition = this.packageEnEdition();
    if (!edition || this.packageEnregistrement()) return;
    if (!edition.code.trim() || !edition.libelle.trim() || !edition.type_etablissement_ids.length || !edition.fonctionnalites_types_ids.length) {
      this.erreur.set('Renseignez le package et sélectionnez au moins une fonctionnalité.');
      return;
    }
    this.packageEnregistrement.set(true);
    const { id, ...payload } = edition;
    this.api.enregistrerPackageTarification(payload, id ?? undefined).subscribe({
      next: () => {
        this.packageEnEdition.set(null);
        this.packageEnregistrement.set(false);
        this.chargerDonnees();
      },
      error: (response) => {
        this.erreur.set(response.error?.message ?? 'Le package n’a pas pu être enregistré.');
        this.packageEnregistrement.set(false);
      },
    });
  }

  nouvelleAnneeScolaire(): void {
    this.erreur.set(null);
    this.anneeScolaireEnEdition.set({
      id: '',
      libelle: '',
      statut: 'ouverte',
      est_courante: !this.anneesScolaires().some((annee) => annee.est_courante),
    });
  }

  modifierAnneeScolaire(annee: AnneeScolaireCentrale): void {
    this.erreur.set(null);
    this.anneeScolaireEnEdition.set({ ...annee });
  }

  annulerEditionAnneeScolaire(): void {
    this.anneeScolaireEnEdition.set(null);
  }

  enregistrerAnneeScolaire(): void {
    const annee = this.anneeScolaireEnEdition();
    if (!annee || this.enregistrementAnneeScolaire()) return;

    const libelle = annee.libelle.trim();
    if (!libelle) {
      this.erreur.set('Saisissez le libellé de l’année scolaire.');
      return;
    }

    this.enregistrementAnneeScolaire.set(true);
    const requete = annee.id
      ? this.api.mettreAJourAnneeScolaireCentrale({ ...annee, libelle })
      : this.api.creerAnneeScolaireCentrale(libelle, annee.est_courante);

    requete.subscribe({
      next: () => {
        this.anneeScolaireEnEdition.set(null);
        this.enregistrementAnneeScolaire.set(false);
        this.chargerAnneesScolaires();
      },
      error: (response) => {
        this.erreur.set(response.error?.message ?? 'L’année scolaire n’a pas pu être enregistrée.');
        this.enregistrementAnneeScolaire.set(false);
      },
    });
  }

  private chargerAnneesScolaires(): void {
    this.api.anneesScolairesCentrales().subscribe({
      next: ({ data }) => this.anneesScolaires.set(data),
      error: (error) => this.gererSessionExpiree(error),
    });
  }

  private gererSessionExpiree(error?: { status: number }): void {
    if (error && error.status !== 401 && error.status !== 419) {
      this.erreur.set('Les données ne sont pas disponibles pour le moment. Veuillez réessayer.');
      return;
    }
    this.api.effacerSession();
    this.router.navigateByUrl('/connexion');
  }
}
