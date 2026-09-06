import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { map, catchError, of } from 'rxjs';
import { ConfiguracionComponent } from '../../features/admin/configuracion/configuracion.component';

export const admin2faCanDeactivateGuard: CanDeactivateFn<ConfiguracionComponent> = () => {
  const api = inject(ApiService);
  const toast = inject(ToastService);
  return api.get<{ totp_enabled: boolean }>('/api/auth/2fa/status').pipe(
    map((res) => {
      if (res.totp_enabled) return true;
      toast.error('Debes activar 2FA antes de salir');
      return false;
    }),
    catchError(() => of(false)),
  );
};
