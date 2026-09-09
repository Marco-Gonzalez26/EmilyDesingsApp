import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProductoService } from '../../core/services/product.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickAddService } from '../../core/services/quick-add.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../shared/models/product';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  host: { class: 'ion-page' },
  selector: 'app-favorites',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './favorites.page.html',
  styleUrl: './favorites.page.css',
})
export class FavoritesPage {
  products = signal<Product[]>([]);
  isLoading = signal(true);

  private productoService = inject(ProductoService);
  private favoritesService = inject(FavoritesService);
  private toastService = inject(ToastService);
  private quickAddService = inject(QuickAddService);
  authService = inject(AuthService);

  ionViewWillEnter(): void {
    if (this.authService.isLoggedIn()) {
      this.loadFavorites();
    } else {
      this.isLoading.set(false);
    }
  }

  loadFavorites(): void {
    this.isLoading.set(true);
    this.favoritesService.loadFavorites().subscribe({
      next: (favoritos) => {
        if (favoritos.length === 0) {
          this.products.set([]);
          this.isLoading.set(false);
          return;
        }
        forkJoin(
          favoritos.map((f) =>
            this.productoService.getProductById(f.producto_id).pipe(catchError(() => of(null))),
          ),
        )
          .pipe(map((items) => items.filter((p): p is Product => p !== null)))
          .subscribe({
            next: (items) => {
              this.products.set(items);
              this.isLoading.set(false);
            },
            error: () => {
              this.toastService.error('No se pudieron cargar tus favoritos');
              this.isLoading.set(false);
            },
          });
      },
      error: () => {
        this.toastService.error('No se pudieron cargar tus favoritos');
        this.isLoading.set(false);
      },
    });
  }

  toggleFavorite(productId: string): void {
    // quita al instante (el servicio ya actualiza el Set optimista)
    const previous = this.products();
    this.products.update((items) => items.filter((p) => p.id !== productId));
    this.favoritesService.toggle(productId).subscribe({
      error: () => {
        this.products.set(previous);
        this.toastService.error('No se pudo actualizar el favorito');
      },
    });
  }

  isFavorite(productId: string): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  addToCart(productId: string): void {
    const product = this.products().find((p) => p.id === productId);
    if (!product) return;
    const main = product.imagenes?.find((img) => img.es_principal);
    this.quickAddService.open(product.id, {
      producto_id: product.id,
      nombre: product.nombre,
      imagen: main?.url_imagen ?? product.imagenes?.[0]?.url_imagen ?? 'assets/images/placeholder.jpg',
      precio: String(product.precio_regular),
      precio_descuento: product.precio_descuento ? String(product.precio_descuento) : undefined,
    });
  }
}
