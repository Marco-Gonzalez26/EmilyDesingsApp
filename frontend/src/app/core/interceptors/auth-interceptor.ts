import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);


  const token = localStorage.getItem('access_token');


  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }


  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        router.navigate(['/iniciar-sesion']);
      }
      return throwError(() => error);
    }),
  );
};
