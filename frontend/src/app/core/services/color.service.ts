import { Injectable } from '@angular/core';
import { Color, ColorCreate, ColorUpdate } from '../../shared/models/color';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor(private api: ApiService) {}

  getColores(soloActivos: boolean = true): Observable<Color[]> {
    return this.api.get<Color[]>(`/api/colores/?solo_activos=${soloActivos}`);
  }

  getColorById(id: string): Observable<Color> {
    return this.api.get<Color>(`/api/colores/${id}`);
  }

  createColor(data: ColorCreate): Observable<Color> {
    return this.api.post<Color>('/api/colores/', data);
  }

  updateColor(id: string, data: ColorUpdate): Observable<Color> {
    return this.api.patch<Color>(`/api/colores/${id}`, data);
  }

  deleteColor(id: string, permanente: boolean = false): Observable<Color> {
    return this.api.delete<Color>(`/api/colores/${id}?permanente=${permanente}`);
  }
}
