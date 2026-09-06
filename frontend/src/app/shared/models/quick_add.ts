export interface QuickAddData {
  producto_id: string;
  nombre: string;
  imagen: string;
  precio: string;
  precio_descuento?: string;
  tallas_disponibles: TallaDisponible[];
  colores_disponibles: ColorDisponible[];
}

export interface TallaDisponible {
  id: string;
  nombre: string;
  stock: number;
}

export interface ColorDisponible {
  id: string;
  nombre: string;
  codigo_hex?: string;
}

export interface QuickAddResult {
  producto_id: string;
  talla_id: string;
  color_id: string;
  cantidad: number;
}
