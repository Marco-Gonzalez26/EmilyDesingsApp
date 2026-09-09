"""add unique constraint to cedula_ruc

Revision ID: 737ab16dd149
Revises: 565072fe07a4
Create Date: 2026-09-09 04:36:22

"""
from typing import Sequence, Union
from alembic import op

revision: str = '737ab16dd149'
down_revision: Union[str, Sequence[str], None] = '565072fe07a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint('uq_usuarios_cedula_ruc', 'usuarios', ['cedula_ruc'])


def downgrade() -> None:
    op.drop_constraint('uq_usuarios_cedula_ruc', 'usuarios', type_='unique')
