from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, status
from uuid import UUID
from typing import List, Optional

from app.models.models import Inventario, Producto, Talla, Color
from app.schemas.schemas import InventarioCreate, InventarioUpdate, InventarioAjuste


def get_inventario_by_producto(db: Session, producto_id: UUID) -> List[Inventario]:
    """
    Obtener inventario disponible de un producto con stock > stock_reservado

    Args:
        db: Sesión de base de datos
        producto_id: UUID del producto

    Returns:
        Lista de inventario con stock disponible
    """
    return (
        db.query(Inventario)
        .options(joinedload(Inventario.talla), joinedload(Inventario.color))
        .filter(
            Inventario.producto_id == producto_id,
            Inventario.stock > Inventario.stock_reservado,
        )
        .all()
    )


def get_all_inventario_by_producto(db: Session, producto_id: UUID) -> List[Inventario]:
    """
    Obtener TODO el inventario de un producto (incluye stock 0)
    Para vista de administración

    Args:
        db: Sesión de base de datos
        producto_id: UUID del producto

    Returns:
        Lista completa de inventario del producto
    """
    return (
        db.query(Inventario)
        .options(joinedload(Inventario.talla), joinedload(Inventario.color))
        .filter(Inventario.producto_id == producto_id)
        .order_by(Inventario.talla_id, Inventario.color_id)
        .all()
    )


def get_inventario_list(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    producto_id: Optional[UUID] = None,
    talla_id: Optional[UUID] = None,
    color_id: Optional[UUID] = None,
    stock_bajo: Optional[int] = None,
) -> tuple[List[Inventario], int]:
    """
    Listar inventario con filtros

    Args:
        db: Sesión de base de datos
        skip: Registros a saltar (paginación)
        limit: Límite de registros
        producto_id: Filtrar por producto
        talla_id: Filtrar por talla
        color_id: Filtrar por color
        stock_bajo: Mostrar solo con stock disponible < X

    Returns:
        Tupla (inventarios, total)
    """
    query = db.query(Inventario).options(
        joinedload(Inventario.producto),
        joinedload(Inventario.talla),
        joinedload(Inventario.color),
    )

    # Aplicar filtros
    if producto_id:
        query = query.filter(Inventario.producto_id == producto_id)

    if talla_id:
        query = query.filter(Inventario.talla_id == talla_id)

    if color_id:
        query = query.filter(Inventario.color_id == color_id)

    if stock_bajo is not None:
        query = query.filter(
            (Inventario.stock - Inventario.stock_reservado) < stock_bajo
        )

    total = query.count()
    inventarios = query.offset(skip).limit(limit).all()

    return inventarios, total


def get_stock_disponible(
    db: Session, producto_id: UUID, talla_id: UUID, color_id: UUID
) -> int:
    """
    Obtener stock disponible de una combinación específica

    Args:
        db: Sesión de base de datos
        producto_id: UUID del producto
        talla_id: UUID de la talla
        color_id: UUID del color

    Returns:
        Stock disponible (stock - stock_reservado)
    """
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
        return 0

    return inventario.stock - inventario.stock_reservado


def get_inventario_by_id(db: Session, inventario_id: UUID) -> Inventario:
    """
    Obtener inventario por ID

    Args:
        db: Sesión de base de datos
        inventario_id: UUID del inventario

    Returns:
        Inventario encontrado

    Raises:
        HTTPException: Si no existe
    """
    inventario = (
        db.query(Inventario)
        .options(
            joinedload(Inventario.producto),
            joinedload(Inventario.talla),
            joinedload(Inventario.color),
        )
        .filter(Inventario.id == inventario_id)
        .first()
    )

    if not inventario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventario con ID {inventario_id} no encontrado",
        )

    return inventario


def create_inventario(db: Session, inventario_data: InventarioCreate) -> Inventario:
    """
    Crear registro de inventario

    Args:
        db: Sesión de base de datos
        inventario_data: Datos del inventario

    Returns:
        Inventario creado

    Raises:
        HTTPException: Si la combinación ya existe o entidades no existen
    """
    # Verificar que el producto exista
    producto = (
        db.query(Producto).filter(Producto.id == inventario_data.producto_id).first()
    )
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {inventario_data.producto_id} no encontrado",
        )

    # Verificar que la talla exista
    talla = db.query(Talla).filter(Talla.id == inventario_data.talla_id).first()
    if not talla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Talla con ID {inventario_data.talla_id} no encontrada",
        )

    # Verificar que el color exista
    color = db.query(Color).filter(Color.id == inventario_data.color_id).first()
    if not color:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Color con ID {inventario_data.color_id} no encontrado",
        )

    # Verificar que la combinación no exista
    existing = (
        db.query(Inventario)
        .filter(
            Inventario.producto_id == inventario_data.producto_id,
            Inventario.talla_id == inventario_data.talla_id,
            Inventario.color_id == inventario_data.color_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe inventario para esta combinación de producto, talla y color",
        )

    # Crear inventario
    nuevo_inventario = Inventario(**inventario_data.model_dump())

    db.add(nuevo_inventario)
    db.commit()
    db.refresh(nuevo_inventario)

    return nuevo_inventario


def update_inventario(
    db: Session, inventario_id: UUID, inventario_data: InventarioUpdate
) -> Inventario:
    """
    Actualizar inventario

    Args:
        db: Sesión de base de datos
        inventario_id: UUID del inventario
        inventario_data: Datos a actualizar

    Returns:
        Inventario actualizado

    Raises:
        HTTPException: Si stock < stock_reservado
    """
    inventario = get_inventario_by_id(db, inventario_id)

    # Obtener solo los campos que vienen en la petición
    update_data = inventario_data.model_dump(exclude_unset=True)

    # Validar que stock >= stock_reservado
    nuevo_stock = update_data.get("stock", inventario.stock)
    nuevo_reservado = update_data.get("stock_reservado", inventario.stock_reservado)

    if nuevo_stock < nuevo_reservado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El stock ({nuevo_stock}) no puede ser menor al stock reservado ({nuevo_reservado})",
        )

    # Actualizar campos
    for field, value in update_data.items():
        setattr(inventario, field, value)

    db.commit()
    db.refresh(inventario)

    return inventario


