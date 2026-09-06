export interface Category {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface CategoryUpdate {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
