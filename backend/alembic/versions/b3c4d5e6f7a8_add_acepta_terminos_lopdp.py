"""Add acepta_terminos LOPDP column to usuarios

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-09-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('acepta_terminos', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    # Existentes: LOPDP consentimiento retroactivo
    op.execute("UPDATE usuarios SET acepta_terminos = true")


def downgrade() -> None:
    op.drop_column('usuarios', 'acepta_terminos')
