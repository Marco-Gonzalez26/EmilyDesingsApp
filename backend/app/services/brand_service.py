from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from typing import List

from app.models.models import Marca
from app.schemas.schemas import MarcaCreate, MarcaUpdate


def get_marcas(db: Session, solo_activas: bool = True) -> List[Marca]:
    query = db.query(Marca)

    if solo_activas:
        query = query.filter(Marca.activo == True)

    return query.order_by(Marca.nombre.asc()).all()


def get_marcas_activas(db: Session) -> List[Marca]:
    return get_marcas(db, solo_activas=True)


def get_marca_by_id(db: Session, marca_id: UUID) -> Marca:
    marca = db.query(Marca).filter(Marca.id == marca_id).first()

    if not marca:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marca no encontrada",
        )

    return marca


def create_marca(db: Session, data: MarcaCreate) -> Marca:
    existing = db.query(Marca).filter(Marca.nombre.ilike(data.nombre)).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La marca ya existe",
        )

    marca = Marca(**data.model_dump())
    db.add(marca)
    db.commit()
    db.refresh(marca)
    return marca


def update_marca(db: Session, marca_id: UUID, data: MarcaUpdate) -> Marca:
    marca = get_marca_by_id(db, marca_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(marca, field, value)

    db.commit()
    db.refresh(marca)
    return marca


def delete_marca(db: Session, marca_id: UUID, soft_delete: bool = True) -> Marca:
    marca = get_marca_by_id(db, marca_id)

    if soft_delete:
        marca.activo = False
        db.commit()
        db.refresh(marca)
        return marca

    db.delete(marca)
    db.commit()
    return marca
