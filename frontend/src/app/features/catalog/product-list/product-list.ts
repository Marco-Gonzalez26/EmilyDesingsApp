import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/product.service';
import { Product, ProductFilters } from '../../../shared/models/product';
import { FiltersComponent } from '../filters/filters';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ToastService } from '../../../core/services/toast.service';
import { QuickAddService } from '../../../core/services/quick-add.service';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  host: { class: 'ion-page' },
  selector: 'app-product-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonModal, IonButtons, IonButton, IonFooter,
    CommonModule,
    RouterModule,
    FormsModule,
    FiltersComponent,
    ProductCardComponent,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  isLoading = signal(true);
  totalProducts = signal(0);

  currentPage = signal(1);
  pageSize = signal(12);
  totalPages = computed(() => Math.ceil(this.totalProducts() / this.pageSize()));
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
        pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  activeFilters = signal<Partial<ProductFilters>>({});

  sortOptions = [
    { label: 'Recomendado', value: '' },
    { label: 'Menor precio', value: 'precio_asc' },
    { label: 'Mayor precio', value: 'precio_desc' },
    { label: 'Más nuevos', value: 'nuevos' },
  ];
  selectedSort = signal('');
  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  filtersVisible = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private quickAddService = inject(QuickAddService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private api = inject(ApiService);

  constructor(private productoService: ProductoService) {
    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const categoria = params['categoria'];
      const esNuevo = params['es_nuevo'];
      const esOferta = params['es_oferta'];
      const marca = params['marca'];

      const filters: Partial<ProductFilters> = {};
      if (categoria) filters['categoria_id'] = categoria;
      if (marca) filters['marca_id'] = marca;
      if (esNuevo === 'true') filters['es_nuevo'] = true;
      if (esOferta === 'true') filters['es_oferta'] = true;

      this.activeFilters.set(filters);
      this.currentPage.set(1);
      this.loadProducts();
    });

    if (this.authService.isLoggedIn()) {
      this.favoritesService.loadFavorites().subscribe();
    }
  }

  loadProducts(): void {
    this.isLoading.set(true);

    const filters: ProductFilters = {
      ...this.activeFilters(),
      activo: true,
      skip: (this.currentPage() - 1) * this.pageSize(),
      limit: this.pageSize(),
      sort: this.selectedSort(),
      search: this.searchTerm() || undefined,
    };

    this.productoService.getProducts(filters).subscribe({
      next: (response) => {
        this.products.set(response.productos);
        this.totalProducts.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.toastService.error('No se pudieron cargar los productos');
        this.isLoading.set(false);
      },
    });
  }

  onFiltersChanged(filters: Partial<ProductFilters>): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onFiltersCleared(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
    this.selectedSort.set('');
    this.searchTerm.set('');
    this.loadProducts();
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadProducts();
      this.scrollToTop();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadProducts();
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadProducts();
      this.scrollToTop();
    }
  }

  onSortChange(sort: string): void {
    this.selectedSort.set(sort);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
    // busqueda para el modelo (fire-and-forget, solo logueados con query)
    const q = term.trim();
    if (q && localStorage.getItem('access_token')) {
      this.api.post('/api/interacciones', { tipo_interaccion: 'busqueda', metadata_json: { query: q } }).subscribe({ error: () => {} });
    }
  }

  toggleFavorite(productId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.warn('Inicia sesión para guardar favoritos');
      return;
    }

    this.favoritesService.toggle(productId).subscribe({
      error: () => this.toastService.error('No se pudo actualizar el favorito'),
    });
  }

  isFavorite(productId: string): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  addToCart(productId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.warn('Inicia sesión para agregar al carrito');
      return;
    }
    const product = this.products().find((p) => p.id === productId);
    if (!product) return;
    this.quickAddService.open(product.id, {
      producto_id: product.id,
      nombre: product.nombre,
      imagen: this.getMainImage(product),
      precio: String(product.precio_regular),
      precio_descuento: product.precio_descuento ? String(product.precio_descuento) : undefined,
    });
  }

  getMainImage(product: Product): string {
    const main = product.imagenes?.find((img) => img.es_principal);
    return main?.url_imagen ?? product.imagenes?.[0]?.url_imagen ?? 'assets/images/placeholder.jpg';
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

  private scrollToTop(): void {
    const content = document.querySelector('ion-content');
    content?.scrollToTop?.(300);
  }
}