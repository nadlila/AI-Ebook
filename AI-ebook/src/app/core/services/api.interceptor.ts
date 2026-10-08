import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiBaseUrl + '/'))
    return next(request);
  const auth = inject(AuthService);
  return auth.token().pipe(
    switchMap((token) =>
      next(
        token
          ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : request,
      ),
    ),
    catchError((error) => {
      const message =
        error.error?.detail ||
        error.error?.message ||
        error.message ||
        'Permintaan gagal.';
      if (error.status === 401) {
        auth.logout();
        window.alert('Sesi berakhir. Silakan login kembali.');
      } else if (error.status === 403)
        window.alert(
          'Akun ini tidak memiliki akses author. Gunakan akun author yang sudah disiapkan.',
        );
      else
        window.alert(
          error.status === 0
            ? 'Backend tidak dapat dihubungi. Pastikan Spring Boot berjalan di port 8080.'
            : message,
        );
      return throwError(() => error);
    }),
  );
};
