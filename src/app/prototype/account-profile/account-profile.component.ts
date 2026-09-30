import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CentralApiService, ProfilCompteApi } from '../central-api.service';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfileComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly router = inject(Router);
  readonly espace = this.router.url.startsWith('/saas') ? 'centrale' : 'institut' as 'centrale' | 'institut';
  readonly profil = signal<ProfilCompteApi | null>(null);
  readonly chargement = signal(true);
  readonly enregistrement = signal(false);
  readonly photoEnvoi = signal(false);
  readonly motDePasseEnvoi = signal(false);
  readonly onglet = signal<'identite' | 'securite'>('identite');
  readonly message = signal<string | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly passwordForm = { ancien_mot_de_passe: '', mot_de_passe: '', mot_de_passe_confirmation: '' };

  ngOnInit(): void {
    this.api.profilCompte(this.espace).subscribe({
      next: ({ user }) => { this.profil.set(user); this.chargement.set(false); },
      error: (response) => { this.erreur.set(response.error?.message ?? 'Votre profil n’a pas pu être chargé.'); this.chargement.set(false); },
    });
  }

  enregistrerProfil(): void {
    const profil = this.profil();
    if (!profil || this.enregistrement()) return;
    this.enregistrement.set(true); this.message.set(null); this.erreur.set(null);
    this.api.modifierProfilCompte(this.espace, { prenom: profil.prenom.trim(), nom: profil.nom.trim(), email: profil.email?.trim() ?? '', telephone: profil.telephone?.trim() ?? '' }).subscribe({
      next: ({ user, message }) => { this.profil.set(user); this.api.actualiserUtilisateurLocal(user); this.message.set(message); },
      error: (response) => this.erreur.set(response.error?.message ?? 'Vos informations n’ont pas pu être enregistrées.'),
      complete: () => this.enregistrement.set(false),
    });
  }

  changerMotDePasse(): void {
    if (this.motDePasseEnvoi() || this.passwordForm.mot_de_passe.length < 8 || this.passwordForm.mot_de_passe !== this.passwordForm.mot_de_passe_confirmation) {
      this.erreur.set('Le nouveau mot de passe doit contenir au moins 8 caractères et les deux saisies doivent être identiques.');
      return;
    }
    this.motDePasseEnvoi.set(true); this.message.set(null); this.erreur.set(null);
    this.api.changerMotDePasseCompte(this.espace, this.passwordForm).subscribe({
      next: ({ message }) => { this.message.set(message); this.passwordForm.ancien_mot_de_passe = ''; this.passwordForm.mot_de_passe = ''; this.passwordForm.mot_de_passe_confirmation = ''; },
      error: (response) => this.erreur.set(response.error?.message ?? 'Le mot de passe n’a pas pu être modifié.'),
      complete: () => this.motDePasseEnvoi.set(false),
    });
  }

  choisirPhoto(event: Event): void {
    const photo = (event.target as HTMLInputElement).files?.[0];
    if (!photo || this.photoEnvoi()) return;
    this.photoEnvoi.set(true); this.message.set(null); this.erreur.set(null);
    this.api.televerserPhotoCompte(this.espace, photo).subscribe({
      next: ({ photo_url, message }) => { this.profil.update((profil) => profil ? { ...profil, photo_url } : profil); const profil = this.profil(); if (profil) this.api.actualiserUtilisateurLocal(profil); this.message.set(message); },
      error: (response) => this.erreur.set(response.error?.message ?? 'La photo n’a pas pu être enregistrée.'),
      complete: () => this.photoEnvoi.set(false),
    });
  }
}
