from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.config import get_db
from app.schemas.schemas import CategoriaCreate, CategoriaUpdate, CategoriaResponse
from app.utils.auth_dependencies import get_current_admin_user
from app.models.models import Usuario
import app.services.category_service as categoria_service

router = APIRouter(prefix="/api/categorias", tags=["Categorías"])


@router.get("/", response_model=List[CategoriaResponse])
def listar_categorias(
    solo_activas: bool = True,
    db: Session = Depends(get_db),
):
    return categoria_service.get_categorias(db, solo_activas)


@router.get("/{categoria_id}", response_model=CategoriaResponse)
def obtener_categoria(
    categoria_id: UUID,
    db: Session = Depends(get_db),
):
    return categoria_service.get_categoria_by_id(db, categoria_id)


@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    data: CategoriaCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return categoria_service.create_categoria(db, data)


@router.patch("/{categoria_id}", response_model=CategoriaResponse)
def actualizar_categoria(
    categoria_id: UUID,
    data: CategoriaUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return categoria_service.update_categoria(db, categoria_id, data)


@router.delete("/{categoria_id}", response_model=CategoriaResponse)
def eliminar_categoria(
    categoria_id: UUID,
    permanente: bool = False,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin_user),
):
    return categoria_service.delete_categoria(
        db, categoria_id, soft_delete=not permanente
    )
