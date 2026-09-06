from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.models.preference_model import PreferenciasUsuario
from app.schemas.preferences_schema import PreferenciasCreate, PreferenciasUpdate


def obtener_preferencias_por_usuario(
    db: Session, usuario_id: UUID
) -> Optional[PreferenciasUsuario]:
    """
    Obtiene las preferencias de un usuario
    """
    return db.query(PreferenciasUsuario).filter_by(usuario_id=usuario_id).first()


def crear_preferencias(
    db: Session, usuario_id: UUID, preferencias_data: PreferenciasCreate
) -> PreferenciasUsuario:
    """
    Crea preferencias para un usuario

    Validaciones:
    - El usuario no debe tener preferencias ya creadas

    Raises:
        ValueError: Si el usuario ya tiene preferencias
    """
    # Validar que no existan preferencias
    existente = obtener_preferencias_por_usuario(db, usuario_id)
    if existente:
        raise ValueError("El usuario ya tiene preferencias configuradas")

    preferencias = PreferenciasUsuario(
        usuario_id=usuario_id, **preferencias_data.dict()
    )

    db.add(preferencias)
    db.commit()
    db.refresh(preferencias)

    return preferencias


def actualizar_preferencias(
    db: Session, usuario_id: UUID, preferencias_data: PreferenciasUpdate
) -> Optional[PreferenciasUsuario]:
    """
    Actualiza las preferencias de un usuario
    Solo actualiza los campos proporcionados

    Returns:
        PreferenciasUsuario actualizado o None si no existen
    """
    preferencias = obtener_preferencias_por_usuario(db, usuario_id)

    if not preferencias:
        return None

    # Actualizar solo campos proporcionados
    update_data = preferencias_data.dict(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(preferencias, campo, valor)

    db.commit()
    db.refresh(preferencias)

    return preferencias


def guardar_o_actualizar_preferencias(
    db: Session, usuario_id: UUID, preferencias_data: PreferenciasCreate
) -> PreferenciasUsuario:
    """
    Guarda o actualiza preferencias (upsert)
    Crea si no existen, actualiza si ya existen

    Este método es más conveniente para el frontend
    """
    preferencias = obtener_preferencias_por_usuario(db, usuario_id)

    if preferencias:
        # Actualizar existente
        for campo, valor in preferencias_data.dict().items():
            setattr(preferencias, campo, valor)
    else:
        # Crear nueva
        preferencias = PreferenciasUsuario(
            usuario_id=usuario_id, **preferencias_data.dict()
        )
        db.add(preferencias)

    db.commit()
    db.refresh(preferencias)

    return preferencias


def eliminar_preferencias(db: Session, usuario_id: UUID) -> bool:
    """
    Elimina las preferencias de un usuario

    Returns:
        True si se eliminaron, False si no existían
    """
    preferencias = obtener_preferencias_por_usuario(db, usuario_id)

    if not preferencias:
        return False

    db.delete(preferencias)
    db.commit()

    return True


def validar_estilos_existen(db: Session, estilo_ids: list[UUID]) -> bool:
    """
    Valida que todos los IDs de estilos existan en la BD

    Returns:
        True si todos existen, False si alguno no existe
    """
    from app.models import Estilo

    if not estilo_ids:
        return True

    count = db.query(Estilo).filter(Estilo.id.in_(estilo_ids)).count()

    return count == len(estilo_ids)


def validar_categorias_existen(db: Session, categoria_ids: list[UUID]) -> bool:
    """
    Valida que todos los IDs de categorías existan en la BD

    Returns:
        True si todos existen, False si alguno no existe
    """
    from app.models import Categoria

    if not categoria_ids:
        return True

    count = db.query(Categoria).filter(Categoria.id.in_(categoria_ids)).count()

    return count == len(categoria_ids)


def validar_colores_existen(db: Session, color_ids: list[UUID]) -> bool:
    """
    Valida que todos los IDs de colores existan en la BD

    Returns:
        True si todos existen, False si alguno no existe
    """
    from app.models import Color

    if not color_ids:
        return True

    count = db.query(Color).filter(Color.id.in_(color_ids)).count()

    return count == len(color_ids)
