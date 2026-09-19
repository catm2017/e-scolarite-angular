import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, retry, throwError, timer } from 'rxjs';
import { estUrlApi } from '../config/api-url';

/**
 * Rend les lectures de l'API plus tolérantes aux démarrages lents de PHP-FPM,
 * aux réveils de la machine virtuelle et aux coupures réseau ponctuelles.
 *
 * Seules les requêtes idempotentes sont répétées : une écriture ne doit jamais
 * être rejouée automatiquement car elle pourrait créer un doublon.
 */
export const apiRetryInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const isApiRead = estUrlApi(request.url)
    && (request.method === 'GET' || request.method === 'HEAD');

  if (!isApiRead) {
    return next(request);
  }

  return next(request).pipe(
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryIndex) => {
        if (!isTemporaryNetworkFailure(error)) {
          return throwError(() => error);
        }

        // 600 ms puis 1,2 s : assez court pour rester fluide, mais laisse au
        // serveur local le temps de redevenir disponible.
        return timer(600 * retryIndex);
      },
    }),
  );
};

function isTemporaryNetworkFailure(error: HttpErrorResponse): boolean {
  // status 0 correspond notamment à ERR_CONNECTION_TIMED_OUT, une coupure
  // réseau, un serveur Laravel/Homestead temporairement indisponible ou CORS.
  if (error.status === 0 || error.status === 408 || error.status === 429) {
    return true;
  }

  return error.status === 502 || error.status === 503 || error.status === 504;
}
