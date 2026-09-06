from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from typing import Optional, List, Tuple
from datetime import datetime

from app.models.models import Usuario
from app.schemas.schemas import UsuarioUpdate, UsuarioCreateAdmin
from app.utils.auth_security import get_password_hash, verify_password


def get_user_by_id(db: Session, user_id: UUID) -> Usuario:
    """
    Obtener usuario por ID

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario

    Returns:
        Usuario encontrado

    Raises:
        HTTPException: Si el usuario no existe
    """
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )

    return usuario


def get_user_by_email(db: Session, email: str) -> Optional[Usuario]:
    """
    Obtener usuario por email

    Args:
        db: Sesión de base de datos
        email: Email del usuario

    Returns:
        Usuario si existe, None en caso contrario
    """
    return db.query(Usuario).filter(Usuario.email == email).first()


def update_user_profile(db: Session, user_id: UUID, data: UsuarioUpdate) -> Usuario:
    """
    Actualizar perfil de usuario

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario
        data: Datos a actualizar

    Returns:
        Usuario actualizado
    """
    usuario = get_user_by_id(db, user_id)

    # Actualizar campos si se proporcionan
    if data.nombre_completo is not None:
        usuario.nombre_completo = data.nombre_completo

    if data.telefono is not None:
        usuario.telefono = data.telefono

    if data.direccion is not None:
        usuario.direccion = data.direccion

    if data.cedula_ruc is not None:
        # Validar que la cédula/RUC no esté en uso por otro usuario
        if data.cedula_ruc:
            existing = (
                db.query(Usuario)
                .filter(Usuario.cedula_ruc == data.cedula_ruc, Usuario.id != user_id)
                .first()
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La cédula/RUC ya está registrada",
                )

        usuario.cedula_ruc = data.cedula_ruc

    db.commit()
    db.refresh(usuario)

    return usuario


def change_user_password(
    db: Session, user_id: UUID, current_password: str, new_password: str
) -> bool:
    """
    Cambiar contraseña de usuario

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario
        current_password: Contraseña actual
        new_password: Nueva contraseña

    Returns:
        True si se cambió exitosamente

    Raises:
        HTTPException: Si la contraseña actual es incorrecta
    """
    usuario = get_user_by_id(db, user_id)

    # Verificar contraseña actual
    if not verify_password(current_password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta",
        )

    # Actualizar contraseña
    usuario.password_hash = get_password_hash(new_password)

    db.commit()

    return True


def deactivate_user_account(db: Session, user_id: UUID) -> bool:
    """
    Desactivar cuenta de usuario (soft delete)

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario

    Returns:
        True si se desactivó exitosamente
    """
    usuario = get_user_by_id(db, user_id)

    usuario.activo = False

    db.commit()

    return True


def get_all_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    rol: Optional[str] = None,
    activo: Optional[bool] = None,
    search: Optional[str] = None,
) -> Tuple[List[Usuario], int]:
    """
    Obtener lista de usuarios con filtros (ADMIN)

    Args:
        db: Sesión de base de datos
        skip: Registros a saltar
        limit: Límite de registros
        rol: Filtrar por rol
        activo: Filtrar por estado activo
        search: Buscar por email o nombre

    Returns:
        Tupla (usuarios, total)
    """
    query = db.query(Usuario)

    # Filtros
    if rol:
        query = query.filter(Usuario.rol == rol)

    if activo is not None:
        query = query.filter(Usuario.activo == activo)

    if search:
        query = query.filter(
            (Usuario.email.ilike(f"%{search}%"))
            | (Usuario.nombre_completo.ilike(f"%{search}%"))
        )

    total = query.count()
    usuarios = (
        query.order_by(Usuario.fecha_registro.desc()).offset(skip).limit(limit).all()
    )

    return usuarios, total


def update_last_access(db: Session, user_id: UUID) -> None:
    """
    Actualizar fecha de último acceso

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario
    """
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()

    if usuario:
        usuario.fecha_ultimo_acceso = datetime.now()
        db.commit()


def get_user_statistics(db: Session, user_id: UUID) -> dict:
    """
    Obtener estadísticas del usuario

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario

    Returns:
        Diccionario con estadísticas
    """
    from sqlalchemy import func
    from app.models.models import Orden

    usuario = get_user_by_id(db, user_id)

    # Total de órdenes
    total_ordenes = (
        db.query(func.count(Orden.id)).filter(Orden.usuario_id == user_id).scalar() or 0
    )

    # Órdenes completadas
    ordenes_completadas = (
        db.query(func.count(Orden.id))
        .filter(
            Orden.usuario_id == user_id,
            Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]),
        )
        .scalar()
        or 0
    )

    # Total gastado
    total_gastado = (
        db.query(func.sum(Orden.total))
        .filter(
            Orden.usuario_id == user_id,
            Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]),
        )
        .scalar()
        or 0
    )

    # Última orden
    ultima_orden = (
        db.query(Orden)
        .filter(Orden.usuario_id == user_id)
        .order_by(Orden.fecha_orden.desc())
        .first()
    )

    return {
        "total_ordenes": total_ordenes,
        "ordenes_completadas": ordenes_completadas,
        "total_gastado": float(total_gastado),
        "ticket_promedio": (
            float(total_gastado / ordenes_completadas) if ordenes_completadas > 0 else 0
        ),
        "ultima_orden": (
            {
                "fecha": ultima_orden.fecha_orden.isoformat() if ultima_orden else None,
                "total": float(ultima_orden.total) if ultima_orden else 0,
            }
            if ultima_orden
            else None
        ),
    }


