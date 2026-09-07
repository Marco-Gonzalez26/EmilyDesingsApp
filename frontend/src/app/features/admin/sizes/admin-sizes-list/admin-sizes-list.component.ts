import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TallaService } from '../../../../core/services/size.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Talla } from '@app/shared/models/size';
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
  selector: 'app-admin-sizes-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-sizes-list.component.html',
  styleUrl: './admin-sizes-list.component.css',
})
export class AdminSizesListComponent implements OnInit {
  private sizeService = inject(TallaService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;
  sizes = signal<Talla[]>([]);
  filteredSizes = signal<Talla[]>([]);

  // UI State
  isLoading = signal(true);
  isConfirmOpen = signal(false);

  // Selection
  sizeToDelete = signal<Talla | null>(null);

  // Search & Pagination
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  // Computed
  get paginatedSizes() {
    const filtered = this.filteredSizes();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredSizes().length / this.itemsPerPage());
  }

  ngOnInit(): void {
    this.loadSizes();
  }

  loadSizes(): void {
    this.isLoading.set(true);

    this.sizeService.getTallas(false).subscribe({
      next: (data) => {
        this.sizes.set(data);
        this.filterSizes();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando tallas:', error);
        this.toastService.error('No se pudieron cargar las tallas');
        this.isLoading.set(false);
      },
    });
  }

  filterSizes(): void {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) {
      this.filteredSizes.set(this.sizes());
    } else {
      const filtered = this.sizes().filter((size) => size.nombre.toLowerCase().includes(term));
      this.filteredSizes.set(filtered);
    }

    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.filterSizes();
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/tallas/nueva']);
  }

  navigateToEdit(size: Talla): void {
    this.router.navigate(['/admin/tallas/editar', size.id]);
  }

  moveUp(size: Talla, index: number): void {
    if (index === 0) return;

    const allSizes = this.paginatedSizes;
    const prevSize = allSizes[index - 1];

    // Intercambiar orden
    const tempOrden = size.orden;

    forkJoin({
      current: this.sizeService.updateTalla(size.id, { orden: prevSize.orden }),
      previous: this.sizeService.updateTalla(prevSize.id, { orden: tempOrden }),
    }).subscribe({
      next: () => {
        this.loadSizes();
        this.toastService.success('La talla se movió hacia arriba');
      },
      error: (error) => {
        console.error('Error actualizando orden:', error);
        this.toastService.error('No se pudo actualizar el orden');
      },
    });
  }

  moveDown(size: Talla, index: number): void {
    const allSizes = this.paginatedSizes;
    if (index === allSizes.length - 1) return;

    const nextSize = allSizes[index + 1];

    // Intercambiar orden
    const tempOrden = size.orden;

    forkJoin({
      current: this.sizeService.updateTalla(size.id, { orden: nextSize.orden }),
      next: this.sizeService.updateTalla(nextSize.id, { orden: tempOrden }),
    }).subscribe({
      next: () => {
        this.loadSizes();
        this.toastService.success('La talla se movió hacia abajo');
      },
      error: (error) => {
        console.error('Error actualizando orden:', error);
        this.toastService.error('No se pudo actualizar el orden');
      },
    });
  }

  openDeleteConfirm(size: Talla): void {
    this.sizeToDelete.set(size);
    this.isConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isConfirmOpen.set(false);
    this.sizeToDelete.set(null);
  }

  confirmDelete(): void {
    const size = this.sizeToDelete();

    if (!size) return;

    this.sizeService.deleteTalla(size.id).subscribe({
      next: () => {
        this.toastService.success('Talla eliminada exitosamente');
        this.closeDeleteConfirm();
        this.loadSizes();
      },
      error: (error) => {
        console.error('Error eliminando talla:', error);
        this.closeDeleteConfirm();
        this.toastService.error('No se pudo eliminar la talla');
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
