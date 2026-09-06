"""Allow NULL producto_id in interacciones_usuario (for busqueda by query)

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-04 00:00:00.000000

- interacciones_usuario.producto_id NULL para tipo='busqueda' (query en metadata_json)
- resto de tipos siguen requiriendo producto_id (validado en POST /api/interacciones)
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE interacciones_usuario ALTER COLUMN producto_id DROP NOT NULL')


def downgrade() -> None:
    op.execute('DELETE FROM interacciones_usuario WHERE producto_id IS NULL')
    op.execute('ALTER TABLE interacciones_usuario ALTER COLUMN producto_id SET NOT NULL')
