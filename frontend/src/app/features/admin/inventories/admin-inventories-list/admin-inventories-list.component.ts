import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { InventarioService } from '../../../../core/services/inventory.service';
import { ProductoService } from '../../../../core/services/product.service';
import { TallaService } from '../../../../core/services/size.service';
import { ColorService } from '../../../../core/services/color.service';
import { ToastService } from '../../../../core/services/toast.service';
import { InventoryWithDetails, InventoryFilters } from '@app/shared/models/inventory';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { Product } from '@app/shared/models/product';
import { Talla } from '@app/shared/models/size';
import { Color } from '@app/shared/models/color';
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
  selector: 'app-admin-inventory-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule, PaginatorComponent],
  templateUrl: './admin-inventories-list.component.html',
  styleUrl: './admin-inventories-list.component.css',
})
export class AdminInventoryListComponent implements OnInit {
  private inventoryService = inject(InventarioService);
  private productService = inject(ProductoService);
  private sizeService = inject(TallaService);
  private colorService = inject(ColorService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;
  inventarios = signal<InventoryWithDetails[]>([]);
  products = signal<Product[]>([]);
  sizes = signal<Talla[]>([]);
  colors = signal<Color[]>([]);
  totalInventarios = signal(0);


  isLoading = signal(true);
  showFilters = signal(false);


  filters = signal<InventoryFilters>({
    skip: 0,
    limit: 50,
  });


  currentPage = signal(1);
  itemsPerPage = signal(50);

 
  totalPages = computed(() => {
    return Math.ceil(this.totalInventarios() / this.itemsPerPage());
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadSizes();
    this.loadColors();
    this.loadInventarios();
  }

  loadProducts(): void {
    this.productService.getProducts({ limit: 1000 }).subscribe({
      next: (response) => this.products.set(response.productos),
      error: (error) => console.error('Error cargando productos:', error),
    });
  }

  loadSizes(): void {
    this.sizeService.getTallas(false).subscribe({
      next: (data) => this.sizes.set(data),
      error: (error) => console.error('Error cargando tallas:', error),
    });
  }

  loadColors(): void {
    this.colorService.getColores(false).subscribe({
      next: (data) => this.colors.set(data),
      error: (error) => console.error('Error cargando colores:', error),
    });
  }

  loadInventarios(): void {
    this.isLoading.set(true);

    const currentFilters = {
      ...this.filters(),
      skip: (this.currentPage() - 1) * this.itemsPerPage(),
      limit: this.itemsPerPage(),
    };

    this.inventoryService.getInventarios(currentFilters).subscribe({
      next: (response) => {
        this.inventarios.set(response.inventarios);
        this.totalInventarios.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando inventario:', error);
        this.toastService.error('No se pudo cargar el inventario');
        this.isLoading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadInventarios();
  }

  clearFilters(): void {
    this.filters.set({
      skip: 0,
      limit: 50,
    });
    this.currentPage.set(1);
    this.loadInventarios();
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  navigateToProductInventory(productoId: string): void {
    this.router.navigate(['/admin/inventario/producto', productoId]);
  }

  getStockLevel(inventory: InventoryWithDetails): 'critico' | 'bajo' | 'normal' | 'alto' {
    const disponible = inventory.stock - inventory.stock_reservado;

    if (disponible === 0) return 'critico';
    if (disponible < 10) return 'bajo';
    if (disponible < 50) return 'normal';
    return 'alto';
  }

  getStockColor(level: string): string {
    const colors = {
      critico: 'bg-red-100 text-red-800 border-red-200',
      bajo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      alto: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[level as keyof typeof colors] || '';
  }

  changePage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), Math.max(this.totalPages(), 1)));
    this.loadInventarios();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadInventarios();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadInventarios();
    }
  }
}
