export interface Color {
  id: string;
  nombre: string;
  codigo_hexadecimal?: string;
  activo: boolean;
  created_at: string;
}

export interface ColorCreate {
  nombre: string;
  codigo_hexadecimal?: string;
  activo?: boolean;
}

export interface ColorUpdate {
  nombre?: string;
  codigo_hexadecimal?: string;
  activo?: boolean;
}
