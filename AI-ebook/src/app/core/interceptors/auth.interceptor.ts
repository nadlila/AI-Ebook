import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { defer, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const baseUrl = environment.apiBaseUrl;

  // Token hanya dikirim ke API backend aplikasi.
  if (
    req.url !== baseUrl &&
    !req.url.startsWith(`${baseUrl}/`) &&
    !req.url.startsWith(`${baseUrl}?`)
  ) {
    return next(req);
  }

  return defer(() => auth.getAccessToken()).pipe(
    switchMap(token =>
      next(
        token
          ? req.clone({
              setHeaders: { Authorization: `Bearer ${token}` }
            })
          : req
      )
    )
  );
};