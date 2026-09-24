import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CentralApiService, SitePublicInstitut } from '../central-api.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';
import { estDomainePlateforme } from '../../core/config/platform-domains';

@Component({
  selector: 'app-account-activation',
  imports: [ReactiveFormsModule, RouterLink, PlatformLanguageSwitcherComponent],
  templateUrl: './account-activation.component.html',
  styleUrl: './account-activation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountActivationComponent implements OnInit {
  private readonly formulaire = inject(NonNullableFormBuilder);
  private readonly api = inject(CentralApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly etape = signal<'verification' | 'mot-de-passe'>('verification');
  readonly jetonActivation = signal<string | null>(null);
  readonly siteDuDomaine = signal<SitePublicInstitut | null>(null);
  readonly contextePret = signal(false);
  readonly instituts = signal<Array<{ id: string; nom: string; slug: string }>>([]);
  readonly verification = this.formulaire.group({
    institut_id: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s.-]{9,20}$/)]],
    code: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
  });
  readonly motDePasse = this.formulaire.group({
    mot_de_passe: ['', [Validators.required, Validators.minLength(4)]],
    confirmation: ['', Validators.required],
  });

  ngOnInit(): void {
    const institutId = this.route.snapshot.queryParamMap.get('institut_id');
    if (institutId) this.verification.controls.institut_id.setValue(institutId);

    this.api.etablissementsActivationCompte().subscribe({
      next: ({ data }) => this.instituts.set(data),
      error: () => this.erreur.set('La liste des établissements est momentanément indisponible.'),
    });

    const domaine = window.location.hostname.toLowerCase();
    if (!estDomainePlateforme(domaine)) {
      this.api.sitePublic(domaine).subscribe({
        next: ({ data }) => {
          this.siteDuDomaine.set(data);
          this.verification.controls.institut_id.setValue(data.institut_id);
          this.contextePret.set(true);
        },
        error: () => this.contextePret.set(true),
      });
    } else {
      this.contextePret.set(true);
    }
  }

  verifierCode(): void {
    if (this.verification.invalid || this.chargement()) {
      this.verification.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    const { institut_id, telephone, code } = this.verification.getRawValue();
    this.api.verifierCodeActivationCompte(institut_id, telephone, code).subscribe({
      next: ({ jeton_activation }) => { this.jetonActivation.set(jeton_activation); this.etape.set('mot-de-passe'); },
      error: (response) => this.erreur.set(response.error?.message ?? 'Le code de vérification est incorrect ou a expiré.'),
      complete: () => this.chargement.set(false),
    });
  }

  enregistrerMotDePasse(): void {
    if (this.motDePasse.invalid || !this.jetonActivation() || this.chargement()) { this.motDePasse.markAllAsTouched(); return; }
    const { mot_de_passe, confirmation } = this.motDePasse.getRawValue();
    if (mot_de_passe !== confirmation) { this.erreur.set('Les deux mots de passe ne sont pas identiques.'); return; }
    this.chargement.set(true); this.erreur.set(null);
    this.api.definirMotDePasseActivation(this.jetonActivation()!, mot_de_passe, confirmation).subscribe({
      next: () => this.router.navigate(['/connexion'], { queryParams: { institut_id: this.verification.controls.institut_id.value, activation: 'terminee' } }),
      error: (response) => this.erreur.set(response.error?.message ?? 'Le mot de passe n’a pas pu être enregistré.'),
      complete: () => this.chargement.set(false),
    });
  }

}
