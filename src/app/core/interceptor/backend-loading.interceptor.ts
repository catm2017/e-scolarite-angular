import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BackendLoadingService } from '../service/backend-loading.service';

/** Affiche un état d'attente pour chaque appel effectué vers l'API Laravel. */
export const backendLoadingInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  // Les fichiers du thème, les traductions et les services IA ne doivent pas
  // produire un faux chargement métier.
  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  const loading = inject(BackendLoadingService);
  loading.start(request.method);

  return next(request).pipe(finalize(() => loading.finish()));
};
