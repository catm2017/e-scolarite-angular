import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
  readonly packages = signal<PackageTarification[]>([]);
  readonly activeDemoSlide = signal(0);
  readonly partners = signal<InstitutConnexion[]>([]);
  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  readonly features = [
    {
      icon: 'school',
      title: 'Scolarité sénégalaise',
      text: 'Du préscolaire à l’université, avec périodes, évaluations et bulletins adaptés à chaque cycle.',
    },
    {
      icon: 'payments',
      title: 'Finances automatisées',
      text: 'Échéanciers, mensualités, reçus, relances et suivi des impayés sans ressaisie.',
    },
    {
      icon: 'menu_book',
      title: 'Programmes et séances',
      text: 'Organisez les leçons, préparez les emplois du temps et suivez le cahier de texte.',
    },
    {
      icon: 'groups',
      title: 'Équipes et familles',
      text: 'Retrouvez les dossiers des élèves, tuteurs, enseignants et personnels dans leur contexte.',
    },
    {
      icon: 'domain',
      title: 'Campus et établissements',
      text: 'Pilotez vos structures ensemble tout en conservant un espace dédié à chaque cycle.',
    },
    {
      icon: 'language',
      title: 'Votre site web',
      text: 'Chaque établissement publie simplement son site vitrine depuis son back-office.',
    },
  ];


  readonly demoSlides = [
    { icon: 'space_dashboard', title: 'Pilotez tout votre institut', text: 'Une vue consolidée sur vos campus, établissements, équipes et indicateurs.' },
    { icon: 'auto_stories', title: 'Suivez chaque apprentissage', text: 'Programmes, séances, évaluations et bulletins restent liés à l’année scolaire.' },
    { icon: 'account_balance_wallet', title: 'Gardez vos finances lisibles', text: 'Tarifs, encaissements, dépenses et relances réunis dans un même espace.' },
  ];

  ngOnInit(): void {
    this.api.institutsConnexion().subscribe({ next: ({ data }) => this.partners.set(data), error: () => this.partners.set([]) });
    this.api.packagesPublics().subscribe({
      next: ({ data }) => this.packages.set(data),
      error: () => this.packages.set([]),
    });
  }

  featureLabel(code: string): string {
    return code.replace(/^gestion_/, '').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
  }

}
