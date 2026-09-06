"""Recommendations router - get personalized product recommendations."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.db.config import get_db
from app.models.models import Usuario
from app.utils.auth_dependencies import get_current_user
from app.schemas.recommendation_schema import RecomendacionResponse
from app.services import recomendacion_service
from app.ml import inference
router = APIRouter(prefix="/api/recomendaciones", tags=["Recomendaciones"])


@router.get("", response_model=List[RecomendacionResponse])
def get_recomendaciones(
    limit: int = Query(15, ge=1, le=50, description="Number of recommendations"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Get personalized product recommendations for the current user.

    Uses a hybrid model (content-based + SVD collaborative filtering).
    Falls back to featured/new products for new users with no history.
    """
    
    
    return recomendacion_service.get_recomendaciones(
        db=db,
        usuario_id=current_user.id,
        k=limit,
    )
