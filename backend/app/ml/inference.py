"""

inference.py

Recomendación híbrida: content-based + SVD collaborative filtering.

El modelo .joblib se entrena externamente en Google Colab y se carga aquí
para inferencia. No hay pipeline de reentrenamiento en este backend.

Contract del artifact (keys del dict):
  modelo_knn, matriz_productos, producto_ids_ordenados, estilos_ids,
  categorias_ids, colores_ids, bins_precio, etiquetas_bins_precio,
  pesos_interaccion, k_optimo, metric_optima, svd_modelo,
  factores_usuario, factores_producto, usuario_idx_map, n_factores_svd,
  alpha_hibrido, metricas_evaluacion, entrenado_con, version,
  fecha_entrenamiento, vida_media_dias (opcional, default=None=sin decaimiento)
"""

import os
import logging
import numpy as np
import joblib
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import math
logger = logging.getLogger(__name__)

_artifact: Optional[dict] = None


def load_model():
    """Load the recommendation artifact once at startup."""
    global _artifact
    print(">>> load_model() EJECUTANDO")
    model_path = os.getenv(
        "RECOMMENDATION_MODEL_PATH",
        os.path.join(os.path.dirname(__file__), "artifacts", "modelo_recomendacion.joblib"),
    )
    print(">>> model_path resuelto:", model_path)
    print(">>> existe?:", os.path.exists(model_path))
    if not os.path.exists(model_path):
        logger.warning(f"Recommendation model not found at {model_path}. Cold-start only.")
        _artifact = None
        return
    _artifact = joblib.load(model_path)
    print(">>> CARGADO OK. version:", _artifact.get("version"), "| vida_media_dias:", _artifact.get("vida_media_dias"))
    logger.info(
        f"Recommendation model loaded (version={_artifact.get('version')}, "
        f"fecha={_artifact.get('fecha_entrenamiento')})"
    )


def get_artifact() -> Optional[dict]:
    return _artifact


def _build_user_content_vector(usuario_id, db) -> Optional[np.ndarray]:
    """Build a content-based user vector from preferences + weighted interactions."""
    if _artifact is None:
        return None

    from app.models.preference_model import PreferenciasUsuario
    from app.models.models import Inventario

    estilos_ids = _artifact["estilos_ids"]
    categorias_ids = _artifact["categorias_ids"]
    colores_ids = _artifact["colores_ids"]
    bins_precio = _artifact["bins_precio"]
    pesos = _artifact["pesos_interaccion"]

    n_estilos = len(estilos_ids)
    n_categorias = len(categorias_ids)
    n_colores = len(colores_ids)
    n_precio_bins = len(_artifact["etiquetas_bins_precio"])
    vector_len = n_estilos + n_categorias + n_colores + n_precio_bins + 1 

    vector = np.zeros(vector_len, dtype=np.float64)

    prefs = db.query(PreferenciasUsuario).filter_by(usuario_id=usuario_id).first()

    if prefs:
        if prefs.estilos_preferidos:
            for estilo_id in prefs.estilos_preferidos:
                estilo_str = str(estilo_id)
                if estilo_str in estilos_ids:
                    idx = estilos_ids.index(estilo_str)
                    vector[idx] += 1.0

        if prefs.categorias_favoritas:
            for cat_id in prefs.categorias_favoritas:
                cat_str = str(cat_id)
                if cat_str in categorias_ids:
                    idx = n_estilos + categorias_ids.index(cat_str)
                    vector[idx] += 1.0

        if prefs.colores_preferidos:
            for color_id in prefs.colores_preferidos:
                color_str = str(color_id)
                if color_str in colores_ids:
                    idx = n_estilos + n_categorias + colores_ids.index(color_str)
                    vector[idx] += 1.0

        if prefs.rango_precio_min is not None or prefs.rango_precio_max is not None:
            pmin = prefs.rango_precio_min or 0
            pmax = prefs.rango_precio_max or float("inf")
            for i in range(len(bins_precio) - 1):
                bin_lo, bin_hi = bins_precio[i], bins_precio[i + 1]
                if bin_lo < pmax and bin_hi > pmin:
                    idx = n_estilos + n_categorias + n_colores + i
                    vector[idx] += 1.0

    from app.models.models import InteraccionUsuario
    interactions = (
        db.query(InteraccionUsuario)
        .filter(InteraccionUsuario.usuario_id == usuario_id)
        .all()
    )

    vida_media_dias = _artifact.get("vida_media_dias")

    for inter in interactions:
        weight = pesos.get(inter.tipo_interaccion, 1.0)

        if vida_media_dias is not None and inter.fecha_interaccion is not None:
            dias_transcurridos = (datetime.now() - inter.fecha_interaccion).days
            dias_transcurridos = max(dias_transcurridos, 0)
            weight *= math.exp(-dias_transcurridos / vida_media_dias)
            
        producto = inter.producto_id
        from app.models.models import Producto, ProductoEstilo
        prod = db.query(Producto).filter(Producto.id == producto).first()
        if not prod:
            continue

        if prod.categoria_id:
            cat_str = str(prod.categoria_id)
            if cat_str in categorias_ids:
                idx = n_estilos + categorias_ids.index(cat_str)
                vector[idx] += weight

        precio = float(prod.precio_descuento or prod.precio_regular)
        for i in range(len(bins_precio) - 1):
            if bins_precio[i] <= precio < bins_precio[i + 1]:
                idx = n_estilos + n_categorias + n_colores + i
                vector[idx] += weight
                break

        prod_estilos = (
            db.query(ProductoEstilo)
            .filter(ProductoEstilo.producto_id == producto)
            .all()
        )
        for pe in prod_estilos:
            estilo_str = str(pe.estilo_id)
            if estilo_str in estilos_ids:
                idx = estilos_ids.index(estilo_str)
                vector[idx] += weight

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector


