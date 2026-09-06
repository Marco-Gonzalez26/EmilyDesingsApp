export interface User {
  id: string;
  email: string;
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  rol: 'cliente' | 'administrador';
  activo: boolean;
  cedula_ruc?: string;
  ciudad?: string;
  fecha_registro: string;
  fecha_ultimo_acceso?: string;
}

export interface UpdateProfileData {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  cedula_ruc?: string;
}

export interface UserStatistics {
  total_ordenes: number;
  ordenes_completadas: number;
  total_gastado: number;
  total_analisis: number;
  ultima_orden?: {
    fecha: string;
    total: number;
  };
}

export interface ChangePasswordData {
  password_actual: string;
  password_nueva: string;
  password_confirmacion: string;
}

export interface UserListItem {
  id: string;
  email: string;
  nombre_completo?: string;
  telefono?: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  fecha_ultimo_acceso?: string;
  total_ordenes: number;
  total_gastado: number;
}

export interface UserDetail {
  id: string;
  email: string;
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  cedula_ruc?: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  fecha_ultimo_acceso?: string;
  estadisticas: {
    total_ordenes: number;
    ordenes_completadas: number;
    total_gastado: number;
    total_analisis: number;
    ticket_promedio: number;
    ultima_orden?: {
      fecha: string;
      total: number;
    };
  };
}

export interface UserFilters {
  skip?: number;
  limit?: number;
  activo?: boolean;
  search?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}
