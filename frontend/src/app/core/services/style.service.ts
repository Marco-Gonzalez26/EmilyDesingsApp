import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Estilo } from '@app/shared/models/style';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StyleService {
  constructor(private api: ApiService) {}

  getEstilos(incluirInactivos = true): Observable<Estilo[]> {
    return this.api.get<Estilo[]>(`/api/estilos?include_inactive=${incluirInactivos}`);
  }

  getEstilo(id: string): Observable<Estilo> {
    return this.api.get<Estilo>(`/api/estilos/${id}`);
  }

  createEstilo(data: Partial<Estilo>): Observable<Estilo> {
    return this.api.post<Estilo>('/api/estilos', data);
  }

  updateEstilo(id: string, data: Partial<Estilo>): Observable<Estilo> {
    return this.api.put<Estilo>(`/api/estilos/${id}`, data);
  }

  deleteEstilo(id: string): Observable<void> {
    return this.api.delete<void>(`/api/estilos/${id}`);
  }

  toggleActivo(id: string): Observable<Estilo> {
    return this.api.patch<Estilo>(`/api/estilos/${id}/toggle-activo`, {});
  }

  assignEstilosToProduct(productoId: string, estiloIds: string[]): Observable<any> {
    return this.api.put<any>(`/api/productos/${productoId}/estilos`, estiloIds);
  }
}
