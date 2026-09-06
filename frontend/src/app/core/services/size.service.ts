import { Injectable } from '@angular/core';
import { Talla, TallaCreate, TallaUpdate } from '../../shared/models/size';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class TallaService {
  constructor(private api: ApiService) {}

  getTallas(soloActivas: boolean = true): Observable<Talla[]> {
    return this.api.get<Talla[]>(`/api/tallas/?solo_activas=${soloActivas}`);
  }

  getTallaById(id: string): Observable<Talla> {
    return this.api.get<Talla>(`/api/tallas/${id}`);
  }

  createTalla(data: TallaCreate): Observable<Talla> {
    return this.api.post<Talla>('/api/tallas/', data);
  }

  updateTalla(id: string, data: TallaUpdate): Observable<Talla> {
    return this.api.patch<Talla>(`/api/tallas/${id}`, data);
  }

  deleteTalla(id: string, permanente: boolean = false): Observable<Talla> {
    return this.api.delete<Talla>(`/api/tallas/${id}?permanente=${permanente}`);
  }
}
