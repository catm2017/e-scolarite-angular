import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { AppToastComponent, AppToastData, AppToastKind } from '../components/app-toast.component';

/** Notifications homogènes de la plateforme, toujours en haut à droite. */
@Injectable({ providedIn: 'root' })
export class AppToastService {
  private readonly snackBar = inject(MatSnackBar);

  open(message: string, action = 'Fermer', config: MatSnackBarConfig = {}): MatSnackBarRef<AppToastComponent> {
    return this.display(message, action, this.inferKind(message), config);
  }

  success(message: string, action = 'Fermer', config: MatSnackBarConfig = {}): MatSnackBarRef<AppToastComponent> {
    return this.display(message, action, 'success', config);
  }

  error(message: string, action = 'Fermer', config: MatSnackBarConfig = {}): MatSnackBarRef<AppToastComponent> {
    return this.display(message, action, 'error', config);
  }

  private display(message: string, action: string, kind: AppToastKind, config: MatSnackBarConfig): MatSnackBarRef<AppToastComponent> {
    const data: AppToastData = { message, action, kind };
    return this.snackBar.openFromComponent(AppToastComponent, {
      ...config,
      data,
      duration: config.duration ?? (kind === 'error' ? 4200 : 3000),
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['escolarite-toast-panel', ...(this.asClasses(config.panelClass))],
    });
  }

  private asClasses(value: string | string[] | undefined): string[] {
    return value ? (Array.isArray(value) ? value : [value]) : [];
  }

  private inferKind(message: string): AppToastKind {
    return /\b(erreur|échoué|impossible|renseignez|sélectionnez|vérifiez|invalide|introuvable|indisponible|ne peut|doit|aucun|manquant|dépasser|existe déjà|archivée|lecture seule|conservez|saisissez|veuillez|pas supprim)\b/i.test(message)
      ? 'error'
      : 'success';
  }
}
