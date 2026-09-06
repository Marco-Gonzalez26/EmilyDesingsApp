import { Component, OnInit, signal, inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

interface ProductoPorStock {
  nombre: string;
  categoria: string;
  stock: number;
}

@Component({
  selector: 'app-products-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products-tab.component.html',
  styleUrl: './products-tab.component.css',
})
export class ProductsTabComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private dashboardService = inject(DashboardService);


  private ingresosChart?: Chart;
  private distribucionChart?: Chart;

  kpis = signal<any>(null);
  topProductos = signal<any[]>([]);
  productosPorStock = signal<ProductoPorStock[]>([]);
  filtroStock = signal<string>('todos');
  cargando = signal(true);

  niveles_stock = [
    { value: 'todos', label: 'Todos' },
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'alto', label: 'Alto' },
    { value: 'optimo', label: 'Óptimo' },
  ];

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
      kpis: this.dashboardService.obtenerKPIsProductos(),
      ingresos: this.dashboardService.obtenerIngresosPorCategoria(),
      distribucion: this.dashboardService.obtenerDistribucionPorCategoria(),
      topProductos: this.dashboardService.obtenerTopProductos(10),
    }).subscribe({
      next: (datos) => {
        this.kpis.set(datos.kpis);
        this.topProductos.set(datos.topProductos);

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.crearGraficos(datos);
          }, 100);
        }

        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.cargando.set(false);
      },
    });
  }

  private crearGraficos(datos: any): void {
    this.crearIngresosChart(datos.ingresos.labels, datos.ingresos.valores);
    this.crearDistribucionChart(datos.distribucion.labels, datos.distribucion.valores);
  }

  private crearIngresosChart(labels: string[], valores: number[]): void {
    const ctx = document.getElementById('ingresosChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: valores,
            backgroundColor: '#D4A5A5',
            borderRadius: 8,
            barThickness: 40,
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
            callbacks: {
              label: (ctx) =>
                `$${ctx?.parsed?.x?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: '#F5EDE3' },
            ticks: {
              color: '#8B7F76',
              callback: (val) => `$${Number(val) / 1000}k`,
            },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#8B7F76' },
          },
        },
      },
    };

    this.ingresosChart = new Chart(ctx, config);
  }

  private crearDistribucionChart(labels: string[], valores: number[]): void {
    const ctx = document.getElementById('distribucionChart') as HTMLCanvasElement;
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
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#3E352F',
              padding: 15,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#3E352F',
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percent = ((ctx.parsed / total) * 100).toFixed(1);
                return `${ctx.label}: ${ctx.parsed} (${percent}%)`;
              },
            },
          },
        },
      },
    };

    this.distribucionChart = new Chart(ctx, config);
  }

  filtrarPorStock(nivel: string): void {
    this.filtroStock.set(nivel);

    if (nivel === 'todos') {
      this.productosPorStock.set([]);
      return;
    }

    this.dashboardService.obtenerProductosPorNivelStock(nivel).subscribe({
      next: (productos) => {
        this.productosPorStock.set(productos);
      },
      error: (error) => {
        console.error('Error filtrando productos:', error);
      },
    });
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

  // private async forzarRGBEnElemento(element: HTMLElement): Promise<void> {
  //   // Mapa de colores Emily Designs
  //   const emilyColors: { [key: string]: string } = {
  //     'emily-white': 'rgb(254, 254, 250)',
  //     'emily-cream': 'rgb(245, 237, 227)',
  //     'emily-light': 'rgb(249, 245, 240)',
  //     'emily-rose': 'rgb(212, 165, 165)',
  //     'emily-gold': 'rgb(201, 169, 97)',
  //     'emily-sage': 'rgb(168, 181, 160)',
  //     'emily-taupe': 'rgb(139, 127, 118)',
  //     'emily-dark': 'rgb(62, 53, 47)',
  //   };

  //   // Obtener todos los elementos
  //   const allElements = [element, ...Array.from(element.querySelectorAll('*'))];

  //   allElements.forEach((el) => {
  //     const htmlEl = el as HTMLElement;

  //     // Revisar clases del elemento
  //     htmlEl.classList.forEach((className) => {
  //       // Si la clase contiene un color Emily
  //       Object.keys(emilyColors).forEach((colorName) => {
  //         if (className.includes(colorName)) {
  //           const rgbColor = emilyColors[colorName];

  //           // Aplicar según el tipo de clase
  //           if (className.startsWith('bg-')) {
  //             htmlEl.style.backgroundColor = rgbColor;
  //           } else if (className.startsWith('text-')) {
  //             htmlEl.style.color = rgbColor;
  //           } else if (className.startsWith('border-')) {
  //             htmlEl.style.borderColor = rgbColor;
  //           }
  //         }
  //       });
  //     });

  //     // También convertir estilos computados que usen oklch
  //     const computed = window.getComputedStyle(htmlEl);

  //     ['backgroundColor', 'color', 'borderColor'].forEach((prop) => {
  //       const value = computed.getPropertyValue(prop);

  //       if (value && value.includes('oklch')) {
  //         // Crear canvas temporal para convertir
  //         const canvas = document.createElement('canvas');
  //         const ctx = canvas.getContext('2d');

  //         if (ctx) {
  //           ctx.fillStyle = value;
  //           const rgbValue = ctx.fillStyle; // Navegador convierte a hex/rgb
  //           htmlEl.style.setProperty(prop, rgbValue, 'important');
  //         }
  //       }
  //     });
  //   });

  //   // Esperar a que se apliquen los estilos
  //   await new Promise((resolve) => setTimeout(resolve, 100));
  // }
  // private convertirOklchARgbRecursivo(element: HTMLElement): void {
  //   // Mapa de conversión oklch → rgb
  //   const colorMap: { [key: string]: string } = {
  //     // Emily Designs colors
  //     'oklch(0.98 0.01 85)': 'rgb(254, 254, 250)', // emily-white
  //     'oklch(0.93 0.02 75)': 'rgb(245, 237, 227)', // emily-cream
  //     'oklch(0.95 0.01 80)': 'rgb(249, 245, 240)', // emily-light
  //     'oklch(0.75 0.05 15)': 'rgb(212, 165, 165)', // emily-rose
  //     'oklch(0.72 0.08 75)': 'rgb(201, 169, 97)', // emily-gold
  //     'oklch(0.71 0.04 130)': 'rgb(168, 181, 160)', // emily-sage
  //     'oklch(0.58 0.02 45)': 'rgb(139, 127, 118)', // emily-taupe
  //     'oklch(0.32 0.02 35)': 'rgb(62, 53, 47)', // emily-dark
  //   };

  //   const allElements = element.querySelectorAll('*');

  //   allElements.forEach((el) => {
  //     const htmlEl = el as HTMLElement;
  //     const computed = window.getComputedStyle(htmlEl);

  //     // Propiedades de color a convertir
  //     const colorProps = [
  //       'backgroundColor',
  //       'color',
  //       'borderColor',
  //       'borderTopColor',
  //       'borderRightColor',
  //       'borderBottomColor',
  //       'borderLeftColor',
  //       'fill',
  //       'stroke',
  //     ];

  //     colorProps.forEach((prop) => {
  //       const value = computed.getPropertyValue(prop);

  //       if (value && value.includes('oklch')) {
  //         // Intentar mapeo directo
  //         const mappedColor = colorMap[value.trim()];

  //         if (mappedColor) {
  //           htmlEl.style.setProperty(prop, mappedColor, 'important');
  //         } else {
  //           // Fallback: extraer valores RGB del computed style
  //           // El navegador ya lo convirtió internamente
  //           const canvas = document.createElement('canvas');
  //           const ctx = canvas.getContext('2d');
  //           if (ctx) {
  //             ctx.fillStyle = value;
  //             const rgbColor = ctx.fillStyle;
  //             htmlEl.style.setProperty(prop, rgbColor, 'important');
  //           }
  //         }
  //       }
  //     });
  //   });
  // }

  ngOnDestroy(): void {
    this.ingresosChart?.destroy();
    this.distribucionChart?.destroy();
  }
}