# app/services/user_service.py


def get_all_clientes_admin(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    activo: Optional[bool] = None,
    search: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
) -> Tuple[List[dict], int]:
    """
    Obtener lista de usuarios con estadísticas 

    Args:
        db: Sesión de base de datos
        skip: Registros a saltar
        limit: Límite de registros
        activo: Filtrar por estado activo
        search: Buscar por email o nombre
        fecha_desde: Filtrar desde fecha de registro
        fecha_hasta: Filtrar hasta fecha de registro

    Returns:
        Tupla (clientes_con_stats, total)
    """
    from sqlalchemy import func
    from app.models.models import Orden

    # Query base
    query = db.query(Usuario)

    # Filtros
    if activo is not None:
        query = query.filter(Usuario.activo == activo)

    if search:
        query = query.filter(
            (Usuario.email.ilike(f"%{search}%"))
            | (Usuario.nombre_completo.ilike(f"%{search}%"))
        )

    if fecha_desde:
        query = query.filter(Usuario.fecha_registro >= fecha_desde)

    if fecha_hasta:
        query = query.filter(Usuario.fecha_registro <= fecha_hasta)

    total = query.count()
    usuarios = (
        query.order_by(Usuario.fecha_registro.desc()).offset(skip).limit(limit).all()
    )

    # Agregar estadísticas a cada usuario
    clientes_con_stats = []
    for usuario in usuarios:
        # Total de órdenes
        total_ordenes = (
            db.query(func.count(Orden.id))
            .filter(Orden.usuario_id == usuario.id)
            .scalar()
            or 0
        )

        # Total gastado
        total_gastado = (
            db.query(func.sum(Orden.total))
            .filter(
                Orden.usuario_id == usuario.id,
                Orden.estado.in_(["Confirmado", "En Proceso", "Enviado", "Entregado"]),
            )
            .scalar()
            or 0
        )

        clientes_con_stats.append(
            {
                "id": str(usuario.id),
                "email": usuario.email,
                "nombre_completo": usuario.nombre_completo,
                "telefono": usuario.telefono,
                "rol": usuario.rol,
                "ciudad": usuario.ciudad,
                "activo": usuario.activo,
                "fecha_registro": usuario.fecha_registro.isoformat(),
                "fecha_ultimo_acceso": (
                    usuario.fecha_ultimo_acceso.isoformat()
                    if usuario.fecha_ultimo_acceso
                    else None
                ),
                "total_ordenes": total_ordenes,
                "total_gastado": float(total_gastado),
            }
        )

    return clientes_con_stats, total


def get_cliente_detail_admin(db: Session, user_id: UUID) -> dict:
    """
    Obtener detalle completo de un cliente (ADMIN)

    Args:
        db: Sesión de base de datos
        user_id: UUID del cliente

    Returns:
        Diccionario con información completa del cliente
    """
    usuario = get_user_by_id(db, user_id)


    # Obtener estadísticas
    estadisticas = get_user_statistics(db, user_id)

    return {
        "id": str(usuario.id),
        "email": usuario.email,
        "nombre_completo": usuario.nombre_completo,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
        "ciudad": usuario.ciudad,
        "cedula_ruc": usuario.cedula_ruc,
        "rol": usuario.rol,
        "activo": usuario.activo,
        "fecha_registro": usuario.fecha_registro.isoformat(),
        "fecha_ultimo_acceso": (
            usuario.fecha_ultimo_acceso.isoformat()
            if usuario.fecha_ultimo_acceso
            else None
        ),
        "estadisticas": estadisticas,
    }


def get_cliente_ordenes_admin(
    db: Session, user_id: UUID, skip: int = 0, limit: int = 10
) -> Tuple[List, int]:
    """
    Obtener órdenes de un cliente (ADMIN)

    Args:
        db: Sesión de base de datos
        user_id: UUID del cliente
        skip: Registros a saltar
        limit: Límite de registros

    Returns:
        Tupla (ordenes, total)
    """
    from app.models.models import Orden

    query = db.query(Orden).filter(Orden.usuario_id == user_id)
    total = query.count()
    ordenes = query.order_by(Orden.fecha_orden.desc()).offset(skip).limit(limit).all()

    return ordenes, total


def create_user_admin(db: Session, data: UsuarioCreateAdmin) -> Usuario:
    """
    Crear nuevo usuario (ADMIN)

    Args:
        db: Sesión de base de datos
        data: Datos del nuevo usuario

    Returns:
        Usuario creado

    Raises:
        HTTPException: Si el email ya existe
    """
    # Verificar que el email no exista
    existing = get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )

    nuevo_usuario = Usuario(
        email=data.email,
        password_hash=get_password_hash(data.password),
        nombre_completo=data.nombre_completo,
        telefono=data.telefono,
        direccion=data.direccion,
        cedula_ruc=data.cedula_ruc,
        rol=data.rol,
        ciudad=data.ciudad,
        acepta_terminos=True,
        activo=True,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario
  