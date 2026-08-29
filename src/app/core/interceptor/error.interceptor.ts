import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authenticationService = inject(AuthService);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        // Do not auto-logout if the request is to an external AI API
        const isExternalAiApi = req.url.includes('api.openai.com') || req.url.includes('generativelanguage.googleapis.com');
        if (!isExternalAiApi) {
          // auto logout if 401 response returned from api
          authenticationService.logout();
          location.reload();
        }
      }

      const error = err.error?.message || err.statusText;
      return throwError(() => error);
    })
  );
};

