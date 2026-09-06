"""Add TOTP encrypted secret and recovery codes table (1 uso)

Revision ID: d4e6f7a8c9b0
Revises: c4d5e6f7a8b9
Create Date: 2026-09-04 00:00:00.000000

Explicación de campos:
- usuarios.totp_secret_encrypted TEXT NULL: secreto Base32 cifrado AES-256-GCM (nonce 12B + tag 16B + ct) base64. NULL hasta enable. No texto plano.
- totp_recovery_codes tabla: códigos backup 1 uso, code_hash TEXT bcrypt hash (no plano), usado BOOLEAN, usuario_id FK CASCADE
- usuarios.totp_recovery_codes JSONB deprecated: se migra a tabla, luego drop
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'd4e6f7a8c9b0'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    # 1. Columna cifrada
    op.add_column('usuarios', sa.Column('totp_secret_encrypted', sa.Text(), nullable=True))
    # 2. Tabla recovery 1 uso
    op.create_table('totp_recovery_codes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('usuario_id', UUID(as_uuid=True), sa.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code_hash', sa.Text(), nullable=False),
        sa.Column('usado', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index('ix_recovery_usuario', 'totp_recovery_codes', ['usuario_id'])


def downgrade() -> None:
    op.drop_index('ix_recovery_usuario', table_name='totp_recovery_codes')
    op.drop_table('totp_recovery_codes')
    op.drop_column('usuarios', 'totp_secret_encrypted')
