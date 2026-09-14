import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { effacerSessionApiLocale } from '../../prototype/central-api.service';

let redirectionSessionExpireeEnCours = false;

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 || err.status === 419) {
        // Do not auto-logout if the request is to an external AI API
        const isExternalAiApi = req.url.includes('api.openai.com') || req.url.includes('generativelanguage.googleapis.com');
        const isLoginRequest = req.url.endsWith('/connexion') || req.url.includes('/centrale/connexion');
        const isAuthenticatedRequest = req.headers.has('Authorization');
        if (!isExternalAiApi && !isLoginRequest && isAuthenticatedRequest) {
          // Une session API expirée est supprimée localement avant de revenir
          // à l'écran de connexion. Aucun nouvel appel de déconnexion n'est
          // lancé afin d'éviter une boucle sur une session déjà invalide.
          effacerSessionApiLocale();
          if (!redirectionSessionExpireeEnCours) {
            redirectionSessionExpireeEnCours = true;
            void router.navigate(['/connexion'], {
              queryParams: { session: 'expiree' },
              replaceUrl: true,
            }).finally(() => {
              redirectionSessionExpireeEnCours = false;
            });
          }
        }
      }
      if (err.status === 403 && err.error?.souscription_requise && req.headers.has('Authorization')) {
        // La session reste valide, mais l'accès métier est fermé : on renvoie
        // l'institut vers le suivi de sa souscription et de ses factures.
        localStorage.setItem('escolarite_souscription_validee', 'false');
        localStorage.setItem('escolarite_fonctionnalites_actives', '[]');
        void router.navigate(['/institut', 'souscription'], { replaceUrl: true });
      }

      return throwError(() => err);
    })
  );
};

