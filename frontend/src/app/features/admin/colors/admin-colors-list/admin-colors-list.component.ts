import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ColorService } from '../../../../core/services/color.service';
import { ToastService } from '../../../../core/services/toast.service';
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
  selector: 'app-admin-colors-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-colors-list.component.html',
  styleUrl: './admin-colors-list.component.css',
})
export class AdminColorsListComponent implements OnInit {
  private colorService = inject(ColorService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;

  colors = signal<Color[]>([]);
  filteredColors = signal<Color[]>([]);


  isLoading = signal(true);
  isConfirmOpen = signal(false);


  colorToDelete = signal<Color | null>(null);

  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);


  get paginatedColors() {
    const filtered = this.filteredColors();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredColors().length / this.itemsPerPage());
  }

  ngOnInit(): void {
    this.loadColors();
  }

  loadColors(): void {
    this.isLoading.set(true);

    this.colorService.getColores(false).subscribe({
      next: (data) => {
        this.colors.set(data);
        this.filterColors();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando colores:', error);
        this.toastService.error('No se pudieron cargar los colores');
        this.isLoading.set(false);
      },
    });
  }

  filterColors(): void {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) {
      this.filteredColors.set(this.colors());
    } else {
      const filtered = this.colors().filter(
        (color) =>
          color.nombre.toLowerCase().includes(term) ||
          color.codigo_hexadecimal?.toLowerCase().includes(term),
      );
      this.filteredColors.set(filtered);
    }

    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.filterColors();
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/colores/nuevo']);
  }

  navigateToEdit(color: Color): void {
    this.router.navigate(['/admin/colores/editar', color.id]);
  }

  openDeleteConfirm(color: Color): void {
    this.colorToDelete.set(color);
    this.isConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isConfirmOpen.set(false);
    this.colorToDelete.set(null);
  }

  confirmDelete(): void {
    const color = this.colorToDelete();

    if (!color) return;

    this.colorService.deleteColor(color.id).subscribe({
      next: () => {
        this.toastService.success('Color eliminado exitosamente');
        this.closeDeleteConfirm();
        this.loadColors();
      },
      error: (error) => {
        console.error('Error eliminando color:', error);
        this.toastService.error('No se pudo eliminar el color');
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
