"""Interactions router - record clic/busqueda (and any type) for the recommendation model."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.config import get_db
from app.models.models import Usuario
from app.utils.auth_dependencies import get_current_user
from app.schemas.recommendation_schema import InteraccionCreate
from app.services.interaccion_service import registrar_interaccion

router = APIRouter(prefix="/api/interacciones", tags=["Interacciones"])


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_interaccion(
    data: InteraccionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Record a user interaction (clic, busqueda, ...). producto_id opcional solo para busqueda."""
    if data.tipo_interaccion != "busqueda" and data.producto_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="producto_id requerido salvo para busqueda",
        )
    interaccion = registrar_interaccion(
        db=db,
        usuario_id=current_user.id,
        producto_id=data.producto_id,
        tipo_interaccion=data.tipo_interaccion,
        duracion_segundos=data.duracion_segundos,
        metadata_json=data.metadata_json,
    )
    return {"id": str(interaccion.id), "tipo_interaccion": interaccion.tipo_interaccion}
