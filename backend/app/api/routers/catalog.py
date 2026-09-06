from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.config import get_db
from app.models.models import Usuario
from app.utils.auth_dependencies import get_optional_user
from app.schemas.schemas import (
    CatalogoHomeResponse,
)
from app.services import product_service, category_service, brand_service
from app.services import recomendacion_service

router = APIRouter(prefix="/api/catalogo", tags=["Catálogo"])


@router.get("/home", response_model=CatalogoHomeResponse)
def catalogo_home(
    db: Session = Depends(get_db),
    limit_productos: int = Query(10, ge=1, le=20),
    current_user: Usuario | None = Depends(get_optional_user),
):
    """
    Datos principales para la Home del frontend

    Devuelve en un solo request:
    - Productos destacados
    - Productos nuevos
    - Productos en oferta
    - Categorías activas
    - Marcas activas
    - Recomendaciones personalizadas (si el usuario está autenticado)
    """

    recomendaciones = []
    if current_user:
        recomendaciones = recomendacion_service.get_recomendaciones(
            db=db,
            usuario_id=current_user.id,
            k=limit_productos,
        )

    return {
        "destacados": product_service.get_productos_destacados(db, limit_productos),
        "nuevos": product_service.get_productos_nuevos(db, limit_productos),
        "ofertas": product_service.get_productos_en_oferta(db, limit_productos),
        "categorias": category_service.get_categorias_activas(db),
        "marcas": brand_service.get_marcas_activas(db),
        "recomendaciones": recomendaciones,
    }
