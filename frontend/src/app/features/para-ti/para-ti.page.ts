import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { RecommendationsService } from '../../core/services/recommendations.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickAddService } from '../../core/services/quick-add.service';
import { Recommendation } from '../../shared/models/recommendation';

@Component({
  host: { class: 'ion-page' },
  selector: 'app-para-ti',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonRouterLink, IonRouterLinkWithHref, CommonModule, RouterLink],
  templateUrl: './para-ti.page.html',
  styleUrl: './para-ti.page.css',
})
export class ParaTiPage implements OnInit {
  private recommendationsService = inject(RecommendationsService);
  private favoritesService = inject(FavoritesService);
  private quickAddService = inject(QuickAddService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  authService = inject(AuthService);

  isLoading = signal(true);
  error = signal(false);
  recommendations = signal<Recommendation[]>([]);

  algoritmos = computed(() => {
    const unique = new Set<string>();
    this.recommendations().forEach((r) => {
      if (r.algoritmo) unique.add(r.algoritmo);
    });
    return Array.from(unique);
  });

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.favoritesService.loadFavorites().subscribe();
      this.loadRecommendations();
    } else {
      this.isLoading.set(false);
    }
  }

  loadRecommendations(): void {
    this.isLoading.set(true);
    this.error.set(false);

    this.recommendationsService.getRecommendations(15).subscribe({
      next: (data) => {
        this.recommendations.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      },
    });
  }

  isFavorite(productId: string): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  toggleFavorite(productId: string): void {
    this.favoritesService.toggle(productId).subscribe({
      error: () => this.toastService.error('No se pudo actualizar el favorito'),
    });
  }

  getMainImage(rec: Recommendation): string {
    return rec.imagen_principal || 'assets/images/placeholder.jpg';
  }

  getPrice(rec: Recommendation): number {
    const price = rec.precio_descuento ?? rec.precio_regular;
    return parseFloat(price as any) || 0;
  }

  hasDiscount(rec: Recommendation): boolean {
    const regular = parseFloat(rec.precio_regular as any);
    const descuento = parseFloat(rec.precio_descuento as any);
    return !!rec.precio_descuento && descuento < regular;
  }

  getDiscountPercent(rec: Recommendation): number {
    if (!this.hasDiscount(rec)) return 0;
    const regular = parseFloat(rec.precio_regular as any);
    const descuento = parseFloat(rec.precio_descuento as any);
    return Math.round((1 - descuento / regular) * 100);
  }

  verProducto(rec: Recommendation): void {
    this.router.navigate(['/productos', rec.producto_id]);
  }

  agregarAlCarrito(rec: Recommendation, event: Event): void {
    event.stopPropagation();
    this.quickAddService.open(rec.producto_id, {
      producto_id: rec.producto_id,
      nombre: rec.nombre,
      imagen: rec.imagen_principal || '',
      precio: String(rec.precio_regular),
      precio_descuento: rec.precio_descuento ? String(rec.precio_descuento) : undefined,
    });
  }
}
