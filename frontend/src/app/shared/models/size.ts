export interface Talla {
  id: string;
  nombre: string;

  orden: number;
  activo: boolean;
  created_at: string;
}

export interface TallaCreate {
  nombre: string;

  orden?: number;
  activo?: boolean;
}

export interface TallaUpdate {
  nombre?: string;

  orden?: number;
  activo?: boolean;
}
