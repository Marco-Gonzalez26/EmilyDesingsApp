import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { UsuarioAdminService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserDetail } from '@shared/models/user';
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
  selector: 'app-admin-usuario-detail',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, RouterLink],
  templateUrl: './admin-user-detail.component.html',
  styleUrl: './admin-user-detail.component.css',
})
export class AdminUserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usuarioService = inject(UsuarioAdminService);
  private toastService = inject(ToastService);

  readonly Math = Math;

  usuario = signal<UserDetail | null>(null);
  ordenes = signal<any[]>([]);
  analisis = signal<any[]>([]);

  isLoading = signal(true);
  isLoadingOrdenes = signal(false);
  isLoadingAnalisis = signal(false);

  currentTab = signal<'info' | 'ordenes' | 'analisis'>('info');

  ordenesPage = signal(1);
  ordenesTotal = signal(0);
  ordenesLimit = signal(10);

  analisisPage = signal(1);
  analisisTotal = signal(0);
  analisisLimit = signal(10);

  userInitials = computed(() => {
    const user = this.usuario();
    if (!user?.nombre_completo) return 'U';
    const names = user.nombre_completo.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  });

  ngOnInit(): void {
    const usuarioId = this.route.snapshot.paramMap.get('id');

    if (!usuarioId) {
      this.toastService.error('ID de usuario no válido');
      this.goBack();
      return;
    }

    this.loadUsuario(usuarioId);
  }

  loadUsuario(id: string): void {
    this.isLoading.set(true);

    this.usuarioService.getUsuarioDetail(id).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.isLoading.set(false);

        // Cargar órdenes por defecto
        this.loadOrdenes(id);
      },
      error: (error) => {
        console.error('Error cargando usuario:', error);
        this.toastService.error('No se pudo cargar el usuario');
        this.isLoading.set(false);
      },
    });
  }

  loadOrdenes(usuarioId: string): void {
    this.isLoadingOrdenes.set(true);

    const skip = (this.ordenesPage() - 1) * this.ordenesLimit();

    this.usuarioService.getUsuarioOrdenes(usuarioId, skip, this.ordenesLimit()).subscribe({
      next: (response) => {
        this.ordenes.set(response.ordenes);
        this.ordenesTotal.set(response.total);
        this.isLoadingOrdenes.set(false);
      },
      error: (error) => {
        console.error('Error cargando órdenes:', error);
        this.isLoadingOrdenes.set(false);
      },
    });
  }

  loadAnalisis(usuarioId: string): void {
    this.isLoadingAnalisis.set(true);

    const skip = (this.analisisPage() - 1) * this.analisisLimit();

    this.usuarioService.getUsuarioAnalisis(usuarioId, skip, this.analisisLimit()).subscribe({
      next: (response) => {
        this.analisis.set(response.analisis);
        this.analisisTotal.set(response.total);
        this.isLoadingAnalisis.set(false);
      },
      error: (error) => {
        console.error('Error cargando análisis:', error);
        this.isLoadingAnalisis.set(false);
      },
    });
  }

  changeTab(tab: 'info' | 'ordenes' | 'analisis'): void {
    this.currentTab.set(tab);

    const user = this.usuario();
    if (!user) return;

    if (tab === 'analisis' && this.analisis().length === 0) {
      this.loadAnalisis(user.id);
    }
  }

  editUsuario(): void {
    const user = this.usuario();
    if (user) {
      this.router.navigate(['/admin/usuarios/editar', user.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  formatDate(date: string): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatShortDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
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

  getOrdenEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      Pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
      'En Proceso': 'bg-purple-100 text-purple-800 border-purple-200',
      Enviado: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Entregado: 'bg-green-100 text-green-800 border-green-200',
      Cancelado: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  verOrden(ordenId: string): void {
    this.router.navigate(['/admin/ordenes', ordenId]);
  }
}
