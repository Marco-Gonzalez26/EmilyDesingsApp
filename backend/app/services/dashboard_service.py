from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, Integer
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from decimal import Decimal

from app.models.models import (
    Usuario,
    Orden,
    OrdenItem,
    Producto,
    Categoria,
    Inventario,
    Marca,
    CarritoItem,
    RecomendacionIA,
    InteraccionUsuario,
)


def calcular_rango_fechas(meses: int = 1) -> Dict[str, datetime]:
    """Calcula rango de fechas para comparaciones"""
    hoy = datetime.now()
    inicio_mes_actual = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    inicio_mes_anterior = (inicio_mes_actual - timedelta(days=1)).replace(day=1)

    return {
        "hoy": hoy,
        "inicio_mes_actual": inicio_mes_actual,
        "inicio_mes_anterior": inicio_mes_anterior,
        "fin_mes_anterior": inicio_mes_actual - timedelta(seconds=1),
    }


def calcular_cambio_porcentual(valor_actual: float, valor_anterior: float) -> float:
    """Calcula cambio porcentual entre dos valores"""
    if valor_anterior == 0:
        return 0 if valor_actual == 0 else 100
    return round(((valor_actual - valor_anterior) / valor_anterior) * 100, 1)


def formatear_mes(fecha: datetime) -> str:
    """Formatea fecha a formato 'Ene 2025'"""
    meses_es = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
    ]
    return f"{meses_es[fecha.month - 1]} {fecha.year}"


# Dashboard General


def obtener_kpis_generales(db: Session) -> Dict[str, Any]:
    """
    KPIs principales para tab General

    Returns:
        {
            "ventas_totales": {"valor": 55800.50, "cambio": 12.5},
            "ordenes": {"valor": 150, "cambio": 8.2},
            "clientes_nuevos": {"valor": 20, "cambio": -2.4},
            "analisis_realizados": {"valor": 45, "cambio": 15.3}
        }
    """
    fechas = calcular_rango_fechas()

    # Ventas totales (usando Orden.total en lugar de Venta.total)
    ventas_actual = (
        db.query(func.sum(Orden.total))
        .filter(Orden.fecha_orden >= fechas["inicio_mes_actual"])
        .scalar()
        or 0
    )

    ventas_anterior = (
        db.query(func.sum(Orden.total))
        .filter(
            Orden.fecha_orden >= fechas["inicio_mes_anterior"],
            Orden.fecha_orden < fechas["inicio_mes_actual"],
        )
        .scalar()
        or 0
    )

    # Órdenes
    ordenes_actual = (
        db.query(func.count(Orden.id))
        .filter(Orden.fecha_orden >= fechas["inicio_mes_actual"])
        .scalar()
        or 0
    )

    ordenes_anterior = (
        db.query(func.count(Orden.id))
        .filter(
            Orden.fecha_orden >= fechas["inicio_mes_anterior"],
            Orden.fecha_orden < fechas["inicio_mes_actual"],
        )
        .scalar()
        or 0
    )

    # Clientes nuevos
    clientes_actual = (
        db.query(func.count(Usuario.id))
        .filter(
            Usuario.fecha_registro >= fechas["inicio_mes_actual"],
            Usuario.rol == "cliente",
        )
        .scalar()
        or 0
    )

    clientes_anterior = (
        db.query(func.count(Usuario.id))
        .filter(
            Usuario.fecha_registro >= fechas["inicio_mes_anterior"],
            Usuario.fecha_registro < fechas["inicio_mes_actual"],
            Usuario.rol == "cliente",
        )
        .scalar()
        or 0
    )

    return {
        "ventas_totales": {
            "valor": float(ventas_actual),
            "cambio": calcular_cambio_porcentual(
                float(ventas_actual), float(ventas_anterior)
            ),
        },
        "ordenes": {
            "valor": ordenes_actual,
            "cambio": calcular_cambio_porcentual(ordenes_actual, ordenes_anterior),
        },
        "clientes_nuevos": {
            "valor": clientes_actual,
            "cambio": calcular_cambio_porcentual(clientes_actual, clientes_anterior),
        },
    }


