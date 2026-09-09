import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Product } from '../../../shared/models/product';
import { Inventario } from '../../../shared/models/inventory';
import { CartService } from '../../../core/services/cart.service';
import { InventarioService } from '../../../core/services/inventory.service';
import { ProductoService } from '../../../core/services/product.service';
import { Talla } from '../../../shared/models/size';
import { Color } from '../../../shared/models/color';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { QuickAddService } from '../../../core/services/quick-add.service';
import { RecommendationsService } from '../../../core/services/recommendations.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, IonRouterLink, IonRouterLinkWithHref, CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  inventario = signal<Inventario[]>([]);
  productEstilos = signal<{ id: string; nombre: string }[]>([]);
  isLoading = signal(true);
  isMainFavorite(): boolean {
    const product = this.product();
    if (!product) return false;
    return this.favoritesService.isFavorite(product.id);
  }

  tallasDisponibles = computed(() => {
    const uniqueTallas = new Map<string, Talla>();
    this.inventario().forEach((inv) => {
      if (inv.talla) uniqueTallas.set(inv.talla.id, inv.talla);
    });
    return Array.from(uniqueTallas.values()).sort((a, b) => a.orden - b.orden);
  });

  coloresDisponibles = computed(() => {
    const uniqueColores = new Map<string, Color>();
    this.inventario().forEach((inv) => {
      if (inv.color) uniqueColores.set(inv.color.id, inv.color);
    });
    return Array.from(uniqueColores.values());
  });

  selectedImageIndex = signal(0);
  selectedImage = computed(() => {
    const imgs = this.product()?.imagenes;
    if (!imgs || imgs.length === 0) return 'assets/images/placeholder.jpg';
    return imgs[this.selectedImageIndex()]?.url_imagen ?? 'assets/images/placeholder.jpg';
  });

  selectedTalla = signal<string | null>(null);
  selectedColor = signal<Color | null>(null);
  quantity = signal(1);
  stockDisponible = signal<number>(0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private cartService: CartService,
    private inventarioService: InventarioService,
    private toastService: ToastService,
    private api: ApiService,
    private authService: AuthService,
    private favoritesService: FavoritesService,
    private quickAddService: QuickAddService,
    private recommendationsService: RecommendationsService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.selectedImageIndex.set(0);

    this.productoService.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        const productAny = product as any;
        if (productAny.estilos?.length) {
          this.productEstilos.set(productAny.estilos);
        }
        this.loadInventario(id);
        this.loadRelated(product);
        this.isLoading.set(false);
        // clic para el modelo (fire-and-forget, solo logueados)
        if (localStorage.getItem('access_token')) {
          this.api.post('/api/interacciones', { producto_id: id, tipo_interaccion: 'clic' }).subscribe({ error: () => {} });
        }
        if (this.authService.isLoggedIn()) {
          this.favoritesService.loadFavorites().subscribe();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/productos']);
      },
    });
  }

  loadInventario(productoId: string): void {
    this.inventarioService.getInventarioProducto(productoId).subscribe({
      next: (inventario) => this.inventario.set(inventario),
      error: () => console.error('Error cargando inventario'),
    });
  }

  loadRelated(product: Product): void {
    // Logueado: recomendaciones IA (registra RecomendacionIA para usuario + dashboard admin)
    if (this.authService.isLoggedIn()) {
      this.recommendationsService.getRecommendations(6).subscribe({
        next: (recs) => {
          const ids = recs
            .map((r) => r.producto_id)
            .filter((id) => id !== product.id)
            .slice(0, 4);
          if (ids.length === 0) {
            this.loadRelatedByCategory(product);
            return;
          }
          forkJoin(
            ids.map((id) => this.productoService.getProductById(id).pipe(catchError(() => of(null)))),
          )
            .pipe(map((items) => items.filter((p): p is Product => p !== null)))
            .subscribe({
              next: (items) => this.relatedProducts.set(items),
              error: () => this.loadRelatedByCategory(product),
            });
        },
        error: () => this.loadRelatedByCategory(product),
      });
      return;
    }
    this.loadRelatedByCategory(product);
  }

  private loadRelatedByCategory(product: Product): void {
    this.productoService
      .getProducts({
        categoria_id: product.categoria_id ?? undefined,
        activo: true,
        limit: 5,
        skip: 0,
      })
      .subscribe({
        next: (response) => {
          const filtered = response.productos.filter((p) => p.id !== product.id).slice(0, 4);
          this.relatedProducts.set(filtered);
        },
        error: () => this.relatedProducts.set([]),
      });
  }

  isRelatedFavorite(productId: string): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  toggleRelatedFavorite(productId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.warn('Inicia sesión para guardar favoritos');
      return;
    }
    this.favoritesService.toggle(productId).subscribe({
      error: () => this.toastService.error('No se pudo actualizar el favorito'),
    });
  }

  addRelatedToCart(productId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.warn('Inicia sesión para agregar al carrito');
      return;
    }
    const product = this.relatedProducts().find((p) => p.id === productId);
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

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  prevImage(): void {
    const total = this.product()?.imagenes?.length ?? 0;
    if (total === 0) return;
    this.selectedImageIndex.update((i) => (i === 0 ? total - 1 : i - 1));
  }

  nextImage(): void {
    const total = this.product()?.imagenes?.length ?? 0;
    if (total === 0) return;
    this.selectedImageIndex.update((i) => (i === total - 1 ? 0 : i + 1));
  }

  selectTalla(tallaId: string): void {
    this.selectedTalla.set(this.selectedTalla() === tallaId ? null : tallaId);
    this.updateStockDisponible();
  }

  selectColor(color: Color): void {
    this.selectedColor.set(this.selectedColor()?.id === color.id ? null : color);
    this.updateStockDisponible();
  }

  updateStockDisponible(): void {
    const product = this.product();
    const talla = this.selectedTalla();
    const color = this.selectedColor();

    if (!product || !talla || !color) {
      this.stockDisponible.set(0);
      return;
    }

    this.inventarioService.getStockDisponible(product.id, talla, color.id).subscribe({
      next: (response) => this.stockDisponible.set(response.stock_disponible),
      error: () => this.stockDisponible.set(0),
    });
  }

  getTallaDisplay(talla: Talla): string {
    return talla.nombre;
  }

  decreaseQty(): void {
    if (this.quantity() > 1) this.quantity.update((q) => q - 1);
  }

  increaseQty(): void {
    const maxStock = this.stockDisponible();
    if (this.quantity() < maxStock && this.quantity() < 10) {
      this.quantity.update((q) => q + 1);
    }
  }

  toggleFavorite(): void {
    const product = this.product();
    if (!product) return;
    if (!this.authService.isLoggedIn()) {
      this.toastService.warn('Inicia sesión para guardar favoritos');
      return;
    }
    this.favoritesService.toggle(product.id).subscribe({
      error: () => this.toastService.error('No se pudo actualizar el favorito'),
    });
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;

    if (!this.selectedTalla()) {
      this.toastService.warn('Por favor selecciona una talla');
      return;
    }

    if (!this.selectedColor()) {
      this.toastService.warn('Por favor selecciona un color');
      return;
    }

    if (this.stockDisponible() < this.quantity()) {
      this.toastService.warn(`Solo hay ${this.stockDisponible()} unidades disponibles`);
      return;
    }

    this.cartService
      .addItem({
        producto_id: product.id,
        talla_id: this.selectedTalla()!,
        color_id: this.selectedColor()!.id,
        cantidad: this.quantity(),
        origen: 'catalogo',
      })
      .subscribe({
        next: () => {
          this.toastService.success('Producto agregado al carrito');
          this.quantity.set(1);
        },
        error: () => this.toastService.error('No se pudo agregar el producto'),
      });
  }

  goBack(): void {
    this.router.navigate(['/productos']);
  }

  getPrice(product: Product): number {
    const price = product.precio_descuento ?? product.precio_regular;
    return parseFloat(price as any) || 0;
  }

  hasDiscount(product: Product): boolean {
    const regular = parseFloat(product.precio_regular as any);
    const descuento = parseFloat(product.precio_descuento as any);
    return !!product.precio_descuento && descuento < regular;
  }

  getDiscountPercent(product: Product): number {
    if (!this.hasDiscount(product)) return 0;
    const regular = parseFloat(product.precio_regular as any);
    const descuento = parseFloat(product.precio_descuento as any);
    return Math.round((1 - descuento / regular) * 100);
  }

  getMainImage(product: Product): string {
    const main = product.imagenes?.find((img) => img.es_principal);
    return main?.url_imagen ?? product.imagenes?.[0]?.url_imagen ?? 'assets/images/placeholder.jpg';
  }
}
