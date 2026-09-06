import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  getVentasPeriodo(fechaDesde: string, fechaHasta: string): Observable<any> {
    return this.api.get(
      `/api/reportes/ventas-periodo?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`,
    );
  }

  exportVentasPDF(fechaDesde: string, fechaHasta: string): Observable<Blob> {
    return this.api.get(
      `/api/reportes/ventas-periodo/pdf?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`,
      {
        responseType: 'blob',
      },
    );
  }
  getProductosVendidos(fechaDesde?: string, fechaHasta?: string, limit = 20): Observable<any> {
    let url = `/api/reportes/productos-vendidos?limit=${limit}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    return this.api.get(url);
  }

  exportProductosVendidosPDF(
    fechaDesde?: string,
    fechaHasta?: string,
    limit = 20,
  ): Observable<Blob> {
    let url = `/api/reportes/productos-vendidos/pdf?limit=${limit}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    return this.api.get(url, {
      responseType: 'blob',
    });
  }

  getStockBajo(umbral = 10): Observable<any> {
    return this.api.get(`/api/reportes/stock-bajo?umbral=${umbral}`);
  }

  exportStockBajoPDF(umbral = 10): Observable<Blob> {
    return this.api.get(`/api/reportes/stock-bajo/pdf?umbral=${umbral}`, {
      responseType: 'blob',
    });
  }

  getMejoresClientes(fechaDesde?: string, fechaHasta?: string, limit = 20): Observable<any> {
    let url = `/api/reportes/mejores-clientes?limit=${limit}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    return this.api.get(url);
  }

  exportMejoresClientesPDF(fechaDesde?: string, fechaHasta?: string, limit = 20): Observable<Blob> {
    let url = `/api/reportes/mejores-clientes/pdf?limit=${limit}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    return this.api.get(url, {
      responseType: 'blob',
    });
  }
}
