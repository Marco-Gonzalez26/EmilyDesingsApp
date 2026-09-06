from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from uuid import UUID

from app.models.models import Carrito, CarritoItem, Producto, Inventario


def get_or_create_carrito(db: Session, usuario_id: UUID) -> Carrito:
    """Obtener carrito activo del usuario o crear uno nuevo"""
    carrito= (
        db.query(Carrito)
        .options(
            joinedload(Carrito.items)
            .joinedload(CarritoItem.producto)
            .joinedload(Producto.imagenes),
            joinedload(Carrito.items).joinedload(CarritoItem.talla),
            joinedload(Carrito.items).joinedload(CarritoItem.color),
        )
        .filter(Carrito.usuario_id == usuario_id, Carrito.activo == True)
        .first()
    )

    if not carrito:
        carrito = Carrito(usuario_id=usuario_id, activo=True)
        db.add(carrito)
        db.commit()
        db.refresh(carrito)

    return carrito


def add_item(
    db: Session,
    usuario_id: UUID,
    producto_id: UUID,
    talla_id: UUID,
    color_id: UUID,
    cantidad: int,
    origen: str = "catalogo",
) -> Carrito:
    """Agregar item al carrito y reservar stock"""


    producto = (
        db.query(Producto)
        .filter(Producto.id == producto_id, Producto.activo == True)
        .first()
    )

    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
        )

    # Verificar stock disponible
    inventario = (
        db.query(Inventario)
        .filter(
            Inventario.producto_id == producto_id,
            Inventario.talla_id == talla_id,
            Inventario.color_id == color_id,
        )
        .first()
    )

    if not inventario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Producto no disponible en esta talla/color",
        )

    stock_disponible = inventario.stock - inventario.stock_reservado
    if stock_disponible < cantidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solo hay {stock_disponible} unidades disponibles",
        )

    carrito = get_or_create_carrito(db, usuario_id)

    # Verificar si el item ya existe
    existing_item = (
        db.query(CarritoItem)
        .filter(
            CarritoItem.carrito_id == carrito.id,
            CarritoItem.producto_id == producto_id,
            CarritoItem.talla_id == talla_id,
            CarritoItem.color_id == color_id,
        )
        .first()
    )

    if existing_item:
        nueva_cantidad = existing_item.cantidad + cantidad
        stock_disponible = inventario.stock - inventario.stock_reservado
        if stock_disponible < cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo puedes agregar {stock_disponible} unidades más",
            )

        existing_item.cantidad = nueva_cantidad
        inventario.stock_reservado += cantidad
    else:
        precio = producto.precio_descuento or producto.precio_regular
        new_item = CarritoItem(
            carrito_id=carrito.id,
            producto_id=producto_id,
            talla_id=talla_id,
            color_id=color_id,
            cantidad=cantidad,
            precio_unitario=precio,
            origen=origen,
        )
        db.add(new_item)
        inventario.stock_reservado += cantidad

    from app.services.interaccion_service import registrar_interaccion
    registrar_interaccion(
        db=db,
        usuario_id=usuario_id,
        producto_id=producto_id,
        tipo_interaccion="agregar_carrito",
    )

    return get_or_create_carrito(db, usuario_id)


def update_item_quantity(
    db: Session,
    usuario_id: UUID,
    item_id: UUID,
    cantidad: int,
) -> Carrito:
    """Actualizar cantidad y ajustar reserva de stock"""
    carrito = get_or_create_carrito(db, usuario_id)

    item = (
        db.query(CarritoItem)
        .filter(
            CarritoItem.id == item_id,
            CarritoItem.carrito_id == carrito.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item no encontrado en el carrito",
        )

    inventario = (
        db.query(Inventario)
        .filter(
            Inventario.producto_id == item.producto_id,
            Inventario.talla_id == item.talla_id,
            Inventario.color_id == item.color_id,
        )
        .first()
    )

    if not inventario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Producto no encontrado en inventario",
        )

    diferencia = cantidad - item.cantidad

    if diferencia > 0:
        stock_disponible = inventario.stock - inventario.stock_reservado
        if stock_disponible < diferencia:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo hay {stock_disponible} unidades disponibles",
            )

    if cantidad <= 0:
        inventario.stock_reservado -= item.cantidad
        db.delete(item)
    else:
        inventario.stock_reservado += diferencia
        item.cantidad = cantidad

    db.commit()
    return get_or_create_carrito(db, usuario_id)


def remove_item(db: Session, usuario_id: UUID, item_id: UUID) -> Carrito:
    """Eliminar item y liberar stock reservado"""
    carrito = get_or_create_carrito(db, usuario_id)

    item = (
        db.query(CarritoItem)
        .filter(
            CarritoItem.id == item_id,
            CarritoItem.carrito_id == carrito.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item no encontrado en el carrito",
        )

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
        inventario.stock_reservado -= item.cantidad

    db.delete(item)
    db.commit()
    return get_or_create_carrito(db, usuario_id)


def clear_carrito(db: Session, usuario_id: UUID) -> Carrito:
    """Vaciar carrito y liberar todo el stock reservado"""
    carrito = get_or_create_carrito(db, usuario_id)

    items = db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).all()

    for item in items:
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
            inventario.stock_reservado -= item.cantidad

    db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).delete()

    db.commit()
    return get_or_create_carrito(db, usuario_id)


def get_total(db: Session, usuario_id: UUID) -> dict:
    """Calcular totales del carrito"""
    carrito = get_or_create_carrito(db, usuario_id)

    subtotal = sum(
        float(item.precio_unitario) * item.cantidad for item in carrito.items
    )
    envio = 0.0 if subtotal >= 50 else 5.0
    total = subtotal + envio

    return {
        "subtotal": round(subtotal, 2),
        "envio": envio,
        "total": round(total, 2),
        "cantidad_items": sum(item.cantidad for item in carrito.items),
    }
