import { Component, OnInit, signal, inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';
import { IonIcon } from '@ionic/angular/standalone';

// Registrar Chart.js
Chart.register(...registerables);

interface KPI {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

interface TopProducto {
  nombre: string;
  categoria: string;
  unidades_vendidas: number;
  ingresos: number;
}

@Component({
  selector: 'app-general-tab',
  standalone: true,
  imports: [IonIcon, CommonModule],
  templateUrl: './general-tab.component.html',
  styleUrl: './general-tab.component.css',
})
export class GeneralTabComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  private ventasMesChart?: Chart;
  private categoriasPieChart?: Chart;

  kpis = signal<KPI[]>([]);
  topProductos = signal<TopProducto[]>([]);
  estadisticasRapidas = signal<any>(null);
  cargando = signal(true);

  today = new Date();
  constructor(private dashboardService: DashboardService) {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.cargarDatos();
      });
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    }
  }

  private cargarDatos(): void {
    this.cargando.set(true);

    forkJoin({
      kpis: this.dashboardService.obtenerKPIsGenerales(),
      ventasMes: this.dashboardService.obtenerVentasPorMes(6),
      categorias: this.dashboardService.obtenerVentasPorCategoria(),
      topProductos: this.dashboardService.obtenerTopProductos(10),
      estadisticas: this.dashboardService.obtenerEstadisticasRapidas(),
    }).subscribe({
      next: (datos) => {
        this.actualizarKPIs(datos.kpis);
        this.topProductos.set(datos.topProductos);
        this.estadisticasRapidas.set(datos.estadisticas);

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.crearGraficos(datos);
          }, 100);
        }

        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando dashboard:', error);
        this.cargando.set(false);
      },
    });
  }

  private actualizarKPIs(datos: any): void {
    this.kpis.set([
      {
        label: 'Ventas Totales',
        value: `$${datos.ventas_totales.valor.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
        change: datos.ventas_totales.cambio,
        icon: 'cash-outline',
        color: 'bg-emily-rose',
      },
      {
        label: 'Órdenes',
        value: datos.ordenes.valor,
        change: datos.ordenes.cambio,
        icon: 'cart-outline',
        color: 'bg-emily-gold',
      },
      {
        label: 'Clientes Nuevos',
        value: datos.clientes_nuevos.valor,
        change: datos.clientes_nuevos.cambio,
        icon: 'people-outline',
        color: 'bg-emily-sage',
      },
    ]);
  }

  private crearGraficos(datos: any): void {
    this.crearVentasMesChart(datos.ventasMes.labels, datos.ventasMes.valores);
    this.crearCategoriasPieChart(datos.categorias.labels, datos.categorias.valores);
  }

  private crearVentasMesChart(labels: string[], valores: number[]): void {
    const ctx = document.getElementById('ventasMesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas',
            data: valores,
            backgroundColor: '#D4A5A5',
            borderRadius: 8,
            barThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#3E352F',
            padding: 12,
            callbacks: {
              label: (ctx) =>
                `$${ctx?.parsed?.y?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#F5EDE3' },
            ticks: {
              color: '#8B7F76',
              callback: (val) => `$${Number(val) / 1000}k`,
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#8B7F76' },
          },
        },
      },
    };

    this.ventasMesChart = new Chart(ctx, config);
  }

  private crearCategoriasPieChart(labels: string[], valores: number[]): void {
    const ctx = document.getElementById('categoriasPieChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: valores,
            backgroundColor: ['#D4A5A5', '#C9A961', '#A8B5A0', '#8B7F76', '#F5EDE3'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#3E352F', padding: 15 },
          },
        },
      },
    };

    this.categoriasPieChart = new Chart(ctx, config);
  }

  async exportarPDF(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Cambiar el ID según el tab:
      // - 'general-tab-content'
      // - 'productos-tab-content'
      // - 'clientes-tab-content'
      // - 'ventas-tab-content'
      // - 'analisis-tab-content'
      const element = document.getElementById('general-tab-content');

      if (!element) {
        console.error('Elemento no encontrado para exportar PDF');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FEFEFA',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Primera página
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Páginas adicionales si el contenido es muy largo
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`dashboard-general-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    }
  }

  ngOnDestroy(): void {
    this.ventasMesChart?.destroy();
    this.categoriasPieChart?.destroy();
  }
}