def obtener_ventas_por_mes(db: Session, meses: int = 6) -> Dict[str, List]:
    """Ventas agrupadas por mes para gráfico de barras"""
    resultados = []
    hoy = datetime.now()

    for i in range(meses - 1, -1, -1):
        mes_fecha = hoy - timedelta(days=30 * i)
        inicio_mes = mes_fecha.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        if mes_fecha.month == 12:
            fin_mes = mes_fecha.replace(year=mes_fecha.year + 1, month=1, day=1)
        else:
            fin_mes = mes_fecha.replace(month=mes_fecha.month + 1, day=1)

        total = (
            db.query(func.sum(Orden.total))
            .filter(Orden.fecha_orden >= inicio_mes, Orden.fecha_orden < fin_mes)
            .scalar()
            or 0
        )

        resultados.append({"label": formatear_mes(mes_fecha), "valor": float(total)})

    return {
        "labels": [r["label"] for r in resultados],
        "valores": [r["valor"] for r in resultados],
    }


def obtener_ventas_por_categoria(db: Session) -> Dict[str, List]:
    """Top 5 categorías por ingresos"""
    resultados = (
        db.query(
            Categoria.nombre,
            func.sum(OrdenItem.precio_unitario * OrdenItem.cantidad).label("total"),
        )
        .join(Producto, Producto.categoria_id == Categoria.id)
        .join(OrdenItem, OrdenItem.producto_id == Producto.id)
        .group_by(Categoria.id, Categoria.nombre)
        .order_by(func.sum(OrdenItem.precio_unitario * OrdenItem.cantidad).desc())
        .limit(5)
        .all()
    )

    return {
        "labels": [r[0] for r in resultados],
        "valores": [float(r[1]) for r in resultados],
    }


