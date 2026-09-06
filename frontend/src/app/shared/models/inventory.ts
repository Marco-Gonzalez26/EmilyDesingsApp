import { Color } from './color';
import { Product } from './product';
import { Talla } from './size';

export interface Inventario {
  id: string;
  producto_id: string;
  talla_id: string;
  color_id: string;
  stock: number;
  stock_reservado: number;
  talla?: Talla;
  color?: Color;
  producto?: Product;
}

export interface InventoryWithDetails extends Inventario {
  stock_disponible: number;
}

export interface InventoryCreate {
  producto_id: string;
  talla_id: string;
  color_id: string;
  stock: number;
  stock_reservado?: number;
}

export interface InventoryUpdate {
  stock?: number;
  stock_reservado?: number;
}

export interface InventoryAjuste {
  ajuste: number;
  razon?: string;
}

export interface InventoryFilters {
  skip?: number;
  limit?: number;
  producto_id?: string;
  talla_id?: string;
  color_id?: string;
  stock_bajo?: number;
}

export interface StockBajoItem {
  inventario_id: string;
  producto: {
    id: string;
    nombre: string;
    sku: string;
  };
  talla: string | null;
  color: string | null;
  stock_disponible: number;
  stock_reservado: number;
}

export interface InventoryListResponse {
  inventarios: InventoryWithDetails[];
  total: number;
  skip: number;
  limit: number;
}

export interface StockBajoResponse {
  productos: StockBajoItem[];
  umbral: number;
}
