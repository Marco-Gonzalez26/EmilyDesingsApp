from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from uuid import uuid4, UUID
from decimal import Decimal
from typing import List, Optional

import asyncio
from datetime import datetime
import stripe
import os

from app.services.email_service import send_order_confirmation_email

from app.models.models import (
    Orden,
    OrdenItem,
    Producto,
    Usuario,
    Carrito,
    Inventario,
    CarritoItem,
)
from app.schemas.schemas import OrdenCreate
from app.enums.order import OrdenEstado

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def create_orden(db: Session, orden_data: OrdenCreate, user: Usuario) -> Orden:
    if not orden_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La orden debe tener al menos un producto",
        )

    subtotal = Decimal("0.00")
    items_db: List[OrdenItem] = []

    for item in orden_data.items:
        producto = (
            db.query(Producto)
            .filter(Producto.id == item.producto_id, Producto.activo == True)
            .first()
        )

        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto {item.producto_id} no encontrado",
            )

        precio_unitario = (
            producto.precio_descuento
            if producto.precio_descuento
            else producto.precio_regular
        )

        subtotal_item = precio_unitario * item.cantidad
        subtotal += subtotal_item
        items_db.append(
            OrdenItem(
                producto_id=item.producto_id,
                nombre_producto=item.nombre_producto,
                talla_id=item.talla_id,
                color_id=item.color_id,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=item.subtotal,
                origen=item.origen ,
            )
        )

    orden = Orden(
        usuario_id=user.id,
        numero_orden=f"ORD-{uuid4().hex[:8].upper()}",
        direccion_envio=orden_data.direccion_envio,
        metodo_pago=orden_data.metodo_pago,
        subtotal=orden_data.subtotal,
        costo_envio=orden_data.costo_envio,
        impuestos=orden_data.impuestos,
        total=orden_data.total,
        estado=OrdenEstado["PENDIENTE"],
        items=items_db,
    )

    db.add(orden)
    db.commit()
    db.refresh(orden)

    return orden


def get_mis_ordenes(
    db: Session, user: Usuario, skip: int = 0, limit: int = 10
) -> tuple[List[Orden], int]:
    query = db.query(Orden).filter(Orden.usuario_id == user.id)
    total = query.count()
    ordenes = query.order_by(Orden.fecha_orden.desc()).offset(skip).limit(limit).all()
    return ordenes, total


def get_orden_by_id(db: Session, orden_id: UUID, user: Usuario) -> Orden:
    orden = (
        db.query(Orden)
        .options(joinedload(Orden.items))
        .filter(Orden.id == orden_id, Orden.usuario_id == user.id)
        .first()
    )

    if not orden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    return orden


def crear_stripe_checkout_session(
    db: Session, orden_id: UUID, user: Usuario, success_url: str, cancel_url: str
) -> dict:
    """Crear sesión de Stripe Checkout para una orden"""

    orden = (
        db.query(Orden)
        .options(joinedload(Orden.items))
        .filter(Orden.id == orden_id, Orden.usuario_id == user.id)
        .first()
    )

    if not orden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada"
        )

    if orden.estado != OrdenEstado["PENDIENTE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La orden ya ha sido procesada",
        )

    # Crear line items para Stripe
    line_items = []
    for item in orden.items:
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": item.nombre_producto,
                    },
                    "unit_amount": int(float(item.precio_unitario) * 100),
                },
                "quantity": item.cantidad,
            }
        )

    # Agregar envío si aplica
    if float(orden.costo_envio) > 0:
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Envío",
                    },
                    "unit_amount": int(float(orden.costo_envio) * 100),
                },
                "quantity": 1,
            }
        )

    # Agregar impuestos si aplica
    if float(orden.impuestos) > 0:
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Impuestos (12%)",
                    },
                    "unit_amount": int(float(orden.impuestos) * 100),
                },
                "quantity": 1,
            }
        )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=success_url
            + f"?session_id={{CHECKOUT_SESSION_ID}}&orden_id={orden_id}",
            cancel_url=cancel_url,
            metadata={
                "orden_id": str(orden_id),
                "numero_orden": orden.numero_orden,
                "usuario_id": str(user.id),
            },
        )

        return {
            "checkout_url": session.url,
            "session_id": session.id,
        }

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear sesión de pago: {str(e)}",
        )


