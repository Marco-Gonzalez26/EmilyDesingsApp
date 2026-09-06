"""
Service for recording user interactions with products.
These interactions feed the recommendation model.
"""

from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.models import InteraccionUsuario


def registrar_interaccion(
    db: Session,
    usuario_id: UUID,
    producto_id: UUID,
    tipo_interaccion: str,
    duracion_segundos: float = None,
    metadata_json: dict = None,
) -> InteraccionUsuario:
    """
    Record a user interaction with a product.

    Args:
        db: Database session
        usuario_id: User UUID
        producto_id: Product UUID
        tipo_interaccion: One of vista, clic, agregar_carrito, agregar_favorito, compra, busqueda
        duracion_segundos: Optional duration for view interactions
        metadata_json: Optional additional metadata

    Returns:
        The created InteraccionUsuario record
    """
    interaccion = InteraccionUsuario(
        usuario_id=usuario_id,
        producto_id=producto_id,
        tipo_interaccion=tipo_interaccion,
        duracion_segundos=duracion_segundos,
        metadata_json=metadata_json,
        fecha_interaccion=datetime.utcnow(),
    )
    db.add(interaccion)
    db.commit()
    return interaccion
