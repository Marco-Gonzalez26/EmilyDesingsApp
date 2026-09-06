export interface DashboardKPIs {
  ventas_totales: number;
  ventas_cambio: number;
  ordenes_totales: number;
  ordenes_cambio: number;
  clientes_nuevos: number;
  clientes_cambio: number;
  analisis_realizados: number;
  analisis_cambio: number;
}

export interface VentasPorMes {
  labels: string[];
  valores: number[];
}

export interface VentasPorCategoria {
  labels: string[];
  valores: number[];
}

export interface AnalisisPorTipoCuerpo {
  labels: string[];
  valores: number[];
}

export interface TopProducto {
  nombre: string;
  categoria: string;
  unidades_vendidas: number;
  ingresos: number;
}

export interface EstadisticasRapidas {
  conversion_analisis: number;
  ticket_promedio_con_ia: number;
  ticket_promedio_sin_ia: number;
  productos_stock_bajo: number;
  productos_activos: number;
  unidades_totales_stock: number;
}
export interface KPIGeneral {
  ventas_totales: { valor: number; cambio: number };
  ordenes: { valor: number; cambio: number };
  clientes_nuevos: { valor: number; cambio: number };
  analisis_realizados: { valor: number; cambio: number };
}

export interface VentasPorMes {
  labels: string[];
  valores: number[];
}

export interface VentasPorCategoria {
  labels: string[];
  valores: number[];
}

export interface AnalisisPorTipo {
  labels: string[];
  valores: number[];
}

export interface TopProducto {
  nombre: string;
  categoria: string;
  unidades_vendidas: number;
  ingresos: number;
}

export interface EstadisticasRapidas {
  conversion_analisis: number;
  productos_stock_bajo: number;
  productos_activos: number;
  unidades_totales_stock: number;
  ticket_promedio_con_ia: number;
  ticket_promedio_sin_ia: number;
}

export interface KPIProductos {
  productos_activos: number;
  unidades_en_stock: number;
}

export interface ProductoPorStock {
  nombre: string;
  categoria: string;
  stock: number;
}

export interface KPIClientes {
  total_clientes: number;
  compradores: number;
  nuevos_del_mes: number;
}

export interface ClientesNuevosVsRecurrentes {
  labels: string[];
  nuevos: number[];
  recurrentes: number[];
}

export interface TopComprador {
  nombre_completo: string;
  num_compras: number;
  total_gastado: number;
}

export interface KPIVentas {
  valor_promedio_pedido: number;
  total_ordenes: number;
  total_ventas: number;
  conversion_registro_compra: number;
}

export interface VentaMesEspecifico {
  mes: string;
  total: number;
  ordenes: number;
}

export interface MetricasAvanzadas {
  tasa_retorno: number;
  crecimiento_mensual_ingresos: number;
  valor_vida_cliente: number;
  crecimiento_valor_vida_cliente: number;
}

export interface ConversionPorTipo {
  labels: string[];
  valores: number[];
}

export interface ProductoRecomendado {
  nombre: string;
  categoria: string;
  veces_recomendado: number;
  veces_agregado: number;
  tasa_conversion: number;
}
