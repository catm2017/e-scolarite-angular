import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';

@Component({
  selector: 'app-saas-console',
  imports: [RouterLink, DecimalPipe, PlatformLanguageSwitcherComponent],
  templateUrl: './saas-console.component.html',
  styleUrl: './saas-console.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaasConsoleComponent {
  readonly activeView = signal<'dashboard' | 'pricing' | 'schools'>('dashboard');

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
}
