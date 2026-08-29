import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, PlatformLanguageSwitcherComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
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
      title: 'Espace Daara',
      text: 'Lecture, mémorisation, récitation et programmes de révision individualisés.',
    },
    {
      icon: 'forum',
      title: 'Communication simple',
      text: 'Notifications et WhatsApp pour rapprocher l’école, les familles et les équipes.',
    },
    {
      icon: 'auto_awesome',
      title: 'Assistant intelligent',
      text: 'Des suggestions et automatisations contrôlées pour gagner du temps au quotidien.',
    },
    {
      icon: 'language',
      title: 'Site web inclus',
      text: 'Chaque établissement publie simplement son site vitrine depuis son back-office.',
    },
  ];

  readonly modules = [
    { label: 'Socle E‑Scolarité', price: '15 000', active: true },
    { label: 'Finance & paiements', price: '7 500', active: true },
    { label: 'Emplois du temps', price: '5 000', active: true },
    { label: 'Site web établissement', price: '3 500', active: true },
  ];
}
