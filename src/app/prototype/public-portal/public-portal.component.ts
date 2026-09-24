import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CentralApiService } from '../central-api.service';
import { LandingComponent } from '../landing/landing.component';
import { PrototypeDataService } from '../prototype-data.service';
import { SchoolSiteComponent } from '../school-site/school-site.component';
import { estDomainePlateforme } from '../../core/config/platform-domains';

@Component({
  selector: 'app-public-portal',
  imports: [LandingComponent, SchoolSiteComponent],
  templateUrl: './public-portal.component.html',
  styleUrl: './public-portal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPortalComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly data = inject(PrototypeDataService);
  readonly etat = signal<'chargement' | 'plateforme' | 'institut' | 'inconnu'>('chargement');

  ngOnInit(): void {
    const host = window.location.hostname.toLowerCase();
    if (estDomainePlateforme(host)) {
      this.etat.set('plateforme');
      return;
    }

    this.api.sitePublic(host).subscribe({
      next: ({ data }) => {
        this.data.remplacerWebsite(data.contenu);
        this.etat.set('institut');
      },
      error: () => this.etat.set('inconnu'),
    });
  }
}
