from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from typing import List

from app.models.models import Talla
from app.schemas.schemas import TallaCreate, TallaUpdate


def get_tallas(db: Session, solo_activas: bool = True) -> List[Talla]:
    query = db.query(Talla)
    if solo_activas:
        query = query.filter(Talla.activo == True)
    return query.order_by(Talla.orden.asc()).all()


def get_talla_by_id(db: Session, talla_id: UUID) -> Talla:
    talla = db.query(Talla).filter(Talla.id == talla_id).first()
    if not talla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Talla no encontrada"
        )
    return talla


def create_talla(db: Session, data: TallaCreate) -> Talla:
    existing = db.query(Talla).filter(Talla.nombre.ilike(data.nombre)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="La talla ya existe"
        )

    talla = Talla(**data.model_dump())
    db.add(talla)
    db.commit()
    db.refresh(talla)
    return talla


def update_talla(db: Session, talla_id: UUID, data: TallaUpdate) -> Talla:
    talla = get_talla_by_id(db, talla_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(talla, field, value)

    db.commit()
    db.refresh(talla)
    return talla


def delete_talla(db: Session, talla_id: UUID, soft_delete: bool = True) -> Talla:
    talla = get_talla_by_id(db, talla_id)

    if soft_delete:
        talla.activo = False
        db.commit()
        db.refresh(talla)
        return talla

    db.delete(talla)
    db.commit()
    return talla
