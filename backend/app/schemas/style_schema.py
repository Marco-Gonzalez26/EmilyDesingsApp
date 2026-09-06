from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class EstiloBase(BaseModel):
    """Schema base para estilos"""

    nombre: str = Field(
        ..., min_length=2, max_length=50, description="Nombre del estilo"
    )
    descripcion: Optional[str] = Field(
        None, max_length=200, description="Descripción del estilo"
    )
    activo: bool = Field(default=True, description="Si está activo para selección")
    orden: int = Field(default=0, description="Orden de visualización")


class EstiloCreate(EstiloBase):
    """Schema para crear estilo"""

    pass


class EstiloUpdate(BaseModel):
    """Schema para actualizar estilo"""

    nombre: Optional[str] = Field(None, min_length=2, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: Optional[bool] = None
    orden: Optional[int] = None


class EstiloResponse(EstiloBase):
    """Schema para respuesta de estilo"""

    id: UUID
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class EstilosDisponiblesResponse(BaseModel):
    """Lista de estilos disponibles para el usuario"""

    estilos: List[EstiloResponse]
    total: int
