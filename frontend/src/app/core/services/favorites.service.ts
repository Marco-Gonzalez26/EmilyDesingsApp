import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface Favorito {
  id: string;
  usuario_id: string;
  producto_id: string;
  creado_en: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  readonly favoriteIds = signal<Set<string>>(new Set());

  constructor(private api: ApiService) {}

  loadFavorites(): Observable<Favorito[]> {
    return this.api.get<Favorito[]>('/api/favoritos').pipe(
      tap((favoritos) => {
        this.favoriteIds.set(new Set(favoritos.map((f) => f.producto_id)));
      }),
    );
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds().has(productId);
  }

  toggle(productId: string): Observable<Favorito> {
    // update optimista: el corazón cambia al instante, revierte si falla
    const wasFavorite = this.favoriteIds().has(productId);
    const optimistic = new Set(this.favoriteIds());
    if (wasFavorite) optimistic.delete(productId);
    else optimistic.add(productId);
    this.favoriteIds.set(optimistic);

    const revert = () => {
      const favs = new Set(this.favoriteIds());
      if (wasFavorite) favs.add(productId);
      else favs.delete(productId);
      this.favoriteIds.set(favs);
    };

    if (wasFavorite) {
      return this.api.delete<void>(`/api/favoritos/${productId}`).pipe(
        tap({ error: () => revert() }),
      ) as unknown as Observable<Favorito>;
    }

    return this.api.post<Favorito>('/api/favoritos', { producto_id: productId }).pipe(
      tap({ error: () => revert() }),
    );
  }
}
