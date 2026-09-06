import {
  Component,
  OnInit,
  signal,
  inject,
  PLATFORM_ID,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

interface MesDisponible {
  value: string;
  label: string;
  year: number;
  month: number;
}

@Component({
  selector: 'app-orders-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-tab.component.html',
  styleUrl: './orders-tab.component.css',
})
export class OrdersTabComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private dashboardService = inject(DashboardService);

  private ventasMesChart?: Chart;

  kpis = signal<any>(null);
  metricas = signal<any>(null);
  mesesDisponibles = signal<MesDisponible[]>([]);
  mesSeleccionado = signal<string>('todos');
  cargando = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.generarMesesDisponibles();
        this.cargarDatos();
      });
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.generarMesesDisponibles();
      this.cargarDatos();
    }
  }

  private generarMesesDisponibles(): void {
    const meses: MesDisponible[] = [];
    const hoy = new Date();

    const mesesNombres = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    for (let i = 0; i < 6; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const year = fecha.getFullYear();
      const month = fecha.getMonth() + 1;

      meses.push({
        value: `${year}-${String(month).padStart(2, '0')}`,
        label: `${mesesNombres[fecha.getMonth()]} ${year}`,
        year: year,
        month: month,
      });
    }

    this.mesesDisponibles.set(meses);
  }

  private cargarDatos(): void {
    this.cargando.set(true);

    forkJoin({
      kpis: this.dashboardService.obtenerKPIsVentas(),
      ventasMes: this.dashboardService.obtenerVentasPorMes(6),
      metricas: this.dashboardService.obtenerMetricasAvanzadas(),
    }).subscribe({
      next: (datos) => {
        this.kpis.set(datos.kpis);
        this.metricas.set(datos.metricas);

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.crearVentasMesChart(datos.ventasMes.labels, datos.ventasMes.valores);
          }, 100);
        }

        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando ventas:', error);
        this.cargando.set(false);
      },
    });
  }

  onMesChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const mesSeleccionado = select.value;
    this.mesSeleccionado.set(mesSeleccionado);

    if (mesSeleccionado === 'todos') {
      this.cargarDatos();
    } else {
      const mesData = this.mesesDisponibles().find((m) => m.value === mesSeleccionado);
      if (mesData) {
        this.cargarDatosMesEspecifico(mesData.year, mesData.month);
      }
    }
  }

  private cargarDatosMesEspecifico(year: number, month: number): void {
    this.cargando.set(true);

    this.dashboardService.obtenerVentasMesEspecifico(year, month).subscribe({
      next: (datos) => {
        if (isPlatformBrowser(this.platformId)) {
          this.actualizarGraficoMesEspecifico(datos.mes, datos.total);
        }
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando mes específico:', error);
        this.cargando.set(false);
      },
    });
  }

  private crearVentasMesChart(labels: string[], valores: number[]): void {
    const ctx = document.getElementById('ventasMesChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.ventasMesChart) {
      this.ventasMesChart.destroy();
    }

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
            barThickness: 50,
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

  private actualizarGraficoMesEspecifico(label: string, valor: number): void {
    if (this.ventasMesChart) {
      this.ventasMesChart.destroy();
      this.ventasMesChart = undefined;
    }

    setTimeout(() => {
      this.crearVentasMesChart([label], [valor]);
    }, 100);
  }

  exportarPDF(): void {
    document.body.classList.add('printing-dashboard');

    this.ocultarElementosParaPDF(true);

    window.print();

    setTimeout(() => {
      document.body.classList.remove('printing-dashboard');
      this.ocultarElementosParaPDF(false);
    }, 100);
  }

  private ocultarElementosParaPDF(ocultar: boolean): void {
    const elementosAOcultar = ['.no-print', 'button', 'aside', '.dashboard-tabs'];

    elementosAOcultar.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (ocultar) {
          htmlEl.style.display = 'none';
        } else {
          htmlEl.style.display = '';
        }
      });
    });
  }
  calcularProgreso(valor: number, multiplicador: number): number {
    return Math.min((valor || 0) * multiplicador, 100);
  }
  ngOnDestroy(): void {
    this.ventasMesChart?.destroy();
  }
}
