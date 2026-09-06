import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        console.error('Sin conexión al servidor — verifica que el backend esté en 0.0.0.0 y la URL:', req.url);
      }
      switch (error.status) {
        case 0:
          // Network/CORS — no navigation, let component toast handle it
          break;
        case 401:
        
          localStorage.removeItem('access_token');
          localStorage.removeItem('current_user');
          router.navigate(['/iniciar-sesion']);
          break;

        case 403:

          router.navigate(['/']);
          break;

        case 404:

          router.navigate(['/']);
          break;

        case 500:

          console.error('Error del servidor:', error.message);
          break;
      }

      return throwError(() => error);
    }),
  );
};
