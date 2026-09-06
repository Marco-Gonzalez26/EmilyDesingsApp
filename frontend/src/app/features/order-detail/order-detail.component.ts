import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Orden } from '../../shared/models/order';
import { OrdenService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-order-detail',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, IonRouterLink, IonRouterLinkWithHref, CommonModule, RouterModule],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  orden = signal<Orden | null>(null);
  isLoading = signal(true);

  estadoColors: { [key: string]: string } = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    Confirmado: 'bg-emily-sage/20 text-emily-sage',
    'En Proceso': 'bg-blue-100 text-blue-800',
    Enviado: 'bg-purple-100 text-purple-800',
    Entregado: 'bg-green-100 text-green-800',
    Cancelado: 'bg-emily-rose/20 text-emily-rose',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordenService: OrdenService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadOrden(id);
      }
    });
  }

  loadOrden(id: string): void {
    this.isLoading.set(true);
    this.ordenService.getOrdenById(id).subscribe({
      next: (orden) => {
        this.orden.set(orden);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/ordenes']);
      },
    });
  }

  getEstadoClass(estado: string): string {
    return this.estadoColors[estado] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  downloadReceipt(): void {
    this.ordenService.descargarPDF(this.orden()!.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.orden()!.numero_orden}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Intenta nuevamente');
      },
    });
  }
}
