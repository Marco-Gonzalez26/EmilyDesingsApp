
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from typing import List

from app.models.models import Categoria
from app.schemas.schemas import CategoriaCreate, CategoriaUpdate


def get_categorias(db: Session, solo_activas: bool = True) -> List[Categoria]:
    query = db.query(Categoria)

    if solo_activas:
        query = query.filter(Categoria.activo == True)

    return query.order_by(Categoria.nombre.asc()).all()

def get_categorias_activas(db: Session) -> List[Categoria]:
    return get_categorias(db, solo_activas=True)

def get_categoria_by_id(db: Session, categoria_id: UUID) -> Categoria:
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )

    return categoria


def create_categoria(db: Session, data: CategoriaCreate) -> Categoria:
    existing = db.query(Categoria).filter(Categoria.nombre.ilike(data.nombre)).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La categoría ya existe",
        )

    categoria = Categoria(**data.model_dump())
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


def update_categoria(
    db: Session, categoria_id: UUID, data: CategoriaUpdate
) -> Categoria:
    categoria = get_categoria_by_id(db, categoria_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(categoria, field, value)

    db.commit()
    db.refresh(categoria)
    return categoria


def delete_categoria(
    db: Session, categoria_id: UUID, soft_delete: bool = True
) -> Categoria:
    categoria = get_categoria_by_id(db, categoria_id)

    if soft_delete:
        categoria.activo = False
        db.commit()
        db.refresh(categoria)
        return categoria

    db.delete(categoria)
    db.commit()
    return categoria
