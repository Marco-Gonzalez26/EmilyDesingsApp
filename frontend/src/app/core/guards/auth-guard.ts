import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

/**
 * Guard de autenticación
 * Protege rutas que requieren usuario autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/iniciar-sesion'], {
    queryParams: { returnUrl: state.url },
  });

  return false;
};

/**
 * Guard de administrador
 * Protege rutas que requieren permisos de administrador
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertController = inject(AlertController);

  if (!authService.isLoggedIn()) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }

  if (authService.isAdmin()) {
    return true;
  }

  router.navigate(['/']);
  const alert = await alertController.create({
    header: 'Acceso denegado',
    message: 'No tienes permisos de administrador para acceder a esta página',
    buttons: ['OK'],
  });
  await alert.present();

  return false;
};