import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

type TabType = 'ventas' | 'productos' | 'stock' | 'clientes';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private toastService = inject(ToastService);

  currentTab = signal<TabType>('ventas');

  fechaDesde = signal('');
  fechaHasta = signal('');
  umbralStock = signal(10);
  limitProductos = signal(20);
  limitClientes = signal(20);

  ventasData = signal<any>(null);
  productosData = signal<any[]>([]);
  stockData = signal<any[]>([]);
  clientesData = signal<any[]>([]);

  isLoadingVentas = signal(false);
  isLoadingProductos = signal(false);
  isLoadingStock = signal(false);
  isLoadingClientes = signal(false);

  ngOnInit(): void {
    const hoy = new Date();
    const hace30dias = new Date();
    hace30dias.setDate(hoy.getDate() - 30);

    this.fechaDesde.set(hace30dias.toISOString().split('T')[0]);
    this.fechaHasta.set(hoy.toISOString().split('T')[0]);

    this.loadVentas();
  }

  changeTab(tab: TabType): void {
    this.currentTab.set(tab);

    switch (tab) {
      case 'ventas':
        if (!this.ventasData()) this.loadVentas();
        break;
      case 'productos':
        if (this.productosData().length === 0) this.loadProductos();
        break;
      case 'stock':
        if (this.stockData().length === 0) this.loadStock();
        break;
      case 'clientes':
        if (this.clientesData().length === 0) this.loadClientes();
        break;
    }
  }

  loadVentas(): void {
    this.isLoadingVentas.set(true);

    this.reportService.getVentasPeriodo(this.fechaDesde(), this.fechaHasta()).subscribe({
      next: (data) => {
        this.ventasData.set(data);
        this.isLoadingVentas.set(false);
      },
      error: (error) => {
        console.error('Error:', error);
        this.toastService.error('No se pudo cargar el reporte');
        this.isLoadingVentas.set(false);
      },
    });
  }

  loadProductos(): void {
    this.isLoadingProductos.set(true);

    this.reportService
      .getProductosVendidos(
        this.fechaDesde() || undefined,
        this.fechaHasta() || undefined,
        this.limitProductos(),
      )
      .subscribe({
        next: (data) => {
          this.productosData.set(data);
          this.isLoadingProductos.set(false);
        },
        error: (error) => {
          console.error('Error:', error);
          this.toastService.error('No se pudo cargar el reporte');
          this.isLoadingProductos.set(false);
        },
      });
  }

  loadStock(): void {
    this.isLoadingStock.set(true);

    this.reportService.getStockBajo(this.umbralStock()).subscribe({
      next: (data) => {
        this.stockData.set(data);
        this.isLoadingStock.set(false);
      },
      error: (error) => {
        console.error('Error:', error);
        this.toastService.error('No se pudo cargar el reporte');
        this.isLoadingStock.set(false);
      },
    });
  }

  loadClientes(): void {
    this.isLoadingClientes.set(true);

    this.reportService
      .getMejoresClientes(
        this.fechaDesde() || undefined,
        this.fechaHasta() || undefined,
        this.limitClientes(),
      )
      .subscribe({
        next: (data) => {
          this.clientesData.set(data);
          this.isLoadingClientes.set(false);
        },
        error: (error) => {
          console.error('Error:', error);
          this.toastService.error('No se pudo cargar el reporte');
          this.isLoadingClientes.set(false);
        },
      });
  }

  exportVentasPDF(): void {
    this.reportService.exportVentasPDF(this.fechaDesde(), this.fechaHasta()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ventas_${this.fechaDesde()}_${this.fechaHasta()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toastService.success('PDF descargado exitosamente');
      },
      error: (error) => {
        console.error('Error descargando PDF:', error);
        this.toastService.error('No se pudo descargar el PDF');
      },
    });
  }

  exportProductosPDF(): void {
    this.reportService
      .exportProductosVendidosPDF(
        this.fechaDesde() || undefined,
        this.fechaHasta() || undefined,
        this.limitProductos(),
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `productos_vendidos_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.toastService.success('PDF descargado exitosamente');
        },
        error: (error) => {
          console.error('Error descargando PDF:', error);
          this.toastService.error('No se pudo descargar el PDF');
        },
      });
  }

  exportStockPDF(): void {
    this.reportService.exportStockBajoPDF(this.umbralStock()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock_bajo_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toastService.success('PDF descargado exitosamente');
      },
      error: (error) => {
        console.error('Error descargando PDF:', error);
        this.toastService.error('No se pudo descargar el PDF');
      },
    });
  }

  exportClientesPDF(): void {
    this.reportService
      .exportMejoresClientesPDF(
        this.fechaDesde() || undefined,
        this.fechaHasta() || undefined,
        this.limitClientes(),
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `mejores_clientes_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.toastService.success('PDF descargado exitosamente');
        },
        error: (error) => {
          console.error('Error descargando PDF:', error);
          this.toastService.error('No se pudo descargar el PDF');
        },
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
