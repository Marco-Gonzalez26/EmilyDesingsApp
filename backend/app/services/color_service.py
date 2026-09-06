from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from typing import List

from app.models.models import Color
from app.schemas.schemas import ColorCreate, ColorUpdate


def get_colores(db: Session, solo_activos: bool = True) -> List[Color]:
    query = db.query(Color)
    if solo_activos:
        query = query.filter(Color.activo == True)
    return query.order_by(Color.nombre.asc()).all()


def get_color_by_id(db: Session, color_id: UUID) -> Color:
    color = db.query(Color).filter(Color.id == color_id).first()
    if not color:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Color no encontrado"
        )
    return color


def create_color(db: Session, data: ColorCreate) -> Color:
    existing = db.query(Color).filter(Color.nombre.ilike(data.nombre)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El color ya existe"
        )

    color = Color(**data.model_dump())
    db.add(color)
    db.commit()
    db.refresh(color)
    return color


def update_color(db: Session, color_id: UUID, data: ColorUpdate) -> Color:
    color = get_color_by_id(db, color_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(color, field, value)

    db.commit()
    db.refresh(color)
    return color


def delete_color(db: Session, color_id: UUID, soft_delete: bool = True) -> Color:
    color = get_color_by_id(db, color_id)

    if soft_delete:
        color.activo = False
        db.commit()
        db.refresh(color)
        return color

    db.delete(color)
    db.commit()
    return color
