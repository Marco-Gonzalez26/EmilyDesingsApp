export interface Estilo {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  orden: number;
  creado_en: string;
  actualizado_en: string;
}
