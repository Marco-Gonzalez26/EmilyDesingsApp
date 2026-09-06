"""Favorites router - add/remove/list favorite products."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.config import get_db
from app.models.models import Usuario, Favorito, Producto
from app.utils.auth_dependencies import get_current_user
from app.schemas.recommendation_schema import FavoritoCreate, FavoritoResponse
from app.services.interaccion_service import registrar_interaccion

router = APIRouter(prefix="/api/favoritos", tags=["Favoritos"])


@router.get("", response_model=list[FavoritoResponse])
def listar_favoritos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """List all favorites for the current user."""
    favoritos = (
        db.query(Favorito)
        .filter(Favorito.usuario_id == current_user.id)
        .order_by(Favorito.fecha_agregado.desc())
        .all()
    )
    return favoritos


@router.post("", response_model=FavoritoResponse, status_code=status.HTTP_201_CREATED)
def agregar_favorito(
    data: FavoritoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Add a product to favorites."""
    producto = db.query(Producto).filter(Producto.id == data.producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )

    existing = (
        db.query(Favorito)
        .filter(
            Favorito.usuario_id == current_user.id,
            Favorito.producto_id == data.producto_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El producto ya está en favoritos",
        )

    favorito = Favorito(
        usuario_id=current_user.id,
        producto_id=data.producto_id,
    )
    db.add(favorito)
    db.commit()
    db.refresh(favorito)

    registrar_interaccion(
        db=db,
        usuario_id=current_user.id,
        producto_id=data.producto_id,
        tipo_interaccion="agregar_favorito",
    )

    return favorito


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_favorito(
    producto_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Remove a product from favorites."""
    favorito = (
        db.query(Favorito)
        .filter(
            Favorito.usuario_id == current_user.id,
            Favorito.producto_id == producto_id,
        )
        .first()
    )
    if not favorito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El producto no está en favoritos",
        )

    from app.models.models import InteraccionUsuario

    db.delete(favorito)
    # borrar peso fantasma: las agregar_favorito de este usuario+producto
    db.query(InteraccionUsuario).filter(
        InteraccionUsuario.usuario_id == current_user.id,
        InteraccionUsuario.producto_id == producto_id,
        InteraccionUsuario.tipo_interaccion == "agregar_favorito",
    ).delete(synchronize_session=False)
    db.commit()
