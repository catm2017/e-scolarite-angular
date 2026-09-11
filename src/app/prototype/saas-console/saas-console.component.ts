import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';
import {
  AnneeScolaireCentrale,
  CentralApiService,
  DemandeAdhesion,
  TarificationFonctionnalite,
  TypeEtablissementCatalogue,
} from '../central-api.service';

@Component({
  selector: 'app-saas-console',
  imports: [RouterLink, DecimalPipe, FormsModule, PlatformLanguageSwitcherComponent],
  templateUrl: './saas-console.component.html',
  styleUrl: './saas-console.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaasConsoleComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly router = inject(Router);

  readonly activeView = signal<'dashboard' | 'pricing' | 'schools' | 'adhesions' | 'academic-years'>('dashboard');
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
  readonly anneesScolaires = signal<AnneeScolaireCentrale[]>([]);
  readonly anneeScolaireEnEdition = signal<AnneeScolaireCentrale | null>(null);
  readonly enregistrementAnneeScolaire = signal(false);

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

  ngOnInit(): void {
    if (!this.api.estConnecte()) {
      this.router.navigateByUrl('/connexion');
      return;
    }

    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.api.invaliderCache('centrale:');
    this.api.tableauBord().subscribe({ next: (metrics) => this.metrics.set(metrics), error: () => this.gererSessionExpiree() });
    this.api.demandesAdhesion().subscribe({ next: ({ data }) => this.demandes.set(data), error: () => this.gererSessionExpiree() });
    this.api.catalogueFonctionnalites().subscribe({
      next: ({ types, data }) => {
        this.catalogueTypes.set(types);
        this.catalogueFonctionnalites.set(data);
        if (!types.some((type) => type.code === this.catalogueTypeActif())) {
          this.catalogueTypeActif.set(types[0]?.code ?? '');
        }
      },
      error: () => this.gererSessionExpiree(),
    });
    this.api.anneesScolairesCentrales().subscribe({
      next: ({ data }) => this.anneesScolaires.set(data),
      error: () => this.gererSessionExpiree(),
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
    this.api.enregistrerTarificationFonctionnalite(item.id, item.prix_mensuel, item.actif).subscribe({
      next: () => this.tarificationEnCours.set(null),
      error: () => {
        this.erreur.set('La tarification n’a pas pu être enregistrée.');
        this.tarificationEnCours.set(null);
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
      error: () => this.gererSessionExpiree(),
    });
  }

  private gererSessionExpiree(): void {
    this.api.effacerSession();
    this.router.navigateByUrl('/connexion');
  }
}
