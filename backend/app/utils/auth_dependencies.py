"""
Dependencies compartidas para los routers
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Annotated
from uuid import UUID

from app.db.config import get_db
from app.models.models import Usuario
from app.services import auth_service
from app.utils.auth_security import decode_access_token


security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Dependency para obtener el usuario actual desde el token JWT

    Args:
        token: Token JWT del header Authorization
        db: Sesión de base de datos

    Returns:
        Usuario actual autenticado

    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = credentials.credentials
    # Decodificar token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Buscar usuario en la base de datos
    user = auth_service.get_user_by_id(db, UUID(user_id))

    if user is None:
        raise credentials_exception

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo"
        )

    return user


def get_current_admin_user(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    """
    Dependency para verificar que el usuario actual sea administrador
    por ahora opcional 2FA (no bloquea), para doc futuro obligatorio se re-activa verify
    """
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador para realizar esta acción",
        )
    # por ahora opcional: no bloquea admin sin 2FA
    return current_user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
    db: Session = Depends(get_db),
) -> Usuario | None:
    """
    Dependency para obtener el usuario actual si está autenticado,
    None si no lo está (no lanza excepción)

    Útil para endpoints públicos que pueden tener comportamiento diferente
    si el usuario está logueado

    Args:
        token: Token JWT del header Authorization (opcional)
        db: Sesión de base de datos

    Returns:
        Usuario actual o None
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload is None:
            return None

        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        user = auth_service.get_user_by_id(db, UUID(user_id))

        if user and user.activo:
            return user

        return None
    except Exception:
        return None
