import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AnalisisPorTipo,
  AnalisisPorTipoCuerpo,
  ClientesNuevosVsRecurrentes,
  ConversionPorTipo,
  DashboardKPIs,
  EstadisticasRapidas,
  KPIClientes,
  KPIGeneral,
  KPIProductos,
  KPIVentas,
  MetricasAvanzadas,
  ProductoPorStock,
  ProductoRecomendado,
  TopComprador,
  TopProducto,
  VentaMesEspecifico,
  VentasPorCategoria,
  VentasPorMes,
} from '@app/shared/models/dashboard';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private api = inject(ApiService);

  /*
    Dashboard General
  */
  obtenerKPIsGenerales(): Observable<KPIGeneral> {
    return this.api.get<KPIGeneral>('/api/dashboard/general/kpis');
  }

  obtenerVentasPorMes(meses: number = 6): Observable<VentasPorMes> {
    return this.api.get<VentasPorMes>(`/api/dashboard/general/ventas-mes?meses=${meses}`);
  }

  obtenerVentasPorCategoria(): Observable<VentasPorCategoria> {
    return this.api.get<VentasPorCategoria>('/api/dashboard/general/categorias');
  }

  obtenerAnalisisPorTipo(): Observable<AnalisisPorTipo> {
    return this.api.get<AnalisisPorTipo>('/api/dashboard/general/tipos-cuerpo');
  }

  obtenerTopProductos(limit: number = 10): Observable<TopProducto[]> {
    return this.api.get<TopProducto[]>(`/api/dashboard/general/top-productos?limit=${limit}`);
  }

  obtenerEstadisticasRapidas(): Observable<EstadisticasRapidas> {
    return this.api.get<EstadisticasRapidas>('/api/dashboard/general/estadisticas-rapidas');
  }

  /*
    Dashboard Productos
  */
  obtenerKPIsProductos(): Observable<KPIProductos> {
    return this.api.get<KPIProductos>('/api/dashboard/productos/kpis');
  }

  obtenerIngresosPorCategoria(): Observable<VentasPorCategoria> {
    return this.api.get<VentasPorCategoria>('/api/dashboard/productos/ingresos-categoria');
  }

  obtenerDistribucionPorCategoria(): Observable<VentasPorCategoria> {
    return this.api.get<VentasPorCategoria>('/api/dashboard/productos/distribucion-categoria');
  }

  obtenerProductosPorNivelStock(nivel: string): Observable<ProductoPorStock[]> {
    return this.api.get<ProductoPorStock[]>(`/api/dashboard/productos/nivel-stock?nivel=${nivel}`);
  }

  /*
    Dashboard Cliente
  */

  obtenerKPIsClientes(): Observable<KPIClientes> {
    return this.api.get<KPIClientes>('/api/dashboard/clientes/kpis');
  }

  obtenerClientesNuevosVsRecurrentes(meses: number = 6): Observable<ClientesNuevosVsRecurrentes> {
    return this.api.get<ClientesNuevosVsRecurrentes>(
      `/api/dashboard/clientes/nuevos-vs-recurrentes?meses=${meses}`,
    );
  }

  obtenerClientesPorCiudad(): Observable<VentasPorCategoria> {
    return this.api.get<VentasPorCategoria>('/api/dashboard/clientes/por-ciudad');
  }

  obtenerTopCompradores(limit: number = 10): Observable<TopComprador[]> {
    return this.api.get<TopComprador[]>(`/api/dashboard/clientes/top-compradores?limit=${limit}`);
  }

  /*
    Dashboard Ventas
  */

  obtenerKPIsVentas(): Observable<KPIVentas> {
    return this.api.get<KPIVentas>('/api/dashboard/ventas/kpis');
  }

  obtenerMetricasAvanzadas(): Observable<MetricasAvanzadas> {
    return this.api.get<MetricasAvanzadas>('/api/dashboard/ventas/metricas-avanzadas');
  }

  obtenerVentasMesEspecifico(year: number, month: number): Observable<VentaMesEspecifico> {
    return this.api.get<VentaMesEspecifico>(
      `/api/dashboard/ventas/mes-especifico?year=${year}&month=${month}`,
    );
  }
  /*
    Dashboard Analisis IA
  */
  obtenerMetricasConversionAnalisis(): Observable<{
    total_analisis: number;
    items_carrito_analisis: number;
    items_vendidos_analisis: number;
    ordenes_con_analisis: number;
    analisis_con_compra: number;
    ingresos_analisis: number;
    tasa_analisis_a_carrito: number;
    tasa_analisis_a_compra: number;
    tasa_carrito_a_compra: number;
    ticket_promedio_analisis: number;
  }> {
    return this.api.get<any>('/api/dashboard/analisis/conversion-ordenes');
  }
  obtenerConversionPorTipo(): Observable<ConversionPorTipo> {
    return this.api.get<ConversionPorTipo>('/api/dashboard/analisis/conversion-por-tipo');
  }

  obtenerProductosMasRecomendados(limit: number = 10): Observable<ProductoRecomendado[]> {
    return this.api.get<ProductoRecomendado[]>(
      `/api/dashboard/recomendaciones/productos-mas-recomendados?limit=${limit}`,
    );
  }
}
