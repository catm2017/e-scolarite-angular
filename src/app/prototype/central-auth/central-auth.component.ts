import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CentralApiService, InstitutConnexion, SitePublicInstitut } from '../central-api.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';
import { estDomainePlateforme } from '../../core/config/platform-domains';

@Component({
  selector: 'app-central-auth',
  imports: [ReactiveFormsModule, RouterLink, PlatformLanguageSwitcherComponent],
  templateUrl: './central-auth.component.html',
  styleUrl: './central-auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CentralAuthComponent implements OnInit {
  private readonly formulaire = inject(NonNullableFormBuilder);
  private readonly api = inject(CentralApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly chargement = signal(false);
  readonly passwordVisible = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly instituts = signal<InstitutConnexion[]>([]);
  readonly institutChoisi = signal('');
  readonly institutDuDomaine = signal<InstitutConnexion | null>(null);
  readonly siteDuDomaine = signal<SitePublicInstitut | null>(null);
  readonly contextePret = signal(false);
  readonly connexion = this.formulaire.group({
    institut_id: [''],
    identifiant: ['', Validators.required],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('session') === 'expiree') {
      this.erreur.set('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
    }
    const identifiant = this.route.snapshot.queryParamMap.get('identifiant') ?? this.route.snapshot.queryParamMap.get('email');
    const institutId = this.route.snapshot.queryParamMap.get('institut_id');
    if (identifiant) this.connexion.controls.identifiant.setValue(identifiant);

    this.api.institutsConnexion().subscribe({
      next: ({ data }) => {
        this.instituts.set(data);
        if (institutId && data.some((institut) => institut.id === institutId)) {
          this.choisirInstitut(institutId);
        }
      },
      error: () => this.erreur.set('La liste des établissements est momentanément indisponible.'),
    });

    const domaine = window.location.hostname.toLowerCase();
    if (!estDomainePlateforme(domaine)) {
      this.api.sitePublic(domaine).subscribe({
        next: ({ data }) => {
          this.siteDuDomaine.set(data);
          const institut = { id: data.institut_id, nom: data.nom, slug: data.slug, logo_url: data.logo_url };
          this.institutDuDomaine.set(institut);
          this.choisirInstitut(institut.id);
          this.contextePret.set(true);
        },
        error: () => this.contextePret.set(true),
      });
    } else {
      this.contextePret.set(true);
    }
  }

  choisirInstitut(institutId: string): void {
    this.institutChoisi.set(institutId);
    this.connexion.controls.institut_id.setValue(institutId);
  }

  soumettre(): void {
    if (this.connexion.invalid || this.chargement()) {
      this.connexion.markAllAsTouched();
      return;
    }

    this.erreur.set(null);
    this.chargement.set(true);
    const { identifiant, password, institut_id } = this.connexion.getRawValue();
    this.api.connexion(identifiant, password, institut_id || undefined, this.institutDuDomaine() ? window.location.hostname : undefined).subscribe({
      next: (result) => this.router.navigateByUrl(
        result.espace === 'centrale'
          ? '/saas'
          : result.user.type === 'enseignant'
            ? '/enseignant'
          : !result.souscription_validee
            ? '/institut?vue=souscription'
            : '/institut',
      ),
      error: () => {
        this.erreur.set('Les informations de connexion sont incorrectes. Vérifiez votre e-mail ou identifiant, votre mot de passe et, si nécessaire, l’établissement sélectionné, puis réessayez.');
        this.chargement.set(false);
      },
      complete: () => this.chargement.set(false),
    });
  }
}