def ajustar_stock(
    db: Session, inventario_id: UUID, ajuste_data: InventarioAjuste
) -> Inventario:
    """
    Ajustar stock (incrementar o decrementar)

    Args:
        db: Sesión de base de datos
        inventario_id: UUID del inventario
        ajuste_data: Datos del ajuste (cantidad positiva o negativa)

    Returns:
        Inventario actualizado

    Raises:
        HTTPException: Si el stock resultante sería negativo o menor al reservado
    """
    inventario = get_inventario_by_id(db, inventario_id)

    nuevo_stock = inventario.stock + ajuste_data.ajuste

    # Validar que no quede negativo
    if nuevo_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ajuste de {ajuste_data.ajuste} dejaría el stock en {nuevo_stock}. No puede ser negativo.",
        )

    # Validar que no sea menor al reservado
    if nuevo_stock < inventario.stock_reservado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El stock ({nuevo_stock}) no puede ser menor al stock reservado ({inventario.stock_reservado})",
        )

    inventario.stock = nuevo_stock

    db.commit()
    db.refresh(inventario)

    return inventario


def delete_inventario(db: Session, inventario_id: UUID) -> Inventario:
    """
    Eliminar registro de inventario

    Args:
        db: Sesión de base de datos
        inventario_id: UUID del inventario

    Returns:
        Inventario eliminado

    Raises:
        HTTPException: Si tiene stock reservado
    """
    inventario = get_inventario_by_id(db, inventario_id)

    # No permitir eliminar si tiene stock reservado
    if inventario.stock_reservado > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar. Tiene {inventario.stock_reservado} unidades reservadas en carritos.",
        )

    db.delete(inventario)
    db.commit()

    return inventario


def get_variantes_producto(db: Session, producto_id: UUID) -> dict:
    """
    Obtiene tallas y colores disponibles de un producto agrupados por stock.

    Args:
        db: Sesión de base de datos
        producto_id: UUID del producto

    Returns:
        Dict con tallas_disponibles y colores_disponibles
    """
    from app.models.models import Producto

    inventarios = (
        db.query(Inventario)
        .options(joinedload(Inventario.talla), joinedload(Inventario.color))
        .filter(Inventario.producto_id == producto_id)
        .all()
    )

    tallas_map = {}
    colores_map = {}

    for inv in inventarios:
        if inv.talla_id and inv.talla:
            if inv.talla_id not in tallas_map:
                tallas_map[inv.talla_id] = {
                    "id": str(inv.talla_id),
                    "nombre": inv.talla.nombre,
                    "stock": 0,
                }
            tallas_map[inv.talla_id]["stock"] += inv.stock

        if inv.color_id and inv.color:
            if inv.color_id not in colores_map:
                colores_map[inv.color_id] = {
                    "id": str(inv.color_id),
                    "nombre": inv.color.nombre,
                    "codigo_hex": getattr(inv.color, "codigo_hexadecimal", None),
                }

    return {
        "tallas_disponibles": sorted(
            list(tallas_map.values()), key=lambda x: x["nombre"]
        ),
        "colores_disponibles": list(colores_map.values()),
    }


def get_productos_stock_bajo(db: Session, umbral: int = 10) -> List[dict]:
    """
    Obtener productos con stock bajo

    Args:
        db: Sesión de base de datos
        umbral: Umbral de stock bajo (default: 10)

    Returns:
        Lista de productos con stock disponible bajo
    """
    inventarios = (
        db.query(Inventario)
        .options(
            joinedload(Inventario.producto),
            joinedload(Inventario.talla),
            joinedload(Inventario.color),
        )
        .filter((Inventario.stock - Inventario.stock_reservado) < umbral)
        .filter((Inventario.stock - Inventario.stock_reservado) >= 0)
        .all()
    )

    return [
        {
            "inventario_id": inv.id,
            "producto": {
                "id": inv.producto.id,
                "nombre": inv.producto.nombre,
                "sku": inv.producto.sku,
            },
            "talla": inv.talla.nombre if inv.talla else None,
            "color": inv.color.nombre if inv.color else None,
            "stock_disponible": inv.stock - inv.stock_reservado,
            "stock_reservado": inv.stock_reservado,
        }
        for inv in inventarios
    ]
