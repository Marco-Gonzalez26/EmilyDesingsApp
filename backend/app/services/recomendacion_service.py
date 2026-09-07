"""
Thin service layer that calls ml/inference.py, fetches product details,
builds API responses, and writes tracking rows to recomendaciones_generadas.

recommendation_service.py
"""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.ml import inference

from sqlalchemy import func
from app.models.models import Usuario

logger = logging.getLogger(__name__)


def get_recomendaciones(db: Session, usuario_id: UUID, k: int = 15) -> List[dict]:
    """
    Get hybrid recommendations for a user.

    Returns a list of dicts with product details and scores.
    """

    from app.models.models import Producto
    from uuid import UUID

    por_categoria = (
        db.query(Producto.categoria_id, func.count(Producto.id))
        .group_by(Producto.categoria_id)
        .all()
    )
    logger.debug(f"Por categoria: {por_categoria}")

    results = inference.hybrid_recommend(usuario_id, db, k=k)
    logger.debug(f"Usuarios en la base de datos: {db.query(Usuario).count()}")

    algo = "hibrido"

    if results is None:
        results = inference.cold_start_fallback(db, limit=k)
        algo = "cold_start"

    if not results:
        return []

    from app.models.models import Producto, ImagenProducto, RecomendacionIA

    recommended = []
    for producto_id_str, score in results:
        try:
            producto_id = UUID(producto_id_str)
        except (ValueError, TypeError):
            continue

        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        if not producto or not producto.activo:
            continue

        imagen_url = None
        if producto.imagenes:
            principal = next(
                (img for img in producto.imagenes if img.es_principal), None
            )
            if principal:
                imagen_url = principal.url_imagen
            elif producto.imagenes:
                imagen_url = producto.imagenes[0].url_imagen

        cat_nombre = producto.categoria.nombre if producto.categoria else None

        recommended.append(
            {
                "producto_id": str(producto.id),
                "sku": producto.sku,
                "nombre": producto.nombre,
                "descripcion": producto.descripcion,
                "precio_regular": float(producto.precio_regular),
                "precio_descuento": (
                    float(producto.precio_descuento)
                    if producto.precio_descuento
                    else None
                ),
                "categoria": cat_nombre,
                "imagen_principal": imagen_url,
                "score": round(score, 4),
                "algoritmo": algo,
            }
        )

        row = RecomendacionIA(
            usuario_id=usuario_id,
            producto_id=producto_id,
            score=score,
            algoritmo=algo,
            razon_recomendacion=f"Recomendación {algo} (score={score:.4f})",
            fecha_generacion=datetime.utcnow(),
        )
        db.add(row)

    if recommended:
        db.commit()

    return recommended
