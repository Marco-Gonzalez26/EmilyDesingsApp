
from sqlalchemy import Column, String, ARRAY, ForeignKey, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models import Base  
class PreferenciasUsuario(Base):
    __tablename__ = "preferencias_usuario"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    estilos_preferidos = Column(ARRAY(UUID(as_uuid=True)), default=list)
    categorias_favoritas = Column(ARRAY(UUID(as_uuid=True)), default=list)
    colores_preferidos = Column(ARRAY(UUID(as_uuid=True)), default=list)
    evitar_categorias = Column(ARRAY(UUID(as_uuid=True)), default=list)
    tallas_preferidas = Column(ARRAY(UUID(as_uuid=True)), default=list)
    rango_precio_min = Column(Float, nullable=True)
    rango_precio_max = Column(Float, nullable=True)

    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="preferencias")

    def __repr__(self):
        return f"<PreferenciasUsuario(usuario_id={self.usuario_id})>"


