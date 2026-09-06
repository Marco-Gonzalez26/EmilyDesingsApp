export interface ProductImage {
  id: string;
  url_imagen: string;
  es_principal: boolean;
  orden?: number;
}

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  descripcion?: string;
  precio_regular: number;
  precio_descuento?: number;
  categoria_id?: string;
  marca_id?: string;
  es_nuevo: boolean;
  es_oferta: boolean;
  es_destacado: boolean;
  activo: boolean;
  fecha_creacion: string;
  created_at: string;
  updated_at: string;
  imagenes: ProductImage[];
  tiene_stock?: boolean;
  administrador_id?: string;
}

export interface ProductListResponse {
  total: number;
  page: number;
  page_size: number;
  productos: Product[];
}

export interface ProductFilters {
  skip?: number;
  limit?: number;
  categoria_id?: string;
  marca_id?: string;
  precio_min?: number;
  precio_max?: number;
  es_nuevo?: boolean;
  es_oferta?: boolean;
  es_destacado?: boolean;
  activo?: boolean;
  search?: string;
  sort?: string;
}

export interface ProductCreate {
  sku: string;
  nombre: string;
  descripcion?: string;
  precio_regular: number;
  precio_descuento?: number;
  categoria_id?: string;
  marca_id?: string;
  es_nuevo?: boolean;
  es_oferta?: boolean;
  es_destacado?: boolean;
}

export interface ProductUpdate {
  sku?: string;
  nombre?: string;
  descripcion?: string;
  precio_regular?: number;
  precio_descuento?: number;
  categoria_id?: string;
  marca_id?: string;
  activo?: boolean;
  es_nuevo?: boolean;
  es_oferta?: boolean;
  es_destacado?: boolean;
}
