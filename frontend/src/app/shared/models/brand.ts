export interface Brand {
  id: string;
  nombre: string;
  descripcion?: string;

  activo: boolean;
  fecha_creacion: string;
}

export interface BrandCreate {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface BrandUpdate {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
