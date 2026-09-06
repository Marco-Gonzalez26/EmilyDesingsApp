from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.config import get_db
from app.schemas.schemas import MarcaCreate, MarcaUpdate, MarcaResponse
from app.utils.auth_dependencies import get_current_admin_user
from app.models.models import Usuario
import app.services.brand_service as marca_service

router = APIRouter(prefix="/api/marcas", tags=["Marcas"])


@router.get("/", response_model=List[MarcaResponse])
def listar_marcas(
    solo_activas: bool = True,
    db: Session = Depends(get_db),
):
    return marca_service.get_marcas(db, solo_activas)


@router.get("/{marca_id}", response_model=MarcaResponse)
def obtener_marca(
    marca_id: UUID,
    db: Session = Depends(get_db),
):
    return marca_service.get_marca_by_id(db, marca_id)


@router.post("/", response_model=MarcaResponse, status_code=status.HTTP_201_CREATED)
def crear_marca(
    data: MarcaCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return marca_service.create_marca(db, data)


@router.patch("/{marca_id}", response_model=MarcaResponse)
def actualizar_marca(
    marca_id: UUID,
    data: MarcaUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return marca_service.update_marca(db, marca_id, data)


@router.delete("/{marca_id}", response_model=MarcaResponse)
def eliminar_marca(
    marca_id: UUID,
    permanente: bool = False,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return marca_service.delete_marca(db, marca_id, soft_delete=not permanente)