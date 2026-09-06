from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.config import get_db
from app.schemas.schemas import TallaCreate, TallaUpdate, TallaResponse
from app.utils.auth_dependencies import get_current_admin_user
from app.models.models import Usuario
import app.services.size_service as talla_service

router = APIRouter(prefix="/api/tallas", tags=["Tallas"])


@router.get("/", response_model=List[TallaResponse])
def listar_tallas(solo_activas: bool = True, db: Session = Depends(get_db)):
    return talla_service.get_tallas(db, solo_activas)


@router.get("/{talla_id}", response_model=TallaResponse)
def obtener_talla(talla_id: UUID, db: Session = Depends(get_db)):
    return talla_service.get_talla_by_id(db, talla_id)


@router.post("/", response_model=TallaResponse, status_code=status.HTTP_201_CREATED)
def crear_talla(
    data: TallaCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return talla_service.create_talla(db, data)


@router.patch("/{talla_id}", response_model=TallaResponse)
def actualizar_talla(
    talla_id: UUID,
    data: TallaUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return talla_service.update_talla(db, talla_id, data)


@router.delete("/{talla_id}", response_model=TallaResponse)
def eliminar_talla(
    talla_id: UUID,
    permanente: bool = False,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return talla_service.delete_talla(db, talla_id, soft_delete=not permanente)
