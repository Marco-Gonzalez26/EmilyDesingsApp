import { Component, OnInit, signal, inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { ProductoRecomendado } from '@app/shared/models/dashboard';

@Component({
  selector: 'app-analysis-tab',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './analysis-tab.component.html',
  styleUrl: './analysis-tab.component.css',
})
export class AnalysisTabComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private dashboardService = inject(DashboardService);

  topProductos = signal<ProductoRecomendado[]>([]);
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

    this.dashboardService.obtenerProductosMasRecomendados(10).subscribe({
      next: (productos) => {
        this.topProductos.set(productos);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando productos recomendados:', error);
        this.cargando.set(false);
      },
    });
  }

  getTotalRecomendaciones(): number {
    return this.topProductos().reduce((acc, p) => acc + p.veces_recomendado, 0);
  }

  getScorePromedio(): number {
    const productos = this.topProductos();
    if (productos.length === 0) return 0;
    const sum = productos.reduce(
      (acc, p) => acc + ((p as any).score_promedio ?? 0),
      0,
    );
    return parseFloat((sum / productos.length).toFixed(4));
  }

  formatTasa(tasa: number): string {
    return `${tasa}%`;
  }

  async exportarPDF(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('analysis-tab-content');

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

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`dashboard-productos-recomendados-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  }
}
