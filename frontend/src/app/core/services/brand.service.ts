import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Brand } from '../../shared/models/brand';
import { BrandCreate, BrandUpdate } from '@app/shared/models/brand';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private api = inject(ApiService);

  getMarcas(soloActivas: boolean = false): Observable<Brand[]> {
    const params = soloActivas ? '?solo_activas=true' : '?solo_activas=false';
    return this.api.get<Brand[]>(`/api/marcas${params}`);
  }

  getMarcaById(id: string): Observable<Brand> {
    return this.api.get<Brand>(`/api/marcas/${id}`);
  }

  createMarca(data: BrandCreate): Observable<Brand> {
    return this.api.post<Brand>('/api/marcas', data);
  }

  updateMarca(id: string, data: BrandUpdate): Observable<Brand> {
    return this.api.patch<Brand>(`/api/marcas/${id}`, data);
  }

  deleteMarca(id: string): Observable<Brand> {
    return this.api.delete<Brand>(`/api/marcas/${id}`);
  }
}
