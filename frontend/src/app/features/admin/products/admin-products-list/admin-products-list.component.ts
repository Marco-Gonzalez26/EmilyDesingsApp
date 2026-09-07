import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ProductoService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Product, ProductFilters } from '@app/shared/models/product';
import { Category } from '@app/shared/models/category';
import { Brand } from '@app/shared/models/brand';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-products-list.component.html',
  styleUrl: './admin-products-list.component.css',
})
export class AdminProductsListComponent implements OnInit {
  private productService = inject(ProductoService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;
  readonly Number = Number;
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  totalProducts = signal(0);

  isLoading = signal(true);
  isConfirmOpen = signal(false);
  showFilters = signal(false);

  productToDelete = signal<Product | null>(null);

  filters = signal<ProductFilters>({
    skip: 0,
    limit: 20,
    activo: undefined,
    search: '',
  });

  currentPage = signal(1);
  itemsPerPage = signal(20);

  totalPages = computed(() => {
    return Math.ceil(this.totalProducts() / this.itemsPerPage());
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategorias(false).subscribe({
      next: (data) => this.categories.set(data),
      error: (error) => console.error('Error cargando categorías:', error),
    });
  }

  navigateToProductInventory(productId: string): void {
    this.router.navigate(['/admin/inventario/producto', productId]);
  }
  loadBrands(): void {
    this.brandService.getMarcas(false).subscribe({
      next: (data) => this.brands.set(data),
      error: (error) => console.error('Error cargando marcas:', error),
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);

    const currentFilters = {
      ...this.filters(),
      skip: (this.currentPage() - 1) * this.itemsPerPage(),
      limit: this.itemsPerPage(),
    };

    this.productService.getProducts(currentFilters).subscribe({
      next: (response) => {
        this.products.set(response.productos);
        this.totalProducts.set(response.total);
        this.isLoading.set(false);

      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.toastService.error('No se pudieron cargar los productos');
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filters.update((f) => ({ ...f, search: input.value }));
    this.currentPage.set(1);
    this.loadProducts();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilters(): void {
    this.filters.set({
      skip: 0,
      limit: 20,
      activo: undefined,
      search: '',
    });
    this.currentPage.set(1);
    this.loadProducts();
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/productos/nuevo']);
  }

  navigateToEdit(product: Product): void {
    this.router.navigate(['/admin/productos/editar', product.id]);
  }

  openDeleteConfirm(product: Product): void {
    this.productToDelete.set(product);
    this.isConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isConfirmOpen.set(false);
    this.productToDelete.set(null);
  }

  confirmDelete(): void {
    const product = this.productToDelete();

    if (!product) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.toastService.success('Producto eliminado exitosamente');
        this.closeDeleteConfirm();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error eliminando producto:', error);
        this.closeDeleteConfirm();
        this.toastService.error('No se pudo eliminar el producto');
      },
    });
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadProducts();
    }
  }

  getMainImage(product: Product): string {
    const mainImage = product.imagenes?.find((img) => img.es_principal);
    return (
      mainImage?.url_imagen || product.imagenes?.[0]?.url_imagen || 'assets/placeholder-product.png'
    );
  }

  getRegularPrice(product: Product): number {
    const price = product.precio_regular;
    return parseFloat(price as any) || 0;
  }
  getPrecioFinal(product: Product): number {
    const price = product.precio_descuento ?? product.precio_regular;
    return this.Number(price);
  }

  hasDiscount(product: Product): boolean {
    return Number(product.precio_descuento) < Number(product.precio_regular);
  }

  getDiscountPercentage(product: Product): number {
    if (!this.hasDiscount(product)) return 0;
    const regular = Number(product.precio_regular);
    const descuento = Number(product.precio_descuento!);
    const discount = ((regular - descuento) / regular) * 100;
    return Math.round(discount);
  }
}
