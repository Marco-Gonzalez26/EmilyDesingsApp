import { Color } from 'chart.js';
import { Product } from './product';
import { Talla } from './size';
import { User } from './user';

export interface OrdenItem {
  id?: string;
  orden_id?: string;
  producto_id: string;
  nombre_producto: string;
  talla_id: string;
  color_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  origen?: string;
  producto?: Product;
  talla?: Talla;
  color?: Color;
}

export interface OrdenCreate {
  direccion_envio: string;
  subtotal: number;
  costo_envio: number;
  impuestos: number;
  total: number;
  metodo_pago: string;

  items: OrdenItem[];
}

export interface Orden {
  id: string;
  numero_orden: string;
  usuario_id: string;
  direccion_envio: string;
  subtotal: number;
  costo_envio: number;
  impuestos: number;
  total: number;
  estado: OrderEstado;
  metodo_pago?: string;
  stripe_payment_id?: string;
  motivo_cancelacion?: string;
  fecha_orden: string;
  fecha_actualizacion_estado?: string;
  created_at: string;
  updated_at: string;

  usuario?: User;
  items: OrdenItem[];
}

export type OrderEstado =
  | 'Pendiente'
  | 'Confirmado'
  | 'En Proceso'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado';

export interface OrderEstadoUpdate {
  estado: OrderEstado;
  motivo_cancelacion?: string;
}

export interface OrderFilters {
  skip?: number;
  limit?: number;
  estado?: OrderEstado;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

export interface OrdersResponse {
  ordenes: Orden[];
  total: number;
  skip: number;
  limit: number;
  filtros?: OrderFilters;
}

export interface OrderStats {
  total_ordenes: number;
  ordenes_por_estado: Record<string, number>;
  ventas_totales: number;
  ordenes_mes: number;
  ventas_mes: number;
}
export interface StripeCheckoutRequest {
  success_url: string;
  cancel_url: string;
}

export interface StripeCheckoutResponse {
  checkout_url: string;
  session_id: string;
}
