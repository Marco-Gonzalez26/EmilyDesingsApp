import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { UserListItem, UserDetail, UserFilters } from '@shared/models/user';

@Injectable({
  providedIn: 'root',
})
export class UsuarioAdminService {
  private api = inject(ApiService);

  getAllUsuarios(filters?: UserFilters): Observable<{
    clientes: UserListItem[];
    total: number;
    skip: number;
    limit: number;
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/api/usuarios/admin/clientes/all?${queryString}`
      : '/api/usuarios/admin/clientes/all';

    return this.api.get(url);
  }

  getUsuarioDetail(usuarioId: string): Observable<UserDetail> {
    return this.api.get(`/api/usuarios/admin/clientes/${usuarioId}/detalle`);
  }

  getUsuarioOrdenes(
    usuarioId: string,
    skip = 0,
    limit = 10,
  ): Observable<{
    ordenes: any[];
    total: number;
  }> {
    return this.api.get(
      `/api/usuarios/admin/clientes/${usuarioId}/ordenes?skip=${skip}&limit=${limit}`,
    );
  }

  getUsuarioAnalisis(
    usuarioId: string,
    skip = 0,
    limit = 10,
  ): Observable<{
    analisis: any[];
    total: number;
  }> {
    return this.api.get(
      `/api/usuarios/admin/clientes/${usuarioId}/analisis?skip=${skip}&limit=${limit}`,
    );
  }
  createUsuario(data: {
    email: string;
    password: string;
    nombre_completo?: string;
    telefono?: string;
    direccion?: string;
    cedula_ruc?: string;
    rol: 'cliente' | 'administrador';
  }): Observable<any> {
    return this.api.post('/api/usuarios/admin/crear', data);
  }

  updateUsuario(
    usuarioId: string,
    data: {
      nombre_completo?: string;
      telefono?: string;
      direccion?: string;
      cedula_ruc?: string;
    },
  ): Observable<any> {
    return this.api.put(`/api/usuarios/admin/${usuarioId}/actualizar`, data);
  }
}
