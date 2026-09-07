import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { InventarioService } from '../../../../core/services/inventory.service';
import { ProductoService } from '../../../../core/services/product.service';
import { TallaService } from '../../../../core/services/size.service';
import { ColorService } from '../../../../core/services/color.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  InventoryWithDetails,
  InventoryCreate,
  InventoryAjuste,
} from '@app/shared/models/inventory';
import { Product } from '@app/shared/models/product';
import { Talla } from '@app/shared/models/size';
import { Color } from '@app/shared/models/color';
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
  selector: 'app-admin-product-inventory',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogComponent,
  ],
  templateUrl: './admin-product-inventory.component.html',
  styleUrl: './admin-product-inventory.component.css',
})
export class AdminProductInventoryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private inventoryService = inject(InventarioService);
  private productService = inject(ProductoService);
  private sizeService = inject(TallaService);
  private colorService = inject(ColorService);
  private toastService = inject(ToastService);

  // Data
  product = signal<Product | null>(null);
  inventarios = signal<InventoryWithDetails[]>([]);
  sizes = signal<Talla[]>([]);
  colors = signal<Color[]>([]);

  // UI State
  isLoading = signal(true);
  isFormOpen = signal(false);
  isAjusteOpen = signal(false);
  isConfirmOpen = signal(false);
  isSubmitting = signal(false);

  // Forms
  inventoryForm: FormGroup;
  ajusteForm: FormGroup;

  // Selection
  selectedInventory = signal<InventoryWithDetails | null>(null);
  inventoryToDelete = signal<InventoryWithDetails | null>(null);

  // Computed
  stockTotal = computed(() => {
    return this.inventarios().reduce((sum, inv) => sum + inv.stock, 0);
  });

  stockReservadoTotal = computed(() => {
    return this.inventarios().reduce((sum, inv) => sum + inv.stock_reservado, 0);
  });

  stockDisponibleTotal = computed(() => {
    return this.inventarios().reduce((sum, inv) => sum + (inv.stock - inv.stock_reservado), 0);
  });

  constructor() {
    this.inventoryForm = this.fb.group({
      talla_id: ['', Validators.required],
      color_id: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      stock_reservado: [0, [Validators.min(0)]],
    });

    this.ajusteForm = this.fb.group({
      ajuste: [0, Validators.required],
      razon: [''],
    });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');

    if (!productId) {
      this.toastService.error('ID de producto no válido');
      this.goBack();
      return;
    }

    this.loadSizes();
    this.loadColors();
    this.loadProduct(productId);
    this.loadInventory(productId);
  }

  loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.toastService.error('No se pudo cargar el producto');
      },
    });
  }

  loadInventory(productId: string): void {
    this.isLoading.set(true);

    this.inventoryService.getAllInventarioProducto(productId).subscribe({
      next: (data) => {
        this.inventarios.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando inventario:', error);
        this.toastService.error('No se pudo cargar el inventario');
        this.isLoading.set(false);
      },
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

  openCreateForm(): void {
    this.selectedInventory.set(null);
    this.inventoryForm.reset({
      talla_id: '',
      color_id: '',
      stock: 0,
      stock_reservado: 0,
    });
    this.isFormOpen.set(true);
  }

  openEditForm(inventory: InventoryWithDetails): void {
    this.selectedInventory.set(inventory);
    this.inventoryForm.patchValue({
      talla_id: inventory.talla_id,
      color_id: inventory.color_id,
      stock: inventory.stock,
      stock_reservado: inventory.stock_reservado,
    });

    // Deshabilitar talla y color en edición
    this.inventoryForm.get('talla_id')?.disable();
    this.inventoryForm.get('color_id')?.disable();

    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedInventory.set(null);
    this.inventoryForm.reset();

    // Re-habilitar campos
    this.inventoryForm.get('talla_id')?.enable();
    this.inventoryForm.get('color_id')?.enable();
  }

  onSubmitForm(): void {
    if (this.inventoryForm.invalid || this.isSubmitting()) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const selected = this.selectedInventory();

    if (selected) {
      this.updateInventory(selected.id);
    } else {
      this.createInventory();
    }
  }

  createInventory(): void {
    const product = this.product();
    if (!product) return;

    const formData = this.inventoryForm.getRawValue();

    const data: InventoryCreate = {
      producto_id: product.id,
      talla_id: formData.talla_id,
      color_id: formData.color_id,
      stock: formData.stock,
      stock_reservado: formData.stock_reservado || 0,
    };

    this.inventoryService.createInventario(data).subscribe({
      next: () => {
        this.toastService.success('Inventario creado exitosamente');
        this.closeForm();
        this.loadInventory(product.id);
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error creando inventario:', error);
        this.toastService.error(error.error?.detail || 'No se pudo crear el inventario');
        this.isSubmitting.set(false);
      },
    });
  }

  updateInventory(id: string): void {
    const formData = this.inventoryForm.getRawValue();

    this.inventoryService
      .updateInventario(id, {
        stock: formData.stock,
        stock_reservado: formData.stock_reservado,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Inventario actualizado exitosamente');
          this.closeForm();

          const product = this.product();
          if (product) {
            this.loadInventory(product.id);
          }

          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Error actualizando inventario:', error);
          this.toastService.error(error.error?.detail || 'No se pudo actualizar el inventario');
          this.isSubmitting.set(false);
        },
      });
  }

  openAjusteModal(inventory: InventoryWithDetails): void {
    this.selectedInventory.set(inventory);
    this.ajusteForm.reset({
      ajuste: 0,
      razon: '',
    });
    this.isAjusteOpen.set(true);
  }

  closeAjusteModal(): void {
    this.isAjusteOpen.set(false);
    this.selectedInventory.set(null);
    this.ajusteForm.reset();
  }

  onSubmitAjuste(): void {
    if (this.ajusteForm.invalid || this.isSubmitting()) {
      return;
    }

    const inventory = this.selectedInventory();
    if (!inventory) return;

    this.isSubmitting.set(true);

    const ajusteData: InventoryAjuste = this.ajusteForm.value;

    this.inventoryService.ajustarStock(inventory.id, ajusteData).subscribe({
      next: () => {
        this.toastService.success(
          `Stock ajustado en ${ajusteData.ajuste > 0 ? '+' : ''}${ajusteData.ajuste} unidades`,
        );
        this.closeAjusteModal();

        const product = this.product();
        if (product) {
          this.loadInventory(product.id);
        }

        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error ajustando stock:', error);
        this.toastService.error(error.error?.detail || 'No se pudo ajustar el stock');
        this.isSubmitting.set(false);
      },
    });
  }

  openDeleteConfirm(inventory: InventoryWithDetails): void {
    this.inventoryToDelete.set(inventory);
    this.isConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isConfirmOpen.set(false);
    this.inventoryToDelete.set(null);
  }

  confirmDelete(): void {
    const inventory = this.inventoryToDelete();
    if (!inventory) return;

    this.inventoryService.deleteInventario(inventory.id).subscribe({
      next: () => {
        this.toastService.success('Inventario eliminado exitosamente');
        this.closeDeleteConfirm();

        const product = this.product();
        if (product) {
          this.loadInventory(product.id);
        }
      },
      error: (error) => {
        console.error('Error eliminando inventario:', error);
        this.closeDeleteConfirm();
        this.toastService.error(error.error?.detail || 'No se pudo eliminar el inventario');
      },
    });
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
      critico: 'bg-red-100 text-red-800',
      bajo: 'bg-yellow-100 text-yellow-800',
      normal: 'bg-blue-100 text-blue-800',
      alto: 'bg-green-100 text-green-800',
    };
    return colors[level as keyof typeof colors] || '';
  }

  goBack(): void {
    this.location.back();
  }
}
