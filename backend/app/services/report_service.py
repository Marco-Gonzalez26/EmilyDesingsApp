
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from decimal import Decimal

from app.models.models import Orden, OrdenItem, Producto, Usuario, Inventario, Categoria


def get_ventas_por_periodo(
    db: Session, fecha_desde: datetime, fecha_hasta: datetime
) -> Dict:
    """
    Obtener reporte de ventas por período
    """

    ordenes = (
        db.query(Orden)
        .filter(
            Orden.fecha_orden >= fecha_desde,
            Orden.fecha_orden <= fecha_hasta,
            Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]),
        )
        .all()
    )

    total_ventas = sum(float(orden.total) for orden in ordenes)
    total_ordenes = len(ordenes)
    ticket_promedio = total_ventas / total_ordenes if total_ordenes > 0 else 0

    ventas_por_dia = (
        db.query(
            func.date(Orden.fecha_orden).label("fecha"),
            func.count(Orden.id).label("cantidad"),
            func.sum(Orden.total).label("total"),
        )
        .filter(
            Orden.fecha_orden >= fecha_desde,
            Orden.fecha_orden <= fecha_hasta,
            Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]),
        )
        .group_by(func.date(Orden.fecha_orden))
        .order_by(func.date(Orden.fecha_orden))
        .all()
    )

    return {
        "total_ventas": total_ventas,
        "total_ordenes": total_ordenes,
        "ticket_promedio": ticket_promedio,
        "ventas_por_dia": [
            {"fecha": str(v.fecha), "cantidad": v.cantidad, "total": float(v.total)}
            for v in ventas_por_dia
        ],
        "ordenes": [
            {
                "numero_orden": o.numero_orden,
                "fecha": o.fecha_orden.strftime("%Y-%m-%d %H:%M"),
                "cliente": (
                    o.usuario.nombre_completo or o.usuario.email if o.usuario else "N/A"
                ),
                "total": float(o.total),
                "estado": o.estado,
            }
            for o in ordenes
        ],
    }


def get_productos_mas_vendidos(
    db: Session,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    limit: int = 20,
) -> List[Dict]:
    """
    Obtener productos más vendidos
    """

    query = (
        db.query(
            Producto.nombre,
            Categoria.nombre.label("categoria"),
            func.sum(OrdenItem.cantidad).label("cantidad_vendida"),
            func.sum(OrdenItem.subtotal).label("ingresos"),
        )
        .join(OrdenItem, OrdenItem.producto_id == Producto.id)
        .join(Orden, Orden.id == OrdenItem.orden_id)
        .outerjoin(Categoria, Categoria.id == Producto.categoria_id)
        .filter(Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]))
    )

    if fecha_desde:
        query = query.filter(Orden.fecha_orden >= fecha_desde)

    if fecha_hasta:
        query = query.filter(Orden.fecha_orden <= fecha_hasta)

    resultados = (
        query.group_by(Producto.id, Producto.nombre, Categoria.nombre)
        .order_by(func.sum(OrdenItem.cantidad).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "producto": r.nombre,
            "categoria": r.categoria or "Sin categoría",
            "cantidad_vendida": r.cantidad_vendida,
            "ingresos": float(r.ingresos),
        }
        for r in resultados
    ]


def get_stock_bajo(db: Session, umbral: int = 10) -> List[Dict]:
    """
    Obtener productos con stock bajo
    """

    inventarios = (
        db.query(
            Producto.nombre,
            Categoria.nombre.label("categoria"),
            Inventario.talla_id,
            Inventario.color_id,
            Inventario.stock,
            Inventario.stock_reservado,
        )
        .join(Inventario, Inventario.producto_id == Producto.id)
        .outerjoin(Categoria, Categoria.id == Producto.categoria_id)
        .filter(
            Producto.activo == True,
            Inventario.stock - Inventario.stock_reservado <= umbral,
        )
        .order_by((Inventario.stock - Inventario.stock_reservado).asc())
        .all()
    )

    return [
        {
            "producto": inv.nombre,
            "categoria": inv.categoria or "Sin categoría",
            "stock_disponible": inv.stock - inv.stock_reservado,
            "stock_total": inv.stock,
            "stock_reservado": inv.stock_reservado,
        }
        for inv in inventarios
    ]


def get_resumen_clientes(
    db: Session,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    limit: int = 20,
) -> List[Dict]:
    """
    Obtener resumen de mejores clientes
    """

    query = (
        db.query(
            Usuario.nombre_completo,
            Usuario.email,
            func.count(Orden.id).label("total_ordenes"),
            func.sum(Orden.total).label("total_gastado"),
        )
        .join(Orden, Orden.usuario_id == Usuario.id)
        .filter(
            Usuario.rol == "cliente",
            Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]),
        )
    )

    if fecha_desde:
        query = query.filter(Orden.fecha_orden >= fecha_desde)

    if fecha_hasta:
        query = query.filter(Orden.fecha_orden <= fecha_hasta)

    resultados = (
        query.group_by(Usuario.id, Usuario.nombre_completo, Usuario.email)
        .order_by(func.sum(Orden.total).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "cliente": r.nombre_completo or r.email,
            "email": r.email,
            "total_ordenes": r.total_ordenes,
            "total_gastado": float(r.total_gastado),
            "ticket_promedio": (
                float(r.total_gastado / r.total_ordenes) if r.total_ordenes > 0 else 0
            ),
        }
        for r in resultados
    ]
