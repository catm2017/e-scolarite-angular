import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface DemoProfile {
  id: 'institute-admin' | 'primary-teacher' | 'college-teacher' | 'high-school-teacher' | 'guardian';
  label: string;
  detail: string;
  destination: string;
}

@Component({
  selector: 'app-site-access',
  imports: [FormsModule, RouterLink],
  templateUrl: './site-access.component.html',
  styleUrl: './site-access.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteAccessComponent {
  private readonly router = inject(Router);

  readonly profileId = signal<DemoProfile['id']>('institute-admin');
  readonly profiles: DemoProfile[] = [
    { id: 'institute-admin', label: 'Administrateur de l’institut', detail: 'Back-office global, campus, utilisateurs et souscriptions.', destination: '/institut' },
    { id: 'primary-teacher', label: 'Enseignant · École primaire', detail: 'Classes, séances, notes et dossiers de l’école primaire.', destination: '/institut/etablissements/primaire' },
    { id: 'college-teacher', label: 'Enseignant · Collège', detail: 'Classes, semestres, évaluations et emploi du temps du collège.', destination: '/institut/etablissements/college' },
    { id: 'high-school-teacher', label: 'Enseignant · Lycée', detail: 'Séries, matières, évaluations et emploi du temps du lycée.', destination: '/institut/etablissements/lycee' },
    { id: 'guardian', label: 'Tuteur', detail: 'Accès famille : enfants, présences, paiements et bulletins.', destination: '/institut' },
  ];

  emailOrPhone = '';
  password = '';
  readonly selectedProfile = computed(() => this.profiles.find((profile) => profile.id === this.profileId())!);

  authenticate(): void {
    this.router.navigateByUrl(this.selectedProfile().destination);
  }
}
