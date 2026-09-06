"""Add TOTP 2FA columns to usuarios

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-09-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('totp_secret', sa.String(length=32), nullable=True))
    op.add_column('usuarios', sa.Column('totp_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('usuarios', sa.Column('totp_recovery_codes', JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'totp_recovery_codes')
    op.drop_column('usuarios', 'totp_enabled')
    op.drop_column('usuarios', 'totp_secret')
