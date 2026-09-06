from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.db.config import get_db
from app.models import Usuario
from app.schemas.preferences_schema import (
    PreferenciasCreate,
    PreferenciasUpdate,
    PreferenciasResponse,
)
from app.schemas.style_schema import EstilosDisponiblesResponse
from app.services.style_service import obtener_estilos_activos
from app.services.preferences_service import (
    obtener_preferencias_por_usuario,
    crear_preferencias,
    actualizar_preferencias,
    guardar_o_actualizar_preferencias,
    eliminar_preferencias,
)
from app.utils.auth_dependencies import get_current_user

router = APIRouter(prefix="/api/preferencias", tags=["Preferencias de Usuario"])


@router.get("/estilos-disponibles", response_model=EstilosDisponiblesResponse)
def obtener_estilos_disponibles(db: Session = Depends(get_db)):
    """
    Retorna la lista de estilos disponibles desde la BD
    Muestra solo estilos activos, ordenados
    No requiere autenticación
    """
    estilos = obtener_estilos_activos(db)

    return EstilosDisponiblesResponse(estilos=estilos, total=len(estilos))


@router.get("/mis-preferencias", response_model=Optional[PreferenciasResponse])
def obtener_mis_preferencias(
    db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene las preferencias del usuario actual
    Si no tiene preferencias, retorna None
    """
    preferencias = obtener_preferencias_por_usuario(db, current_user.id)
    return preferencias


@router.post(
    "/mis-preferencias",
    response_model=PreferenciasResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_mis_preferencias(
    preferencias_data: PreferenciasCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Crea las preferencias del usuario actual
    Si ya existen, retorna error 400
    """
    try:
        preferencias = crear_preferencias(db, current_user.id, preferencias_data)
        return preferencias
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/mis-preferencias", response_model=PreferenciasResponse)
def actualizar_mis_preferencias(
    preferencias_data: PreferenciasUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Actualiza las preferencias del usuario actual
    Solo actualiza los campos proporcionados
    """
    preferencias = actualizar_preferencias(db, current_user.id, preferencias_data)

    if not preferencias:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene preferencias. Usa POST para crear.",
        )

    return preferencias


@router.post("/guardar", response_model=PreferenciasResponse)
def guardar_preferencias(
    preferencias_data: PreferenciasCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Guarda o actualiza preferencias (upsert)
    Crea si no existen, actualiza si ya existen
    Endpoint más conveniente para el frontend
    """
    preferencias = guardar_o_actualizar_preferencias(
        db, current_user.id, preferencias_data
    )

    return preferencias


@router.delete("/mis-preferencias", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_mis_preferencias(
    db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    """
    Elimina las preferencias del usuario actual
    """
    eliminado = eliminar_preferencias(db, current_user.id)

    if not eliminado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene preferencias para eliminar",
        )

    return None