async def confirmar_pago_stripe(db: Session, session_id: str, user: Usuario) -> Orden:
    """Confirmar el pago, actualizar orden y descontar stock"""

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El pago no ha sido completado",
            )
        orden_id_str = session.metadata["orden_id"] if "orden_id" in session.metadata else None
        if not orden_id_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Metadata de orden no encontrada en la sesión de Stripe",
                )
        orden_id = UUID(orden_id_str)

      
        orden = (
            db.query(Orden)
            .options(joinedload(Orden.items))
            .filter(Orden.id == orden_id, Orden.usuario_id == user.id)
            .first()
        )

        if not orden:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada"
            )

        # Descontar stock de inventario
        for item in orden.items:
            inventario = (
                db.query(Inventario)
                .filter(
                    Inventario.producto_id == item.producto_id,
                    Inventario.talla_id == item.talla_id,
                    Inventario.color_id == item.color_id,
                )
                .first()
            )

            if inventario:
                inventario.stock -= item.cantidad
                # Liberar reserva solo si existe y no excede
                if inventario.stock_reservado >= item.cantidad:
                    inventario.stock_reservado -= item.cantidad
                else:
                    # Si no hay suficiente reservado, dejar en 0
                    inventario.stock_reservado = 0

        orden.estado = OrdenEstado["CONFIRMADO"]
        orden.stripe_payment_id = session.payment_intent
        orden.fecha_actualizacion_estado = datetime.now()

        # Record purchase interactions for the recommendation model
        from app.services.interaccion_service import registrar_interaccion
        for item in orden.items:
            registrar_interaccion(
                db=db,
                usuario_id=user.id,
                producto_id=item.producto_id,
                tipo_interaccion="compra",
            )

        # Vaciar carrito y liberar reservas restantes
        carrito = (
            db.query(Carrito)
            .filter(Carrito.usuario_id == user.id, Carrito.activo == True)
            .first()
        )

        if carrito:
            # Liberar reservas de items que aún estén en el carrito
            items_carrito = (
                db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).all()
            )

            for item in items_carrito:
                inv = (
                    db.query(Inventario)
                    .filter(
                        Inventario.producto_id == item.producto_id,
                        Inventario.talla_id == item.talla_id,
                        Inventario.color_id == item.color_id,
                    )
                    .first()
                )
                if inv and inv.stock_reservado >= item.cantidad:
                    inv.stock_reservado -= item.cantidad

            # Eliminar items del carrito
            db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).delete()

            # Eliminar el carrito
            db.delete(carrito)

        # Un solo commit al final
        db.commit()
        db.refresh(orden)

        try:
            from app.services.email_service import send_order_confirmation_email

            items_email = [
                {
                    "nombre_producto": item.nombre_producto,
                    "cantidad": item.cantidad,
                    "precio_unitario": float(item.precio_unitario),
                    "subtotal": float(item.subtotal),
                }
                for item in orden.items
            ]

            # Ejecutar envío de email de forma asíncrona
            asyncio.create_task(
                send_order_confirmation_email(
                    to_email=user.email,
                    nombre_cliente=user.nombre_completo,
                    numero_orden=orden.numero_orden,
                    total=float(orden.total),
                    items=items_email,
                    direccion_envio=orden.direccion_envio,
                )
            )
        except Exception as e:
            pass

        return orden

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al confirmar pago: {str(e)}",
        )


def get_all_ordenes_admin(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    estado: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    search: Optional[str] = None,
) -> tuple[List[Orden], int]:
    """
    Obtener todas las órdenes con filtros (SOLO ADMIN)

    Args:
        db: Sesión de base de datos
        skip: Registros a saltar (paginación)
        limit: Límite de registros
        estado: Filtrar por estado específico
        fecha_desde: Filtrar desde fecha
        fecha_hasta: Filtrar hasta fecha
        search: Buscar por número de orden o email de usuario

    Returns:
        tuple: (ordenes, total)
    """
    query = db.query(Orden).options(joinedload(Orden.usuario), joinedload(Orden.items))

    if estado:
        query = query.filter(Orden.estado == estado)

    # Filtro por fecha
    if fecha_desde:
        query = query.filter(Orden.fecha_orden >= fecha_desde)

    if fecha_hasta:
        query = query.filter(Orden.fecha_orden <= fecha_hasta)

    # Búsqueda por número de orden, email o nombre completo
    if search:
        query = query.join(Usuario).filter(
            (Orden.numero_orden.ilike(f"%{search}%"))
            | (Usuario.email.ilike(f"%{search}%"))
            | (Usuario.nombre_completo.ilike(f"%{search}%"))
        )

    total = query.count()
    ordenes = query.order_by(Orden.fecha_orden.desc()).offset(skip).limit(limit).all()

    return ordenes, total


