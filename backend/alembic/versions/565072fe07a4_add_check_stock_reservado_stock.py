"""add CHECK stock_reservado <= stock

Revision ID: 565072fe07a4
Revises: f6a7b8c9d0e1
Create Date: 2026-09-09 03:10:15.914110

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '565072fe07a4'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "inventario_reserva_check",
        "inventario",
        "stock_reservado <= stock",
    )


def downgrade() -> None:
    op.drop_constraint("inventario_reserva_check", "inventario", type_="check")
