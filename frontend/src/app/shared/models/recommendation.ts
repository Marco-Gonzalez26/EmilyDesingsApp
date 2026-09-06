export interface Recommendation {
  producto_id: string;
  sku?: string;
  nombre: string;
  descripcion?: string;
  precio_regular: number;
  precio_descuento?: number;
  categoria?: string;
  imagen_principal?: string;
  score: number;
  algoritmo: string;
}
