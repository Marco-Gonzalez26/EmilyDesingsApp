import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { BrandService } from '../../../../core/services/brand.service';
import { ToastService } from '../../../../core/services/toast.service';
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
  selector: 'app-admin-brands-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-brands-list.component.html',
  styleUrl: './admin-brands-list.component.css',
})
export class AdminBrandsListComponent implements OnInit {
  private brandService = inject(BrandService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;

  brands = signal<Brand[]>([]);
  filteredBrands = signal<Brand[]>([]);

  isLoading = signal(true);
  isConfirmOpen = signal(false);

  brandToDelete = signal<Brand | null>(null);

  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  get paginatedBrands() {
    const filtered = this.filteredBrands();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredBrands().length / this.itemsPerPage());
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading.set(true);

    this.brandService.getMarcas(false).subscribe({
      next: (data) => {
        this.brands.set(data);
        this.filterBrands();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando marcas:', error);
        this.toastService.error('No se pudieron cargar las marcas');
        this.isLoading.set(false);
      },
    });
  }

  filterBrands(): void {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) {
      this.filteredBrands.set(this.brands());
    } else {
      const filtered = this.brands().filter(
        (brand) =>
          brand.nombre.toLowerCase().includes(term) ||
          brand.descripcion?.toLowerCase().includes(term),
      );
      this.filteredBrands.set(filtered);
    }

    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.filterBrands();
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/marcas/nueva']);
  }

  navigateToEdit(brand: Brand): void {
    this.router.navigate(['/admin/marcas/editar', brand.id]);
  }

  openDeleteConfirm(brand: Brand): void {
    this.brandToDelete.set(brand);
    this.isConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isConfirmOpen.set(false);
    this.brandToDelete.set(null);
  }

  confirmDelete(): void {
    const brand = this.brandToDelete();

    if (!brand) return;

    this.brandService.deleteMarca(brand.id).subscribe({
      next: () => {
        this.toastService.success('Marca eliminada exitosamente');
        this.closeDeleteConfirm();
        this.loadBrands();
      },
      error: (error) => {
        console.error('Error eliminando marca:', error);
        this.toastService.error('No se pudo eliminar la marca');
      },
    });
  }

  changePage(page: number): void {
    this.currentPage.set(page);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update((p) => p + 1);
    }
  }
}
