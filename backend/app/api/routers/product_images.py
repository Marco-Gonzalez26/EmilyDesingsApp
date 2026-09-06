from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.config import get_db
from app.utils.auth_dependencies import get_current_admin_user
from app.models.models import Usuario
from app.schemas.schemas import (
    ImagenProductoCreate,
    ImagenProductoUpdate,
    ImagenProductoResponse,
)
from app.services import product_images_service

router = APIRouter(
    prefix="/api/productos/{producto_id}/imagenes", tags=["Imágenes de Productos"]
)


@router.get(
    "",
    response_model=List[ImagenProductoResponse],
    summary="Listar imágenes de un producto",
)
def get_imagenes(producto_id: UUID, db: Session = Depends(get_db)):
    """Obtener todas las imágenes de un producto"""
    return product_images_service.get_imagenes_producto(db, producto_id)


@router.post(
    "",
    response_model=ImagenProductoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar imagen a producto",
)
def add_imagen(
    producto_id: UUID,
    imagen_data: ImagenProductoCreate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Agregar una nueva imagen a un producto (solo admin)"""
    return product_images_service.add_imagen_producto(db, producto_id, imagen_data)


@router.put(
    "/{imagen_id}", response_model=ImagenProductoResponse, summary="Actualizar imagen"
)
def update_imagen(
    producto_id: UUID,
    imagen_id: UUID,
    imagen_data: ImagenProductoUpdate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Actualizar una imagen (solo admin)"""
    return product_images_service.update_imagen_producto(db, imagen_id, imagen_data)


@router.delete(
    "/{imagen_id}", response_model=ImagenProductoResponse, summary="Eliminar imagen"
)
def delete_imagen(
    producto_id: UUID,
    imagen_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Eliminar una imagen (solo admin)"""
    return product_images_service.delete_imagen_producto(db, imagen_id)


@router.post(
    "/reorder",
    response_model=List[ImagenProductoResponse],
    summary="Reordenar imágenes",
)
def reorder_imagenes(
    producto_id: UUID,
    imagen_ids: List[UUID],
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Reordenar las imágenes de un producto (solo admin)"""
    return product_images_service.reorder_imagenes(db, producto_id, imagen_ids)
