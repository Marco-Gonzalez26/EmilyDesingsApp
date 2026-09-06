import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

import { Category, CategoryCreate, CategoryUpdate } from '@app/shared/models/category';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private api: ApiService) {}

  getCategorias(soloActivas: boolean = false): Observable<Category[]> {
    const params = soloActivas ? '?solo_activas=true' : '?solo_activas=false';
    return this.api.get<Category[]>(`/api/categorias${params}`);
  }

  getCategoriaById(id: string): Observable<Category> {
    return this.api.get<Category>(`/api/categorias/${id}`);
  }

  createCategoria(data: CategoryCreate): Observable<Category> {
    return this.api.post<Category>('/api/categorias', data);
  }

  updateCategoria(id: string, data: CategoryUpdate): Observable<Category> {
    return this.api.patch<Category>(`/api/categorias/${id}`, data);
  }

  deleteCategoria(id: string): Observable<Category> {
    return this.api.delete<Category>(`/api/categorias/${id}`);
  }
}
