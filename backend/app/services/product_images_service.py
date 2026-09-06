
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from typing import List, Optional

from app.models.models import ImagenProducto, Producto
from app.schemas.schemas import ImagenProductoCreate, ImagenProductoUpdate


def get_imagenes_producto(db: Session, producto_id: UUID) -> List[ImagenProducto]:
    """
    Obtener todas las imágenes de un producto

    Args:
        db: Sesión de base de datos
        producto_id: UUID del producto

    Returns:
        Lista de imágenes ordenadas por 'orden'
    """
    return (
        db.query(ImagenProducto)
        .filter(ImagenProducto.producto_id == producto_id)
        .order_by(ImagenProducto.orden.asc())
        .all()
    )


def get_imagen_by_id(db: Session, imagen_id: UUID) -> ImagenProducto:
    """
    Obtener una imagen por ID

    Args:
        db: Sesión de base de datos
        imagen_id: UUID de la imagen

    Returns:
        Imagen encontrada

    Raises:
        HTTPException: Si la imagen no existe
    """
    imagen = db.query(ImagenProducto).filter(ImagenProducto.id == imagen_id).first()

    if not imagen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagen con ID {imagen_id} no encontrada",
        )

    return imagen


def add_imagen_producto(
    db: Session, producto_id: UUID, imagen_data: ImagenProductoCreate
) -> ImagenProducto:
    """
    Agregar una imagen a un producto

    Args:
        db: Sesión de base de datos
        producto_id: UUID del producto
        imagen_data: Datos de la imagen

    Returns:
        Imagen creada

    Raises:
        HTTPException: Si el producto no existe
    """
    # Verificar que el producto exista
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {producto_id} no encontrado",
        )

    # Si se marca como principal, quitar el flag de las demás
    if imagen_data.es_principal:
        db.query(ImagenProducto).filter(
            ImagenProducto.producto_id == producto_id,
            ImagenProducto.es_principal == True,
        ).update({"es_principal": False})

    # Crear nueva imagen
    nueva_imagen = ImagenProducto(
        producto_id=producto_id,
        url_imagen=imagen_data.url_imagen,
        es_principal=imagen_data.es_principal,
        orden=imagen_data.orden,
    )

    db.add(nueva_imagen)
    db.commit()
    db.refresh(nueva_imagen)

    return nueva_imagen


def update_imagen_producto(
    db: Session, imagen_id: UUID, imagen_data: ImagenProductoUpdate
) -> ImagenProducto:
    """
    Actualizar una imagen

    Args:
        db: Sesión de base de datos
        imagen_id: UUID de la imagen
        imagen_data: Datos a actualizar

    Returns:
        Imagen actualizada
    """
    imagen = get_imagen_by_id(db, imagen_id)

    # Obtener solo los campos que vienen en la petición
    update_data = imagen_data.model_dump(exclude_unset=True)

    # Si se marca como principal, quitar el flag de las demás del mismo producto
    if "es_principal" in update_data and update_data["es_principal"]:
        db.query(ImagenProducto).filter(
            ImagenProducto.producto_id == imagen.producto_id,
            ImagenProducto.id != imagen_id,
            ImagenProducto.es_principal == True,
        ).update({"es_principal": False})

    # Actualizar campos
    for field, value in update_data.items():
        setattr(imagen, field, value)

    db.commit()
    db.refresh(imagen)

    return imagen


def delete_imagen_producto(db: Session, imagen_id: UUID) -> ImagenProducto:
    """
    Eliminar una imagen

    Args:
        db: Sesión de base de datos
        imagen_id: UUID de la imagen

    Returns:
        Imagen eliminada
    """
    imagen = get_imagen_by_id(db, imagen_id)

    # Si era la imagen principal, asignar otra como principal
    if imagen.es_principal:
        otra_imagen = (
            db.query(ImagenProducto)
            .filter(
                ImagenProducto.producto_id == imagen.producto_id,
                ImagenProducto.id != imagen_id,
            )
            .first()
        )

        if otra_imagen:
            otra_imagen.es_principal = True

    db.delete(imagen)
    db.commit()

    return imagen


def reorder_imagenes(
    db: Session, producto_id: UUID, imagen_ids_order: List[UUID]
) -> List[ImagenProducto]:
    """
    Reordenar imágenes de un producto

    Args:
        db: Sesión de base de datos
        producto_id: UUID del producto
        imagen_ids_order: Lista de IDs en el orden deseado

    Returns:
        Lista de imágenes reordenadas
    """
    for index, imagen_id in enumerate(imagen_ids_order, start=1):
        db.query(ImagenProducto).filter(
            ImagenProducto.id == imagen_id, ImagenProducto.producto_id == producto_id
        ).update({"orden": index})

    db.commit()

    return get_imagenes_producto(db, producto_id)
