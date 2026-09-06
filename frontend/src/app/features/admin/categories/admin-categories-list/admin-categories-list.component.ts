import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CategoryService } from '../../../../core/services/category.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Category } from '@app/shared/models/category';
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
  selector: 'app-admin-categories-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-categories-list.component.html',
  styleUrl: './admin-categories-list.component.css',
})
export class AdminCategoriesListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;
  categories = signal<Category[]>([]);
  filteredCategories = signal<Category[]>([]);

  isLoading = signal(true);
  isConfirmOpen = signal(false);

  categoryToDelete = signal<Category | null>(null);

  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  get paginatedCategories() {
    const filtered = this.filteredCategories();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredCategories().length / this.itemsPerPage());
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);

    this.categoryService.getCategorias(false).subscribe({
      next: (data) => {
        this.categories.set(data);
        this.filterCategories();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.toastService.error('No se pudieron cargar las categorías');
        this.isLoading.set(false);
      },
    });
  }

  filterCategories(): void {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) {
      this.filteredCategories.set(this.categories());
    } else {
      const filtered = this.categories().filter(
        (cat) =>
          cat.nombre.toLowerCase().includes(term) || cat.descripcion?.toLowerCase().includes(term),
      );
      this.filteredCategories.set(filtered);
    }

    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.filterCategories();
  }

  // ← NUEVO: Navegar a crear
  navigateToCreate(): void {
    this.router.navigate(['/admin/categorias/nueva']);
  }

  // ← NUEVO: Navegar a editar
  navigateToEdit(category: Category): void {
    this.router.navigate(['/admin/categorias/editar', category.id]);
  }

  openDeleteConfirm(category: Category): void {
    this.categoryToDelete.set(category);
    this.isConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isConfirmOpen.set(false);
    this.categoryToDelete.set(null);
  }

  confirmDelete(): void {
    const category = this.categoryToDelete();

    if (!category) return;

    this.categoryService.deleteCategoria(category.id).subscribe({
      next: () => {
        this.toastService.success('Categoría eliminada exitosamente');
        this.closeDeleteConfirm();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error eliminando categoría:', error);
        this.toastService.error('No se pudo eliminar la categoría');
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
