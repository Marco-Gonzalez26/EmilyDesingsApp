from sqlalchemy import Column, String, ARRAY, ForeignKey, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models import Base


class Estilo(Base):
    """
    Estilos disponibles para preferencias
    Administrable por el admin (CRUD en panel)
    """

    __tablename__ = "estilos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    orden = Column(Integer, default=0)

    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Estilo(nombre={self.nombre})>"
