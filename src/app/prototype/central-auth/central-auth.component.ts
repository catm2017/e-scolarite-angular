import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CentralApiService, InstitutConnexion } from '../central-api.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';

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
  readonly connexion = this.formulaire.group({
    institut_id: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('session') === 'expiree') {
      this.erreur.set('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
    }
    this.api.institutsConnexion().subscribe({
      next: ({ data }) => this.instituts.set(data),
      error: () => this.erreur.set('La liste des établissements est momentanément indisponible.'),
    });
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
    const { email, password, institut_id } = this.connexion.getRawValue();
    this.api.connexion(email, password, institut_id || undefined).subscribe({
      next: (result) => this.router.navigateByUrl(
        result.espace === 'centrale'
          ? '/saas'
          : !result.souscription_validee
            ? '/institut?vue=souscription'
            : '/institut',
      ),
      error: () => {
        this.erreur.set('Les informations de connexion sont incorrectes. Vérifiez votre adresse e-mail, votre mot de passe et, si nécessaire, l’établissement sélectionné, puis réessayez.');
        this.chargement.set(false);
      },
      complete: () => this.chargement.set(false),
    });
  }
}
