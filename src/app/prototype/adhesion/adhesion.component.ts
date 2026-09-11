import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CentralApiService } from '../central-api.service';

@Component({
  selector: 'app-adhesion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './adhesion.component.html',
  styleUrl: './adhesion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdhesionComponent {
  private readonly formulaire = inject(NonNullableFormBuilder);
  private readonly api = inject(CentralApiService);

  readonly chargement = signal(false);
  readonly succes = signal<string | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly types = ['Préscolaire', 'École primaire', 'Collège', 'Lycée', 'Université', 'Formation professionnelle'];
  readonly adhesion = this.formulaire.group({
    nom_institut: ['', Validators.required],
    ville: [''],
    adresse: [''],
    prenom_responsable: ['', Validators.required],
    nom_responsable: ['', Validators.required],
    email_responsable: ['', [Validators.required, Validators.email]],
    telephone_responsable: ['', Validators.required],
    effectif_estime: [null as number | null],
    message: [''],
  });
  readonly typesSelectionnes = signal<string[]>([]);

  basculerType(type: string): void {
    this.typesSelectionnes.update((selection) => selection.includes(type)
      ? selection.filter((item) => item !== type)
      : [...selection, type]);
  }

  soumettre(): void {
    if (this.adhesion.invalid || this.chargement()) {
      this.adhesion.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);
    this.api.envoyerAdhesion({ ...this.adhesion.getRawValue(), types_etablissements: this.typesSelectionnes() }).subscribe({
      next: ({ message }) => {
        this.succes.set(message);
        this.adhesion.reset();
        this.typesSelectionnes.set([]);
      },
      error: (response) => this.erreur.set(response.error?.message ?? 'La demande n’a pas pu être envoyée.'),
      complete: () => this.chargement.set(false),
    });
  }
}
