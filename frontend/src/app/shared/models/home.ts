import { Product } from './product';
import { Recommendation } from './recommendation';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Marca {
  id: string;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  activo: boolean;
}

export interface HomeData {
  destacados: Product[];
  nuevos: Product[];
  ofertas: Product[];
  categorias: Categoria[];
  marcas: Marca[];
  recomendaciones: Recommendation[];
}