def obtener_top_productos(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Top N productos más vendidos"""
    resultados = (
        db.query(
            Producto.nombre,
            Categoria.nombre.label("categoria"),
            func.sum(OrdenItem.cantidad).label("unidades"),
            func.sum(OrdenItem.precio_unitario * OrdenItem.cantidad).label("ingresos"),
        )
        .join(OrdenItem, OrdenItem.producto_id == Producto.id)
        .outerjoin(Categoria, Categoria.id == Producto.categoria_id)
        .group_by(Producto.id, Producto.nombre, Categoria.nombre)
        .order_by(func.sum(OrdenItem.cantidad).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "nombre": r[0],
            "categoria": r[1] or "Sin categoría",
            "unidades_vendidas": r[2],
            "ingresos": float(r[3]),
        }
        for r in resultados
    ]


def obtener_estadisticas_rapidas(db: Session) -> Dict[str, Any]:
    """Estadísticas rápidas para sidebar"""
    # Productos con stock bajo
    productos_stock_bajo = (
        db.query(func.count(func.distinct(Inventario.producto_id)))
        .filter(Inventario.stock < 10)
        .scalar()
        or 0
    )

    # Productos activos
    productos_activos = (
        db.query(func.count(Producto.id)).filter(Producto.activo == True).scalar() or 0
    )

    # Total stock
    total_stock = db.query(func.sum(Inventario.stock)).scalar() or 0

    return {
        "productos_stock_bajo": productos_stock_bajo,
        "productos_activos": productos_activos,
        "unidades_totales_stock": total_stock,
    }


# Tab 2: Productos


def obtener_kpis_productos(db: Session) -> Dict[str, Any]:
    """KPIs para tab Productos"""
    productos_activos = (
        db.query(func.count(Producto.id)).filter(Producto.activo == True).scalar() or 0
    )

    unidades_stock = db.query(func.sum(Inventario.stock)).scalar() or 0

    return {"productos_activos": productos_activos, "unidades_en_stock": unidades_stock}


def obtener_ingresos_por_categoria(db: Session) -> Dict[str, List]:
    """Ingresos por categoría (gráfico horizontal)"""
    resultados = (
        db.query(
            Categoria.nombre,
            func.sum(OrdenItem.precio_unitario * OrdenItem.cantidad).label("ingresos"),
        )
        .join(Producto, Producto.categoria_id == Categoria.id)
        .join(OrdenItem, OrdenItem.producto_id == Producto.id)
        .group_by(Categoria.id, Categoria.nombre)
        .order_by(func.sum(OrdenItem.precio_unitario * OrdenItem.cantidad).desc())
        .all()
    )

    return {
        "labels": [r[0] for r in resultados],
        "valores": [float(r[1]) for r in resultados],
    }


def obtener_productos_por_categoria(db: Session) -> Dict[str, List]:
    """Cantidad de productos por categoría (pie chart)"""
    resultados = (
        db.query(Categoria.nombre, func.count(Producto.id).label("cantidad"))
        .join(Producto, Producto.categoria_id == Categoria.id)
        .filter(Producto.activo == True)
        .group_by(Categoria.id, Categoria.nombre)
        .order_by(func.count(Producto.id).desc())
        .all()
    )

    return {"labels": [r[0] for r in resultados], "valores": [r[1] for r in resultados]}


def obtener_productos_por_nivel_stock(
    db: Session, nivel: str = None
) -> List[Dict[str, Any]]:
    """
    Filtra productos por nivel de stock
    - bajo: < 10
    - medio: 10-50
    - alto: 51-100
    - optimo: > 100
    """
    query = (
        db.query(
            Producto.nombre,
            Categoria.nombre.label("categoria"),
            func.sum(Inventario.stock).label("stock_total"),
        )
        .join(Inventario, Inventario.producto_id == Producto.id)
        .outerjoin(Categoria, Categoria.id == Producto.categoria_id)
        .group_by(Producto.id, Producto.nombre, Categoria.nombre)
    )

    if nivel == "bajo":
        query = query.having(func.sum(Inventario.stock) < 10)
    elif nivel == "medio":
        query = query.having(
            and_(func.sum(Inventario.stock) >= 10, func.sum(Inventario.stock) <= 50)
        )
    elif nivel == "alto":
        query = query.having(
            and_(func.sum(Inventario.stock) > 50, func.sum(Inventario.stock) <= 100)
        )
    elif nivel == "optimo":
        query = query.having(func.sum(Inventario.stock) > 100)

    resultados = query.all()

    return [
        {"nombre": r[0], "categoria": r[1] or "Sin categoría", "stock": r[2]}
        for r in resultados
    ]


# Tab 3: Clientes


def obtener_kpis_clientes(db: Session) -> Dict[str, Any]:
    """KPIs para tab Clientes"""
    total_clientes = (
        db.query(func.count(Usuario.id)).filter(Usuario.rol == "cliente").scalar() or 0
    )

    compradores = db.query(func.count(func.distinct(Orden.usuario_id))).scalar() or 0

    fechas = calcular_rango_fechas()
    nuevos_mes = (
        db.query(func.count(Usuario.id))
        .filter(
            Usuario.rol == "cliente",
            Usuario.fecha_registro >= fechas["inicio_mes_actual"],
        )
        .scalar()
        or 0
    )

    return {
        "total_clientes": total_clientes,
        "compradores": compradores,
        "nuevos_del_mes": nuevos_mes,
    }


def obtener_clientes_nuevos_vs_recurrentes(
    db: Session, meses: int = 6
) -> Dict[str, Any]:
    """Stacked bar: Clientes nuevos vs recurrentes por mes"""
    resultados = []
    hoy = datetime.now()

    for i in range(meses - 1, -1, -1):
        mes_fecha = hoy - timedelta(days=30 * i)
        inicio_mes = mes_fecha.replace(day=1, hour=0, minute=0, second=0)

        if mes_fecha.month == 12:
            fin_mes = mes_fecha.replace(year=mes_fecha.year + 1, month=1, day=1)
        else:
            fin_mes = mes_fecha.replace(month=mes_fecha.month + 1, day=1)

        # Nuevos: primera compra en este mes
        nuevos = (
            db.query(func.count(func.distinct(Orden.usuario_id)))
            .filter(
                Orden.fecha_orden >= inicio_mes,
                Orden.fecha_orden < fin_mes,
                Orden.usuario_id.in_(
                    db.query(Orden.usuario_id)
                    .group_by(Orden.usuario_id)
                    .having(func.min(Orden.fecha_orden) >= inicio_mes)
                    .having(func.min(Orden.fecha_orden) < fin_mes)
                ),
            )
            .scalar()
            or 0
        )

        total_mes = (
            db.query(func.count(func.distinct(Orden.usuario_id)))
            .filter(Orden.fecha_orden >= inicio_mes, Orden.fecha_orden < fin_mes)
            .scalar()
            or 0
        )

        recurrentes = total_mes - nuevos

        resultados.append(
            {
                "label": formatear_mes(mes_fecha),
                "nuevos": nuevos,
                "recurrentes": recurrentes,
            }
        )

    return {
        "labels": [r["label"] for r in resultados],
        "nuevos": [r["nuevos"] for r in resultados],
        "recurrentes": [r["recurrentes"] for r in resultados],
    }


def obtener_clientes_por_ciudad(db: Session) -> Dict[str, List]:
    from sqlalchemy import func

    resultados = (
        db.query(Usuario.ciudad, func.count(Usuario.id).label("total"))
        .filter(
            Usuario.activo == True, Usuario.rol == "cliente", Usuario.ciudad != None
        )
        .group_by(Usuario.ciudad)
        .order_by(func.count(Usuario.id).desc())
        .all()
    )

    return {
        "labels": [r.ciudad for r in resultados],
        "valores": [r.total for r in resultados],
    }


def obtener_top_compradores(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Top N clientes que más compran"""
    resultados = (
        db.query(
            Usuario.nombre_completo,
            func.count(Orden.id).label("num_compras"),
            func.sum(Orden.total).label("total_gastado"),
        )
        .join(Orden, Orden.usuario_id == Usuario.id)
        .group_by(Usuario.id, Usuario.nombre_completo)
        .order_by(func.count(Orden.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {"nombre_completo": r[0], "num_compras": r[1], "total_gastado": float(r[2])}
        for r in resultados
    ]


# Tab 4: Ventas


def obtener_kpis_ventas(db: Session) -> Dict[str, Any]:
    """KPIs para tab Ventas"""
    fechas = calcular_rango_fechas()

    # Valor promedio del pedido
    avg_pedido = (
        db.query(func.avg(Orden.total))
        .filter(Orden.fecha_orden >= fechas["inicio_mes_actual"])
        .scalar()
        or 0
    )

    # Total órdenes
    total_ordenes = (
        db.query(func.count(Orden.id))
        .filter(Orden.fecha_orden >= fechas["inicio_mes_actual"])
        .scalar()
        or 0
    )

    # Total ventas
    total_ventas = (
        db.query(func.sum(Orden.total))
        .filter(Orden.fecha_orden >= fechas["inicio_mes_actual"])
        .scalar()
        or 0
    )

    # Conversión registro → compra
    total_usuarios = (
        db.query(func.count(Usuario.id))
        .filter(
            Usuario.rol == "cliente",
            Usuario.fecha_registro >= fechas["inicio_mes_actual"],
        )
        .scalar()
        or 1
    )

    usuarios_compraron = (
        db.query(func.count(func.distinct(Orden.usuario_id)))
        .filter(Orden.fecha_orden >= fechas["inicio_mes_actual"])
        .scalar()
        or 0
    )

    conversion = (
        (usuarios_compraron / total_usuarios * 100) if total_usuarios > 0 else 0
    )

    return {
        "valor_promedio_pedido": float(avg_pedido),
        "total_ordenes": total_ordenes,
        "total_ventas": float(total_ventas),
        "conversion_registro_compra": round(conversion, 2),
    }


def obtener_metricas_avanzadas(db: Session) -> Dict[str, Any]:
    """
    Métricas avanzadas de ventas

    - Tasa de retorno (%): Clientes recurrentes / Total clientes compradores
    - Crecimiento mensual ingresos (%): Cambio mes actual vs anterior
    - CLV (Customer Lifetime Value): Promedio gastado por cliente
    """
    fechas = calcular_rango_fechas()

    # Clientes que compraron más de una vez
    clientes_recurrentes = (
        db.query(func.count(func.distinct(Orden.usuario_id)))
        .filter(
            Orden.usuario_id.in_(
                db.query(Orden.usuario_id)
                .group_by(Orden.usuario_id)
                .having(func.count(Orden.id) > 1)
            )
        )
        .scalar()
        or 0
    )

    total_clientes_compraron = (
        db.query(func.count(func.distinct(Orden.usuario_id))).scalar() or 1
    )

    tasa_retorno = (
        (clientes_recurrentes / total_clientes_compraron * 100)
        if total_clientes_compraron > 0
        else 0
    )

    # Ingresos mes actual
    ingresos_mes_actual = (
        db.query(func.sum(Orden.total))
        .filter(Orden.fecha_orden >= fechas["inicio_mes_actual"])
        .scalar()
        or 0
    )

    # Ingresos mes anterior
    ingresos_mes_anterior = (
        db.query(func.sum(Orden.total))
        .filter(
            Orden.fecha_orden >= fechas["inicio_mes_anterior"],
            Orden.fecha_orden < fechas["inicio_mes_actual"],
        )
        .scalar()
        or 1
    )  # Evitar división por cero

    crecimiento_mensual = calcular_cambio_porcentual(
        float(ingresos_mes_actual), float(ingresos_mes_anterior)
    )

    # Promedio del total gastado por cada cliente
    # Subconsulta para obtener total por cliente
    subq = (
        db.query(Orden.usuario_id, func.sum(Orden.total).label("total_cliente"))
        .group_by(Orden.usuario_id)
        .subquery()
    )

    resultado_clv = db.query(func.avg(subq.c.total_cliente)).scalar() or 0

    # Cambio CLV (comparar últimos 3 meses vs 3 meses anteriores)
    tres_meses_atras = fechas["inicio_mes_actual"] - timedelta(days=90)
    seis_meses_atras = tres_meses_atras - timedelta(days=90)

    # CLV últimos 3 meses
    subq_reciente = (
        db.query(Orden.usuario_id, func.sum(Orden.total).label("total_cliente"))
        .filter(Orden.fecha_orden >= tres_meses_atras)
        .group_by(Orden.usuario_id)
        .subquery()
    )

    clv_reciente = db.query(func.avg(subq_reciente.c.total_cliente)).scalar() or 0

    # CLV 3-6 meses atrás
    subq_anterior = (
        db.query(Orden.usuario_id, func.sum(Orden.total).label("total_cliente"))
        .filter(
            Orden.fecha_orden >= seis_meses_atras, Orden.fecha_orden < tres_meses_atras
        )
        .group_by(Orden.usuario_id)
        .subquery()
    )

    clv_anterior = db.query(func.avg(subq_anterior.c.total_cliente)).scalar() or 1

    crecimiento_clv = calcular_cambio_porcentual(
        float(clv_reciente), float(clv_anterior)
    )

    return {
        "tasa_retorno": round(tasa_retorno, 2),
        "crecimiento_mensual_ingresos": crecimiento_mensual,
        "valor_vida_cliente": round(float(resultado_clv), 2),
        "crecimiento_valor_vida_cliente": crecimiento_clv,
    }


def obtener_ventas_mes_especifico(db: Session, year: int, month: int) -> Dict[str, Any]:
    """
    Obtiene ventas de un mes específico

    Args:
        year: Año (ej: 2024)
        month: Mes (1-12)

    Returns:
        {
            "mes": "Ene 2026",
            "total": 15000.50,
            "ordenes": 45
        }
    """
    inicio = datetime(year, month, 1, 0, 0, 0)

    if month == 12:
        fin = datetime(year + 1, 1, 1, 0, 0, 0)
    else:
        fin = datetime(year, month + 1, 1, 0, 0, 0)

    total = (
        db.query(func.sum(Orden.total))
        .filter(Orden.fecha_orden >= inicio, Orden.fecha_orden < fin)
        .scalar()
        or 0
    )

    # Obtener número de órdenes del mes
    ordenes = (
        db.query(func.count(Orden.id))
        .filter(Orden.fecha_orden >= inicio, Orden.fecha_orden < fin)
        .scalar()
        or 0
    )

    return {"mes": formatear_mes(inicio), "total": float(total), "ordenes": ordenes}


def obtener_productos_mas_recomendados(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Top N productos más recomendados por el motor de IA.

    Agrega el historial de recomendaciones (recomendaciones_ia) por producto
    y lo cruza con interacciones de carrito/compra para estimar conversión.

    Returns:
        [
            {
                "nombre": str,
                "categoria": str,
                "veces_recomendado": int,
                "veces_agregado": int,
                "tasa_conversion": float,
            }
        ]
    """
    resultados = (
        db.query(
            Producto.nombre,
            Categoria.nombre.label("categoria"),
            func.count(func.distinct(RecomendacionIA.id)).label("veces_recomendado"),
            func.count(func.distinct(InteraccionUsuario.id)).label("veces_agregado"),
            func.avg(RecomendacionIA.score).label("score_promedio"),
        )
        .join(RecomendacionIA, RecomendacionIA.producto_id == Producto.id)
        .outerjoin(Categoria, Categoria.id == Producto.categoria_id)
        .outerjoin(
            InteraccionUsuario,
            and_(
                InteraccionUsuario.producto_id == Producto.id,
                InteraccionUsuario.tipo_interaccion.in_(
                    ["agregar_carrito", "compra"]
                ),
            ),
        )
        .group_by(Producto.id, Producto.nombre, Categoria.nombre)
        .order_by(func.count(func.distinct(RecomendacionIA.id)).desc())
        .limit(limit)
        .all()
    )

    productos = []
    for nombre, categoria, veces_recomendado, veces_agregado, score_promedio in resultados:
        veces_recomendado = int(veces_recomendado or 0)
        veces_agregado = int(veces_agregado or 0)
        tasa_conversion = (
            round((veces_agregado / veces_recomendado) * 100, 1)
            if veces_recomendado > 0
            else 0
        )
        productos.append(
            {
                "nombre": nombre,
                "categoria": categoria or "Sin categoría",
                "veces_recomendado": veces_recomendado,
                "veces_agregado": veces_agregado,
                "tasa_conversion": tasa_conversion,
                "score_promedio": round(float(score_promedio), 4)
                if score_promedio is not None
                else 0,
            }
        )

    return productos
