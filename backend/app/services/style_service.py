from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.models.style_model import Estilo
from app.schemas.style_schema import EstiloCreate, EstiloUpdate


def obtener_todos_estilos(
    db: Session, skip: int = 0, limit: int = 100, activo: Optional[bool] = None
) -> List[Estilo]:
    """
    Obtiene todos los estilos con paginación y filtros opcionales
    """
    query = db.query(Estilo)

    if activo is not None:
        query = query.filter_by(activo=activo)

    return query.order_by(Estilo.orden).offset(skip).limit(limit).all()


def obtener_estilos_activos(db: Session) -> List[Estilo]:
    """
    Obtiene solo los estilos activos ordenados
    Usado para mostrar opciones a usuarios
    """
    return db.query(Estilo).filter_by(activo=True).order_by(Estilo.orden).all()


def obtener_estilo_por_id(db: Session, estilo_id: UUID) -> Optional[Estilo]:
    """
    Obtiene un estilo por su ID
    """
    return db.query(Estilo).filter_by(id=estilo_id).first()


def obtener_estilo_por_nombre(db: Session, nombre: str) -> Optional[Estilo]:
    """
    Obtiene un estilo por su nombre
    """
    return db.query(Estilo).filter_by(nombre=nombre).first()


def crear_estilo(db: Session, estilo_data: EstiloCreate) -> Estilo:
    """
    Crea un nuevo estilo

    Validaciones:
    - El nombre debe ser único

    Raises:
        ValueError: Si el nombre ya existe
    """
    # Validar nombre único
    existente = obtener_estilo_por_nombre(db, estilo_data.nombre)
    if existente:
        raise ValueError(f"Ya existe un estilo con el nombre '{estilo_data.nombre}'")

    estilo = Estilo(**estilo_data.dict())

    db.add(estilo)
    db.commit()
    db.refresh(estilo)

    return estilo


def actualizar_estilo(
    db: Session, estilo_id: UUID, estilo_data: EstiloUpdate
) -> Optional[Estilo]:
    """
    Actualiza un estilo existente

    Validaciones:
    - Si se cambia el nombre, debe ser único

    Raises:
        ValueError: Si el nuevo nombre ya existe
    """
    estilo = obtener_estilo_por_id(db, estilo_id)

    if not estilo:
        return None

    # Validar nombre único si se está cambiando
    if estilo_data.nombre and estilo_data.nombre != estilo.nombre:
        existente = obtener_estilo_por_nombre(db, estilo_data.nombre)
        if existente:
            raise ValueError(
                f"Ya existe un estilo con el nombre '{estilo_data.nombre}'"
            )

    # Actualizar solo campos proporcionados
    update_data = estilo_data.dict(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(estilo, campo, valor)

    db.commit()
    db.refresh(estilo)

    return estilo


def eliminar_estilo(db: Session, estilo_id: UUID) -> tuple[bool, int]:
    """
    Elimina un estilo si no tiene productos asociados.

    Returns:
        (True, 0) si se eliminó
        (False, count) si tiene productos vinculados (count = cantidad)
        (False, 0) si no existía
    """
    from app.models.models import ProductoEstilo

    estilo = obtener_estilo_por_id(db, estilo_id)

    if not estilo:
        return False, 0

    count = db.query(ProductoEstilo).filter(ProductoEstilo.estilo_id == estilo_id).count()
    if count > 0:
        return False, count

    db.delete(estilo)
    db.commit()

    return True, 0


def toggle_activo_estilo(db: Session, estilo_id: UUID) -> Optional[Estilo]:
    """
    Activa o desactiva un estilo
    """
    estilo = obtener_estilo_por_id(db, estilo_id)

    if not estilo:
        return None

    estilo.activo = not estilo.activo

    db.commit()
    db.refresh(estilo)

    return estilo


def contar_total_estilos(db: Session, activo: Optional[bool] = None) -> int:
    """
    Cuenta el total de estilos
    """
    query = db.query(Estilo)

    if activo is not None:
        query = query.filter_by(activo=activo)

    return query.count()
