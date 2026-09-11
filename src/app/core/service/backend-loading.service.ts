import { Injectable, computed, signal } from '@angular/core';

/**
 * Etat partagé des requêtes adressées au backend E-Scolarité.
 * Le compteur permet de conserver l'indicateur visible tant qu'au moins une
 * requête est en cours, même lorsqu'une page charge plusieurs ressources.
 */
@Injectable({ providedIn: 'root' })
export class BackendLoadingService {
  private readonly pendingRequests = signal(0);
  private readonly currentAction = signal<'loading' | 'saving'>('loading');

  readonly isLoading = computed(() => this.pendingRequests() > 0);
  readonly pendingCount = this.pendingRequests.asReadonly();
  readonly message = computed(() =>
    this.currentAction() === 'saving'
      ? 'Traitement de votre demande…'
      : 'Chargement des données…',
  );

  start(method: string): void {
    this.currentAction.set(['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? 'saving' : 'loading');
    this.pendingRequests.update((count) => count + 1);
  }

  finish(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
  }
}
