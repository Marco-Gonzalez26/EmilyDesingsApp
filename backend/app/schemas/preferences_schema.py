from pydantic import BaseModel, Field, validator
from typing import List, Optional
from uuid import UUID
from datetime import datetime



ESTILOS_VALIDOS = {
    'casual', 'formal', 'elegante', 'deportivo', 
    'boho', 'minimalista', 'rockero', 'vintage',
    'urbano', 'clasico', 'romantico', 'moderno'
}


class PreferenciasBase(BaseModel):
    """Schema base con campos comunes"""
    estilos_preferidos: List[UUID] = Field(default_factory=list, max_length=5, description="Máximo 5 estilos (IDs)")
    categorias_favoritas: List[UUID] = Field(default_factory=list, max_length=10, description="IDs de categorías favoritas")
    colores_preferidos: List[UUID] = Field(default_factory=list, max_length=10, description="IDs de colores favoritos")
    evitar_categorias: List[UUID] = Field(default_factory=list, max_length=5, description="Categorías a evitar")
    tallas_preferidas: List[UUID] = Field(default_factory=list, max_length=10, description="IDs de tallas preferidas")
    rango_precio_min: Optional[float] = Field(None, description="Precio mínimo preferido")
    rango_precio_max: Optional[float] = Field(None, description="Precio máximo preferido")

    @validator('categorias_favoritas', 'evitar_categorias', 'estilos_preferidos', 'colores_preferidos', 'tallas_preferidas')
    def validar_sin_duplicados(cls, v):
        """Elimina duplicados y normaliza None a lista vacía"""
        if v is None:
            return []
        return list(set(v)) if v else []


class PreferenciasCreate(PreferenciasBase):
    """Schema para crear preferencias"""
    pass


class PreferenciasUpdate(BaseModel):
    """Schema para actualizar preferencias (todos los campos opcionales)"""
    estilos_preferidos: Optional[List[UUID]] = None
    categorias_favoritas: Optional[List[UUID]] = None
    colores_preferidos: Optional[List[UUID]] = None
    evitar_categorias: Optional[List[UUID]] = None
    tallas_preferidas: Optional[List[UUID]] = None
    rango_precio_min: Optional[float] = None
    rango_precio_max: Optional[float] = None


class PreferenciasResponse(PreferenciasBase):
    """Schema para respuesta"""
    id: UUID
    usuario_id: UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class EstilosDisponiblesResponse(BaseModel):
    """Lista de estilos disponibles"""
    estilos: List[str] = list(ESTILOS_VALIDOS)
    descripcion: str = "Estilos disponibles para preferencias de usuario"