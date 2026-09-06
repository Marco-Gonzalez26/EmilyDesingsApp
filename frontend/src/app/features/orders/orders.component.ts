import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Orden, OrdenItem } from '../../shared/models/order';
import { OrdenService } from '../../core/services/order.service';
import { Product } from '../../shared/models/product';
import { ProductoService } from '../../core/services/product.service';
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
  selector: 'app-orders',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonBackButton, IonButtons, IonRouterLink, IonRouterLinkWithHref, CommonModule, RouterModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  ordenes = signal<Orden[]>([]);
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
    private ordenService: OrdenService,
    private productService: ProductoService,
  ) {}

  ngOnInit(): void {
    this.loadOrdenes();
  }

  loadOrdenes(): void {
    this.isLoading.set(true);
    this.ordenService.getMisOrdenes().subscribe({
      next: (ordenes) => {
        this.ordenes.set(ordenes);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  getEstadoClass(estado: string): string {
    return this.estadoColors[estado] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
