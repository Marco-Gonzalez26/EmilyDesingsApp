import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { UsuarioAdminService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { User, UserFilters, UserListItem } from '@shared/models/user';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-usuarios-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, IonRouterLink, IonRouterLinkWithHref, CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './admin-users-list.component.html',
  styleUrl: './admin-users-list.component.css',
})
export class AdminUsersListComponent implements OnInit {
  private usuarioService = inject(UsuarioAdminService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly Math = Math;
  usuarios = signal<UserListItem[]>([]);
  totalUsuarios = signal(0);

  isLoading = signal(true);
  showFilters = signal(false);

  searchTerm = signal('');
  selectedActivo = signal<string>('');
  fechaDesde = signal('');
  fechaHasta = signal('');

  currentPage = signal(1);
  itemsPerPage = signal(50);

  totalPages = computed(() => {
    return Math.ceil(this.totalUsuarios() / this.itemsPerPage());
  });

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.isLoading.set(true);

    const filters: UserFilters = {
      skip: (this.currentPage() - 1) * this.itemsPerPage(),
      limit: this.itemsPerPage(),
    };

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    if (this.selectedActivo() !== '') {
      filters.activo = this.selectedActivo() === 'true';
    }

    if (this.fechaDesde()) {
      filters.fecha_desde = this.fechaDesde();
    }

    if (this.fechaHasta()) {
      filters.fecha_hasta = this.fechaHasta();
    }

    this.usuarioService.getAllUsuarios(filters).subscribe({
      next: (response) => {
        this.usuarios.set(response.clientes);
        this.totalUsuarios.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.toastService.error('No se pudieron cargar los usuarios');
        this.isLoading.set(false);
      },
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadUsuarios();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsuarios();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedActivo.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.currentPage.set(1);
    this.loadUsuarios();
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  viewUsuarioDetail(usuarioId: string): void {
    this.router.navigate(['/admin/usuarios', usuarioId]);
  }

  isConfirmOpen = signal(false);
  private usuarioObjetivo = signal<UserListItem | null>(null);
  pendingActivo = signal(true);

  openToggleConfirm(usuario: UserListItem): void {
    this.usuarioObjetivo.set(usuario);
    this.pendingActivo.set(usuario.activo === false);
    this.isConfirmOpen.set(true);
  }

  closeToggleConfirm(): void {
    this.isConfirmOpen.set(false);
    this.usuarioObjetivo.set(null);
  }

  confirmToggle(): void {
    const usuario = this.usuarioObjetivo();
    if (!usuario) return;
    const activo = this.pendingActivo();
    this.usuarioService.toggleActivo(usuario.id, activo).subscribe({
      next: () => {
        this.closeToggleConfirm();
        this.loadUsuarios();
        this.toastService.success(activo ? 'Usuario activado' : 'Usuario desactivado');
      },
      error: (error) => {
        console.error('Error cambiando estado:', error);
        this.closeToggleConfirm();
        this.toastService.error(error.error?.detail || 'No se pudo cambiar el estado');
      },
    });
  }

  refreshList(): void {
    this.loadUsuarios();
    this.toastService.info('Lista de usuarios actualizada');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  formatDate(date: string): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatRegistrationDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getEstadoBadge(activo: boolean): string {
    return activo
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  }

  getEstadoLabel(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadUsuarios();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadUsuarios();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadUsuarios();
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }

    return pages;
  }
}
