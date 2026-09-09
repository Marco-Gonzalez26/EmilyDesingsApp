import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, finalize, tap } from 'rxjs';
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

  private pending = new Set<string>();

  toggle(productId: string): Observable<Favorito> {
    // ignora doble-tap con petición en vuelo: evita respuestas fuera de orden
    if (this.pending.has(productId)) {
      return EMPTY;
    }
    this.pending.add(productId);
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

    const done = () => this.pending.delete(productId);
    if (wasFavorite) {
      return this.api.delete<void>(`/api/favoritos/${productId}`).pipe(
        tap({ error: () => revert() }),
        finalize(done),
      ) as unknown as Observable<Favorito>;
    }

    return this.api.post<Favorito>('/api/favoritos', { producto_id: productId }).pipe(
      tap({ error: () => revert() }),
      finalize(done),
    );
  }
}
