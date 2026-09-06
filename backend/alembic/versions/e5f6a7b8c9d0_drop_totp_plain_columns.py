"""Drop plain TOTP columns (replaced by encrypted + recovery table)

Revision ID: e5f6a7b8c9d0
Revises: d4e6f7a8c9b0
Create Date: 2026-09-04 00:00:00.000000

Limpieza trazable:
- DROP usuarios.totp_secret (VARCHAR 32 plano obsoleto, reemplazado por totp_secret_encrypted TEXT AES-256-GCM)
- DROP usuarios.totp_recovery_codes (JSONB plano obsoleto, reemplazado por tabla totp_recovery_codes con code_hash bcrypt 1 uso)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e6f7a8c9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('usuarios', 'totp_recovery_codes')
    op.drop_column('usuarios', 'totp_secret')


def downgrade() -> None:
    op.add_column('usuarios', sa.Column('totp_secret', sa.String(length=32), nullable=True))
    op.add_column('usuarios', sa.Column('totp_recovery_codes', JSONB(astext_type=sa.Text()), nullable=True))
