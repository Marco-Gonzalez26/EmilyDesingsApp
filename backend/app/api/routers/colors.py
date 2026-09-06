from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.config import get_db
from app.schemas.schemas import ColorCreate, ColorUpdate, ColorResponse
from app.utils.auth_dependencies import get_current_admin_user
from app.models.models import Usuario
import app.services.color_service as color_service

router = APIRouter(prefix="/api/colores", tags=["Colores"])


@router.get("/", response_model=List[ColorResponse])
def listar_colores(solo_activos: bool = True, db: Session = Depends(get_db)):
    return color_service.get_colores(db, solo_activos)


@router.get("/{color_id}", response_model=ColorResponse)
def obtener_color(color_id: UUID, db: Session = Depends(get_db)):
    return color_service.get_color_by_id(db, color_id)


@router.post("/", response_model=ColorResponse, status_code=status.HTTP_201_CREATED)
def crear_color(
    data: ColorCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return color_service.create_color(db, data)


@router.patch("/{color_id}", response_model=ColorResponse)
def actualizar_color(
    color_id: UUID,
    data: ColorUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return color_service.update_color(db, color_id, data)


@router.delete("/{color_id}", response_model=ColorResponse)
def eliminar_color(
    color_id: UUID,
    permanente: bool = False,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return color_service.delete_color(db, color_id, soft_delete=not permanente)
