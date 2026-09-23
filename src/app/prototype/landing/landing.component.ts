import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';
import { CentralApiService, InstitutConnexion, PackageTarification } from '../central-api.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, DecimalPipe, PlatformLanguageSwitcherComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  readonly pricingTrack = viewChild<ElementRef<HTMLElement>>('pricingTrack');
  readonly packages = signal<PackageTarification[]>([]);
  readonly packagesLoading = signal(true);
  readonly packagesError = signal(false);
  readonly partners = signal<InstitutConnexion[]>([]);
  readonly mobileMenuOpen = signal(false);
  readonly allFeaturesVisible = signal(false);
  readonly partnersPaused = signal(false);
  readonly activePackage = signal(0);
  readonly currentYear = new Date().getFullYear();
  readonly assetPath = 'assets/images/landing-v3/';

  readonly features = [
    { code: 'gestion_eleves', title: 'Gestion des élèves', image: 'Student Management.svg', text: 'Un dossier complet pour chaque élève et ses tuteurs.' },
    { code: 'gestion_classes', title: 'Gestion des classes', image: 'Academics Management.svg', text: 'Organisez vos classes et leurs matières par année scolaire.' },
    { code: 'gestion_enseignants', title: 'Gestion des enseignants', image: 'Teacher Management.svg', text: 'Retrouvez les équipes, leurs affectations et leurs dossiers.' },
    { code: 'gestion_emplois_temps', title: 'Gestion des emplois du temps', image: 'Timetable Management.svg', text: 'Réunissez les matières, les enseignants et les salles.' },
    { code: 'gestion_suivi_programme_cahier_texte', title: 'Programmes et cahier de texte', image: 'Lesson Management.svg', text: 'Préparez les leçons et suivez la progression des apprentissages.' },
    { code: 'gestion_presences', title: 'Gestion des présences', image: 'Attendance Management.svg', text: 'Suivez les présences des élèves et de vos équipes.' },
    { code: 'gestion_evaluations', title: 'Gestion des évaluations', image: 'Exam Management.svg', text: 'Organisez les devoirs, les compositions et leurs résultats.' },
    { code: 'gestion_finance', title: 'Gestion des finances', image: 'Fees Management.svg', text: 'Gardez une vue claire sur les encaissements et les dépenses.' },
    { code: 'gestion_site_web', title: 'Gestion du site web', image: 'Website Management.svg', text: 'Créez un site à l’image de votre institut, simplement.' },
    { code: 'gestion_personnels', title: 'Gestion du personnel', image: 'Staff Management.svg', text: 'Centralisez les dossiers, les présences et les salaires.' },
    { code: 'gestion_seances', title: 'Gestion des séances', image: 'Session Year Management.svg', text: 'Générez les séances et renseignez le cahier de texte.' },
    { code: 'gestion_matieres', title: 'Gestion des matières', image: 'Academics Management.svg', text: 'Adaptez les matières et les barèmes à chaque enseignement.' },
    { code: 'gestion_inscriptions_reinscriptions', title: 'Inscriptions et réinscriptions', image: 'Student Management.svg', text: 'Accompagnez le parcours des élèves d’une année à l’autre.' },
  ];
  readonly visibleFeatures = computed(() => this.allFeaturesVisible() ? this.features : this.features.slice(0, 9));
  // Le comparatif utilise exclusivement les fonctionnalités des offres publiées.
  readonly packageFeatures = computed(() => [...new Set(this.packages().flatMap((offer) => offer.fonctionnalites_codes))]);

  ngOnInit(): void {
    this.api.institutsConnexion().subscribe({ next: ({ data }) => this.partners.set(data), error: () => this.partners.set([]) });
    this.loadPackages();
  }

  loadPackages(): void {
    this.packagesLoading.set(true);
    this.packagesError.set(false);
    this.api.packagesPublics().subscribe({
      next: ({ data }) => { this.packages.set(data); this.packagesLoading.set(false); },
      error: () => { this.packagesError.set(true); this.packagesLoading.set(false); },
    });
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    this.mobileMenuOpen.set(false);
    document.getElementById(id)?.scrollIntoView({ behavior: this.scrollBehavior(), block: 'start' });
  }

  movePricing(direction: number): void {
    const track = this.pricingTrack()?.nativeElement;
    if (!track) return;
    const step = track.querySelector<HTMLElement>('.landing-package')?.offsetWidth ?? track.clientWidth;
    track.scrollBy({ left: direction * (step + 28), behavior: this.scrollBehavior() });
  }

  selectPackage(index: number): void {
    const track = this.pricingTrack()?.nativeElement;
    const card = track?.querySelectorAll<HTMLElement>('.landing-package')[index];
    if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: this.scrollBehavior() });
  }

  updatePricingPosition(): void {
    const track = this.pricingTrack()?.nativeElement;
    const width = track?.querySelector<HTMLElement>('.landing-package')?.offsetWidth ?? 1;
    this.activePackage.set(Math.round(Math.abs(track?.scrollLeft ?? 0) / (width + 28)));
  }

  featureLabel(code: string): string {
    const label = this.features.find((feature) => feature.code === code)?.title;
    if (label) return label;
    const labels: Record<string, string> = {
      gestion_bulletins_notes: 'Gestion des notes et bulletins',
      gestion_finances: 'Gestion des finances', gestion_site: 'Gestion du site web',
      gestion_transferts_eleves: 'Transferts des élèves', gestion_utilisateurs: 'Gestion des utilisateurs',
      gestion_roles_permissions: 'Rôles et permissions', gestion_tracabilite: 'Journal d’activité',
    };
    return labels[code] ?? code.replace(/^gestion_/, '').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
  }

  currencyLabel(currency: string): string { return currency === 'XOF' || currency === 'CFA' ? 'F CFA' : currency; }

  hideBrokenLogo(event: Event): void { (event.target as HTMLImageElement).hidden = true; }

  private scrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
}
