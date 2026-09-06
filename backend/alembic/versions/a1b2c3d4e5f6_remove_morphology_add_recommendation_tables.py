"""Remove morphology, add recommendation foundation tables

Revision ID: a1b2c3d4e5f6
Revises: 36df4e1c8fea
Create Date: 2026-08-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '36df4e1c8fea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === Migration A: Drop old morphology tables ===
    op.execute("DROP TABLE IF EXISTS recomendaciones_generadas CASCADE")
    op.execute("DROP TABLE IF EXISTS reglas_recomendacion CASCADE")
    op.execute("DROP TABLE IF EXISTS analisis_morfologico CASCADE")
    op.execute("DROP TABLE IF EXISTS producto_etiquetas_morfologicas CASCADE")

    # === Migration B: New recommendation foundation tables ===

    # 1. interacciones_usuario
    op.create_table(
        'interacciones_usuario',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('usuario_id', UUID(as_uuid=True), sa.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('producto_id', UUID(as_uuid=True), sa.ForeignKey('productos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tipo_interaccion', sa.String(30), nullable=False),
        sa.Column('duracion_segundos', sa.Float, nullable=True),
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('fecha_interaccion', sa.DateTime, server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(
            "tipo_interaccion IN ('vista', 'clic', 'agregar_carrito', 'agregar_favorito', 'compra', 'busqueda')",
            name='interacciones_usuario_tipo_check'
        ),
    )
    op.create_index('ix_interacciones_usuario_usuario_fecha', 'interacciones_usuario', ['usuario_id', 'fecha_interaccion'])
    op.create_index('ix_interacciones_usuario_producto', 'interacciones_usuario', ['producto_id'])

    # 2. favoritos
    op.create_table(
        'favoritos',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('usuario_id', UUID(as_uuid=True), sa.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('producto_id', UUID(as_uuid=True), sa.ForeignKey('productos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('creado_en', sa.DateTime, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint('usuario_id', 'producto_id', name='uq_favoritos_usuario_producto'),
    )

    # 3. producto_estilos (bridge table)
    op.create_table(
        'producto_estilos',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('producto_id', UUID(as_uuid=True), sa.ForeignKey('productos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('estilo_id', UUID(as_uuid=True), sa.ForeignKey('estilos.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('producto_id', 'estilo_id', name='uq_producto_estilo'),
    )

    # 4. recomendaciones_generadas (redesigned)
    op.create_table(
        'recomendaciones_generadas',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('usuario_id', UUID(as_uuid=True), sa.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('producto_id', UUID(as_uuid=True), sa.ForeignKey('productos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('score', sa.Float, nullable=False),
        sa.Column('algoritmo', sa.String(30), nullable=False),
        sa.Column('razon_recomendacion', sa.Text, nullable=True),
        sa.Column('fecha_generacion', sa.DateTime, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index('ix_recomendaciones_generadas_usuario_fecha', 'recomendaciones_generadas', ['usuario_id', 'fecha_generacion'])

    # 5. Extend preferencias_usuario with missing fields
    op.add_column('preferencias_usuario', sa.Column('tallas_preferidas', ARRAY(UUID(as_uuid=True), dimensions=1), server_default='{}'))
    op.add_column('preferencias_usuario', sa.Column('rango_precio_min', sa.Float, nullable=True))
    op.add_column('preferencias_usuario', sa.Column('rango_precio_max', sa.Float, nullable=True))


def downgrade() -> None:
    # Revert preferencias_usuario extensions
    op.drop_column('preferencias_usuario', 'rango_precio_max')
    op.drop_column('preferencias_usuario', 'rango_precio_min')
    op.drop_column('preferencias_usuario', 'tallas_preferidas')

    # Drop new tables
    op.drop_index('ix_recomendaciones_generadas_usuario_fecha', table_name='recomendaciones_generadas')
    op.drop_table('recomendaciones_generadas')
    op.drop_table('producto_estilos')
    op.drop_table('favoritos')
    op.drop_index('ix_interacciones_usuario_producto', table_name='interacciones_usuario')
    op.drop_index('ix_interacciones_usuario_usuario_fecha', table_name='interacciones_usuario')
    op.drop_table('interacciones_usuario')

    # Recreate old morphology tables
    op.create_table(
        'producto_etiquetas_morfologicas',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('producto_id', UUID(as_uuid=True), sa.ForeignKey('productos.id', ondelete='CASCADE')),
        sa.Column('tipo_cuerpo', sa.String(50)),
        sa.Column('created_at', sa.DateTime, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.CheckConstraint(
            "tipo_cuerpo IN ('Triangulo', 'Triangulo Invertido', 'Rectangulo', 'Reloj de Arena', 'Ovalo')",
            name='producto_etiquetas_morfologicas_tipo_cuerpo_check'
        ),
        sa.UniqueConstraint('producto_id', 'tipo_cuerpo', name='producto_etiquetas_morfologicas_producto_id_tipo_cuerpo_key'),
    )
    op.create_table(
        'analisis_morfologico',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('usuario_id', UUID(as_uuid=True), sa.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tipo_cuerpo_detectado', sa.String(50), nullable=False),
        sa.Column('confianza', sa.Numeric(3, 2)),
        sa.Column('fecha_analisis', sa.DateTime, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        'reglas_recomendacion',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('tipo_cuerpo', sa.String(50), nullable=False),
        sa.Column('categoria_id', UUID(as_uuid=True), sa.ForeignKey('categorias.id', ondelete='CASCADE'), nullable=False),
        sa.Column('prioridad', sa.Integer, nullable=False),
        sa.Column('razon', sa.Text, nullable=False),
        sa.Column('evitar', sa.Boolean, default=False),
        sa.Column('activo', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        'recomendaciones_generadas',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column('analisis_id', UUID(as_uuid=True), sa.ForeignKey('analisis_morfologico.id', ondelete='CASCADE'), nullable=False),
        sa.Column('producto_id', UUID(as_uuid=True), sa.ForeignKey('productos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('razon_ia', sa.Text),
        sa.Column('palabras_clave', ARRAY(sa.String)),
        sa.Column('score', sa.Integer),
        sa.Column('posicion', sa.Integer),
        sa.Column('fue_clickeado', sa.Boolean, default=False),
        sa.Column('fue_agregado_carrito', sa.Boolean, default=False),
        sa.Column('fecha_creacion', sa.DateTime, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