def _min_max_normalize(arr: np.ndarray) -> np.ndarray:
    mn, mx = arr.min(), arr.max()
    if mx - mn < 1e-10:
        return np.zeros_like(arr)
    return (arr - mn) / (mx - mn)


def hybrid_recommend(usuario_id, db, k: int = None) -> list:
    """
    Return top-k (producto_id, score) tuples for a user.

    If user is unknown or has no signal, returns None (caller should cold-start).
    """
    if _artifact is None:
        return None

    if k is None:
        k = _artifact["k_optimo"]

    user_vector = _build_user_content_vector(usuario_id, db)
    if user_vector is None or np.all(user_vector == 0):
        return None

    matriz = _artifact["matriz_productos"]
    knn = _artifact["modelo_knn"]
    producto_ids = _artifact["producto_ids_ordenados"]
    alpha = _artifact["alpha_hibrido"]

    distancias, indices = knn.kneighbors(user_vector.reshape(1, -1), n_neighbors=min(k * 2, len(producto_ids)))

    content_scores = np.zeros(len(producto_ids), dtype=np.float64)
    for rank, idx in enumerate(indices[0]):
        if idx < len(producto_ids):
            content_scores[idx] = 1.0 / (1.0 + distancias[0][rank])

    user_idx_map = _artifact["usuario_idx_map"]
    usuario_str = str(usuario_id)

    if usuario_str in user_idx_map:
        uidx = user_idx_map[usuario_str]
        factores_producto = _artifact["factores_producto"]
        factores_usuario = _artifact["factores_usuario"]
        svd_scores = factores_producto @ factores_usuario[uidx]
        content_norm = _min_max_normalize(content_scores)
        svd_norm = _min_max_normalize(svd_scores)
        final_scores = alpha * content_norm + (1 - alpha) * svd_norm
    else:
        final_scores = _min_max_normalize(content_scores)

    ranked_indices = np.argsort(final_scores)[::-1][:k]
    results = []
    for idx in ranked_indices:
        if idx < len(producto_ids) and final_scores[idx] > 0:
            results.append((producto_ids[idx], float(final_scores[idx])))

    return results


def cold_start_fallback(db, limit: int = 15) -> list:
    """Return featured/new products with stock as cold-start recommendations."""
    from app.models.models import Producto, Inventario

    productos = (
        db.query(Producto)
        .filter(Producto.activo == True)
        .filter((Producto.es_destacado == True) | (Producto.es_nuevo == True))
        .order_by(Producto.fecha_creacion.desc())
        .limit(limit * 2)
        .all()
    )

    result = []
    seen = set()
    for p in productos:
        if p.id in seen:
            continue
        stock = (
            db.query(
                func.coalesce(func.sum(Inventario.stock - Inventario.stock_reservado), 0)
            )
            .filter(Inventario.producto_id == p.id)
            .scalar()
        )
        if stock is not None and stock > 0:
            result.append((str(p.id), 0.5))
            seen.add(p.id)
        if len(result) >= limit:
            break

    return result
