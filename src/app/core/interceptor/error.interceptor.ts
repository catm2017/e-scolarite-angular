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
        const authorization = req.headers.get('Authorization');
        const tokenDeLaRequete = authorization?.replace(/^Bearer\s+/i, '').trim();
        const tokenActif = localStorage.getItem('escolarite_centrale_token');
        const requeteInstitut = /\/api\/institut(?:\/|$)/i.test(req.url);
        const contexteInstitut = Boolean(localStorage.getItem('escolarite_institut'));
        const routeInstitut = /^\/(institut|enseignant|famille)(?:\/|$)/i.test(router.url);
        // Une réponse 401 d'une requête lancée *avant* une nouvelle connexion
        // ne doit jamais effacer le jeton qui vient d'être créé. Cela arrivait
        // notamment au premier accès au back-office après une reconnexion.
        const concerneLaSessionActive = Boolean(tokenDeLaRequete && tokenDeLaRequete === tokenActif);
        // Une requête institut résiduelle peut encore terminer après une
        // connexion SaaS. Elle reçoit légitimement 401 (un jeton central n'est
        // pas un jeton institut), mais ne doit jamais effacer la session SaaS.
        const doitTerminerSession = !requeteInstitut || (contexteInstitut && routeInstitut);
        if (!isExternalAiApi && !isLoginRequest && concerneLaSessionActive && doitTerminerSession) {
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

