from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.db.config import get_db
from app.utils.auth_dependencies import get_current_user, get_current_admin_user
from app.models.models import Usuario
from uuid import UUID
from app.schemas.schemas import UsuarioResponse, UsuarioUpdate, UsuarioCreateAdmin
from app.services import user_service

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


@router.get("/me", response_model=UsuarioResponse)
def get_current_user_profile(current_user: Usuario = Depends(get_current_user)):
    """Obtener perfil del usuario actual"""
    return current_user


@router.put("/me", response_model=UsuarioResponse)
def update_current_user_profile(
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Actualizar perfil del usuario actual"""
    return user_service.update_user_profile(db, current_user.id, data)


@router.delete("/me")
def delete_current_user_account(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Eliminar cuenta del usuario actual (soft delete)"""
    user_service.deactivate_user_account(db, current_user.id)
    return {"message": "Cuenta eliminada exitosamente"}


@router.get("/me/estadisticas")
def get_current_user_statistics(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener estadísticas del usuario actual"""
    return user_service.get_user_statistics(db, current_user.id)


@router.get("/admin/all")
def get_all_users_admin(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    rol: Optional[str] = Query(default=None),
    activo: Optional[bool] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener todos los usuarios (SOLO ADMIN)"""
    usuarios, total = user_service.get_all_users(
        db=db, skip=skip, limit=limit, rol=rol, activo=activo, search=search
    )

    return {"usuarios": usuarios, "total": total, "skip": skip, "limit": limit}


@router.get("/admin/{user_id}", response_model=UsuarioResponse)
def get_user_by_id_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener usuario por ID (SOLO ADMIN)"""
    from uuid import UUID

    return user_service.get_user_by_id(db, UUID(user_id))


@router.get("/admin/{user_id}/estadisticas")
def get_user_statistics_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener estadísticas de un usuario (SOLO ADMIN)"""


    return user_service.get_user_statistics(db, UUID(user_id))


@router.get("/admin/clientes/all")
def get_all_clientes_admin(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    activo: Optional[bool] = Query(default=None),
    search: Optional[str] = Query(default=None),
    fecha_desde: Optional[datetime] = Query(default=None),
    fecha_hasta: Optional[datetime] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener lista de clientes con estadísticas (SOLO ADMIN)"""

    clientes, total = user_service.get_all_clientes_admin(
        db=db,
        skip=skip,
        limit=limit,
        activo=activo,
        search=search,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )

    return {"clientes": clientes, "total": total, "skip": skip, "limit": limit}


@router.get("/admin/clientes/{cliente_id}/detalle")
def get_cliente_detail_admin(
    cliente_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener detalle completo de un cliente (SOLO ADMIN)"""
    return user_service.get_cliente_detail_admin(db, UUID(cliente_id))


@router.get("/admin/clientes/{cliente_id}/ordenes")
def get_cliente_ordenes_admin(
    cliente_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener órdenes de un cliente"""

    ordenes, total = user_service.get_cliente_ordenes_admin(
        db, UUID(cliente_id), skip, limit
    )

    return {"ordenes": ordenes, "total": total, "skip": skip, "limit": limit}


@router.post("/admin/crear", response_model=UsuarioResponse)
def create_user_admin(
    data: UsuarioCreateAdmin,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Crear nuevo usuario (SOLO ADMIN)"""
    return user_service.create_user_admin(db, data)


@router.put("/admin/{user_id}/actualizar", response_model=UsuarioResponse)
def update_user_admin(
    user_id: str,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Actualizar usuario (SOLO ADMIN)"""
    return user_service.update_user_profile(db, UUID(user_id), data)


@router.patch("/admin/{user_id}/estado", response_model=UsuarioResponse)
def toggle_user_activo_admin(
    user_id: str,
    activo: bool,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Activar o desactivar un usuario (SOLO ADMIN, no a sí mismo)"""
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta",
        )
    return user_service.set_user_activo(db, UUID(user_id), activo)
