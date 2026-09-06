import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Orden,
  OrdenCreate,
  OrderEstadoUpdate,
  OrderFilters,
  OrdersResponse,
  OrderStats,
  StripeCheckoutRequest,
  StripeCheckoutResponse,
} from '../../shared/models/order';

@Injectable({
  providedIn: 'root',
})
export class OrdenService {
  constructor(private api: ApiService) {}

  crearOrden(data: OrdenCreate): Observable<Orden> {
    console.log('ORDEN CREATE', { data });
    
    return this.api.post<Orden>('/api/ordenes/', data);
  }

  crearCheckoutSession(
    ordenId: string,
    data: StripeCheckoutRequest,
  ): Observable<StripeCheckoutResponse> {
    return this.api.post<StripeCheckoutResponse>(`/api/ordenes/${ordenId}/checkout`, data);
  }

  confirmarPago(sessionId: string): Observable<Orden> {
    return this.api.post<Orden>(`/api/ordenes/confirmar-pago/${sessionId}`, {});
  }

  getMisOrdenes(skip: number = 0, limit: number = 10): Observable<Orden[]> {
    return this.api.get<Orden[]>(`/api/ordenes/mias?skip=${skip}&limit=${limit}`);
  }

  getOrdenById(ordenId: string): Observable<Orden> {
    return this.api.get<Orden>(`/api/ordenes/${ordenId}`);
  }

  descargarPDF(ordenId: string): Observable<Blob> {
    return this.api.get(`/api/ordenes/${ordenId}/pdf`, {
      responseType: 'blob',
    });
  }

  getAllOrders(filters?: OrderFilters): Observable<OrdersResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/api/ordenes/admin/all?${queryString}` : '/api/ordenes/admin/all';

    return this.api.get<OrdersResponse>(url);
  }

  getOrderById(id: string): Observable<Orden> {
    return this.api.get<Orden>(`/api/ordenes/admin/${id}`);
  }

  updateOrderStatus(id: string, data: OrderEstadoUpdate): Observable<Orden> {
    return this.api.put<Orden>(`/api/ordenes/admin/${id}/estado`, data);
  }

  getStats(): Observable<OrderStats> {
    return this.api.get<OrderStats>('/api/ordenes/admin/estadisticas/general');
  }
}