def get_orden_by_id_admin(db: Session, orden_id: UUID) -> Orden:
    """
    Obtener orden por ID (SOLO ADMIN)

    Args:
        db: Sesión de base de datos
        orden_id: UUID de la orden

    Returns:
        Orden completa con relaciones

    Raises:
        HTTPException: Si la orden no existe
    """
    orden = (
        db.query(Orden)
        .options(
            joinedload(Orden.usuario),
            joinedload(Orden.items).joinedload(OrdenItem.producto),
            joinedload(Orden.items).joinedload(OrdenItem.talla),
            joinedload(Orden.items).joinedload(OrdenItem.color),
        )
        .filter(Orden.id == orden_id)
        .first()
    )

    if not orden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada"
        )

    return orden


def update_orden_estado(
    db: Session,
    orden_id: UUID,
    nuevo_estado: str,
    motivo_cancelacion: Optional[str] = None,
) -> Orden:
    """
    Actualizar el estado de una orden (SOLO ADMIN)

    Args:
        db: Sesión de base de datos
        orden_id: UUID de la orden
        nuevo_estado: Nuevo estado a aplicar
        motivo_cancelacion: Razón de cancelación (solo si estado = Cancelado)

    Returns:
        Orden actualizada

    Raises:
        HTTPException: Si la orden no existe o el estado es inválido
    """
    orden = get_orden_by_id_admin(db, orden_id)

    # Validar estado
    estados_validos = [
        "Pendiente",
        "Confirmado",
        "En Proceso",
        "Enviado",
        "Entregado",
        "Cancelado",
    ]
    if nuevo_estado not in estados_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}",
        )

    # Validar transiciones de estado
    if orden.estado == "Entregado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cambiar el estado de una orden ya entregada",
        )

    if orden.estado == "Cancelado" and nuevo_estado != "Cancelado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cambiar el estado de una orden cancelada",
        )

    # Si se cancela, restaurar stock
    if nuevo_estado == "Cancelado" and orden.estado != "Cancelado":
        if not motivo_cancelacion:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe proporcionar un motivo de cancelación",
            )

        # Restaurar stock
        for item in orden.items:
            inventario = (
                db.query(Inventario)
                .filter(
                    Inventario.producto_id == item.producto_id,
                    Inventario.talla_id == item.talla_id,
                    Inventario.color_id == item.color_id,
                )
                .first()
            )

            if inventario:
                inventario.stock += item.cantidad

        orden.motivo_cancelacion = motivo_cancelacion

    # Actualizar estado
    orden.estado = nuevo_estado
    orden.fecha_actualizacion_estado = datetime.now()

    db.commit()
    db.refresh(orden)

    return orden


def get_estadisticas_ordenes(db: Session) -> dict:
    """
    Obtener estadísticas de órdenes (SOLO ADMIN)

    Returns:
        dict con estadísticas clave
    """
    from sqlalchemy import func

    total_ordenes = db.query(func.count(Orden.id)).scalar()

    # Órdenes por estado
    ordenes_por_estado = (
        db.query(Orden.estado, func.count(Orden.id)).group_by(Orden.estado).all()
    )

    # Ventas totales
    ventas_totales = db.query(func.sum(Orden.total)).filter(
        Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"])
    ).scalar() or Decimal("0.00")

    # Órdenes del mes actual
    from datetime import date

    primer_dia_mes = date.today().replace(day=1)

    ordenes_mes = (
        db.query(func.count(Orden.id))
        .filter(Orden.fecha_orden >= primer_dia_mes)
        .scalar()
    )

    ventas_mes = db.query(func.sum(Orden.total)).filter(
        Orden.fecha_orden >= primer_dia_mes,
        Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]),
    ).scalar() or Decimal("0.00")

    return {
        "total_ordenes": total_ordenes,
        "ordenes_por_estado": {estado: count for estado, count in ordenes_por_estado},
        "ventas_totales": float(ventas_totales),
        "ordenes_mes": ordenes_mes,
        "ventas_mes": float(ventas_mes),
    }
