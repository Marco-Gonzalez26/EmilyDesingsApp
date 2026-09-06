// src/app/features/admin/dashboard/tabs/clientes-tab.component.ts

import { Component, OnInit, signal, inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-clients-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients-tab.component.html',
  styleUrl: './clients-tab.component.css',
})
export class ClientsTabComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private dashboardService = inject(DashboardService);


  private nuevosVsRecurrentesChart?: Chart;
  private porCiudadChart?: Chart;


  kpis = signal<any>(null);
  topCompradores = signal<any[]>([]);
  cargando = signal(true);

  constructor() {
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
      kpis: this.dashboardService.obtenerKPIsClientes(),
      nuevosVsRecurrentes: this.dashboardService.obtenerClientesNuevosVsRecurrentes(6),
      porCiudad: this.dashboardService.obtenerClientesPorCiudad(),
      topCompradores: this.dashboardService.obtenerTopCompradores(10),
    }).subscribe({
      next: (datos) => {
        this.kpis.set(datos.kpis);
        this.topCompradores.set(datos.topCompradores);

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.crearGraficos(datos);
          }, 100);
        }

        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
        this.cargando.set(false);
      },
    });
  }

  private crearGraficos(datos: any): void {
    this.crearNuevosVsRecurrentesChart(
      datos.nuevosVsRecurrentes.labels,
      datos.nuevosVsRecurrentes.nuevos,
      datos.nuevosVsRecurrentes.recurrentes,
    );
    this.crearPorCiudadChart(datos.porCiudad.labels, datos.porCiudad.valores);
  }

  private crearNuevosVsRecurrentesChart(
    labels: string[],
    nuevos: number[],
    recurrentes: number[],
  ): void {
    const ctx = document.getElementById('nuevosVsRecurrentesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Clientes Nuevos',
            data: nuevos,
            backgroundColor: '#C9A961',
            borderRadius: 6,
          },
          {
            label: 'Clientes Recurrentes',
            data: recurrentes,
            backgroundColor: '#D4A5A5',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#3E352F', padding: 15 },
          },
          tooltip: {
            backgroundColor: '#3E352F',
            padding: 12,
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#8B7F76' },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: '#F5EDE3' },
            ticks: { color: '#8B7F76' },
          },
        },
      },
    };

    this.nuevosVsRecurrentesChart = new Chart(ctx, config);
  }

  private crearPorCiudadChart(labels: string[], valores: number[]): void {
    const ctx = document.getElementById('porCiudadChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Clientes',
            data: valores,
            backgroundColor: '#A8B5A0',
            borderRadius: 8,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#3E352F',
            padding: 12,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: '#F5EDE3' },
            ticks: { color: '#8B7F76' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#8B7F76' },
          },
        },
      },
    };

    this.porCiudadChart = new Chart(ctx, config);
  }

  async exportarPDF(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('clients-tab-content');

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

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Cambiar el nombre según el tab
      pdf.save(`dashboard-clientes-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    }
  }

  ngOnDestroy(): void {
    this.nuevosVsRecurrentesChart?.destroy();
    this.porCiudadChart?.destroy();
  }
}
