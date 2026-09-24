import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CentralApiService, SitePublicInstitut } from '../central-api.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';
import { estDomainePlateforme } from '../../core/config/platform-domains';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink, PlatformLanguageSwitcherComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  readonly site = signal<SitePublicInstitut | null>(null);
  readonly contextePret = signal(false);
  readonly demandeEnvoyee = signal(false);
  identifiant = '';

  ngOnInit(): void {
    const domaine = window.location.hostname.toLowerCase();
    if (estDomainePlateforme(domaine)) {
      this.contextePret.set(true);
      return;
    }
    this.api.sitePublic(domaine).subscribe({
      next: ({ data }) => { this.site.set(data); this.contextePret.set(true); },
      error: () => this.contextePret.set(true),
    });
  }

  demanderAssistance(): void {
    if (this.identifiant.trim()) this.demandeEnvoyee.set(true);
  }
}
