from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.config import get_db
from app.models import Usuario
from app.schemas.style_schema import EstiloCreate, EstiloUpdate, EstiloResponse
from app.services.style_service import (
    obtener_todos_estilos,
    obtener_estilo_por_id,
    crear_estilo,
    actualizar_estilo,
    eliminar_estilo,
    toggle_activo_estilo,
)
from app.utils.auth_dependencies import get_current_admin_user

router = APIRouter(prefix="/api/estilos", tags=["Estilos"])


@router.get("", response_model=List[EstiloResponse])
def listar_estilos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    activo: bool = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Lista todos los estilos con paginación
    Puede filtrar por estado activo
    """
    estilos = obtener_todos_estilos(db, skip, limit, activo)
    return estilos


@router.get("/{estilo_id}", response_model=EstiloResponse)
def obtener_estilo(
    estilo_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Obtiene un estilo por ID
    """
    estilo = obtener_estilo_por_id(db, estilo_id)

    if not estilo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estilo con ID {estilo_id} no encontrado",
        )

    return estilo


@router.post("", response_model=EstiloResponse, status_code=status.HTTP_201_CREATED)
def crear_nuevo_estilo(
    estilo_data: EstiloCreate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Crea un nuevo estilo
    El nombre debe ser único
    """
    try:
        estilo = crear_estilo(db, estilo_data)
        return estilo
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{estilo_id}", response_model=EstiloResponse)
def actualizar_estilo_existente(
    estilo_id: UUID,
    estilo_data: EstiloUpdate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Actualiza un estilo existente
    Solo actualiza los campos proporcionados
    """
    try:
        estilo = actualizar_estilo(db, estilo_id, estilo_data)

        if not estilo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estilo con ID {estilo_id} no encontrado",
            )

        return estilo
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{estilo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_estilo_existente(
    estilo_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Elimina un estilo
    NOTA: Esto puede afectar preferencias de usuarios
    """
    eliminado = eliminar_estilo(db, estilo_id)

    if not eliminado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estilo con ID {estilo_id} no encontrado",
        )

    return None


@router.patch("/{estilo_id}/toggle-activo", response_model=EstiloResponse)
def toggle_activo_estilo_endpoint(
    estilo_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Activa o desactiva un estilo
    Útil para deshabilitar temporalmente sin eliminar
    """
    estilo = toggle_activo_estilo(db, estilo_id)

    if not estilo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estilo con ID {estilo_id} no encontrado",
        )

    return estilo
