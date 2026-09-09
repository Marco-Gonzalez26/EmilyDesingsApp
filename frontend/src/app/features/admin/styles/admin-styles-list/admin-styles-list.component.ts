import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { StyleService } from '../../../../core/services/style.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Estilo } from '@app/shared/models/style';
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
  selector: 'app-admin-styles-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-styles-list.component.html',
  styleUrl: './admin-styles-list.component.css',
})
export class AdminStylesListComponent implements OnInit {
  private styleService = inject(StyleService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;

  estilos = signal<Estilo[]>([]);
  filteredEstilos = signal<Estilo[]>([]);
  isLoading = signal(true);
  isConfirmOpen = signal(false);
  estiloToDelete = signal<Estilo | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  get paginatedEstilos() {
    const filtered = this.filteredEstilos();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredEstilos().length / this.itemsPerPage());
  }

  ngOnInit(): void {
    this.loadEstilos();
  }

  loadEstilos(): void {
    this.isLoading.set(true);
    this.styleService.getEstilos(true).subscribe({
      next: (data) => {
        this.estilos.set(data);
        this.filterEstilos();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando estilos:', error);
        this.toastService.error('No se pudieron cargar los estilos');
        this.isLoading.set(false);
      },
    });
  }

  filterEstilos(): void {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredEstilos.set(this.estilos());
    } else {
      this.filteredEstilos.set(
        this.estilos().filter(
          (e) => e.nombre.toLowerCase().includes(term) || e.descripcion?.toLowerCase().includes(term),
        ),
      );
    }
    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.filterEstilos();
  }

  toggleActivo(estilo: Estilo): void {
    this.styleService.toggleActivo(estilo.id).subscribe({
      next: () => {
        this.toastService.success(`${estilo.nombre} ${estilo.activo ? 'desactivado' : 'activado'}`);
        this.loadEstilos();
      },
      error: () => this.toastService.error('No se pudo cambiar el estado'),
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/estilos/nuevo']);
  }

  navigateToEdit(estilo: Estilo): void {
    this.router.navigate(['/admin/estilos/editar', estilo.id]);
  }

  openDeleteConfirm(estilo: Estilo): void {
    this.estiloToDelete.set(estilo);
    this.isConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isConfirmOpen.set(false);
    this.estiloToDelete.set(null);
  }

  confirmDelete(): void {
    const estilo = this.estiloToDelete();
    if (!estilo) return;
    this.styleService.deleteEstilo(estilo.id).subscribe({
      next: () => {
        this.toastService.success('Estilo eliminado');
        this.closeDeleteConfirm();
        this.loadEstilos();
      },
      error: (err) => {
        this.closeDeleteConfirm();
        const msg = err?.error?.detail || 'No se pudo eliminar el estilo';
        this.toastService.error(msg);
      },
    });
  }

  changePage(page: number): void {
    this.currentPage.set(page);
  }
}
