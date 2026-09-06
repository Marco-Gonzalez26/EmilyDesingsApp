from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel, Field

from app.db.config import get_db
from app.schemas.schemas import CarritoResponse
from app.utils.auth_dependencies import get_current_user
from app.models.models import Usuario
import app.services.cart_service as cart_service

router = APIRouter(prefix="/api/carrito", tags=["Carrito"])


class AddItemRequest(BaseModel):
    producto_id: UUID
    talla_id: UUID
    color_id: UUID
    cantidad: int = Field(default=1, gt=0)

    origen: str = Field(default="catalogo")


class UpdateItemRequest(BaseModel):
    cantidad: int = Field(..., gt=0)


@router.get("/", response_model=CarritoResponse)
def get_carrito(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener carrito activo del usuario"""
    return cart_service.get_or_create_carrito(db, current_user.id)


@router.post("/items", response_model=CarritoResponse)
def add_item(
    data: AddItemRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Agregar item al carrito"""
    return cart_service.add_item(
        db,
        current_user.id,
        data.producto_id,
        data.talla_id,
        data.color_id,
        data.cantidad,
        data.origen,
    )


@router.patch("/items/{item_id}", response_model=CarritoResponse)
def update_item(
    item_id: UUID,
    data: UpdateItemRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Actualizar cantidad de un item"""
    return cart_service.update_item_quantity(
        db, current_user.id, item_id, data.cantidad
    )


@router.delete("/items/{item_id}", response_model=CarritoResponse)
def remove_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Eliminar item del carrito"""
    return cart_service.remove_item(db, current_user.id, item_id)


@router.delete("/", response_model=CarritoResponse)
def clear_carrito(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Vaciar el carrito"""
    return cart_service.clear_carrito(db, current_user.id)


@router.get("/total")
def get_total(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener totales del carrito"""
    return cart_service.get_total(db, current_user.id)
