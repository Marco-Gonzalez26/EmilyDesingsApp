"""Schemas for recommendation-related features."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class InteraccionCreate(BaseModel):
    """Schema to record a user interaction (producto_id opcional solo para busqueda)"""
    producto_id: Optional[UUID] = None
    tipo_interaccion: str = Field(
        ...,
        pattern="^(vista|clic|agregar_carrito|agregar_favorito|compra|busqueda)$",
    )
    duracion_segundos: Optional[float] = None
    metadata_json: Optional[dict] = None


class FavoritoCreate(BaseModel):
    """Schema to add a product to favorites"""
    producto_id: UUID


class FavoritoResponse(BaseModel):
    """Schema for favorite response"""
    id: UUID
    usuario_id: UUID
    producto_id: UUID
    fecha_agregado: datetime
    model_config = ConfigDict(from_attributes=True)


class RecomendacionResponse(BaseModel):
    """Schema for a recommended product"""
    producto_id: str
    sku: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    precio_regular: float
    precio_descuento: Optional[float] = None
    categoria: Optional[str] = None
    imagen_principal: Optional[str] = None
    score: float
    algoritmo: str
