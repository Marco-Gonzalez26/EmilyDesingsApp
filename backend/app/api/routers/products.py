"""
Router de productos
Endpoints para gestión de productos del catálogo
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Annotated
from uuid import UUID
from decimal import Decimal
from app.db.config import get_db
from app.utils.auth_dependencies import get_current_admin_user, get_optional_user
from app.models.models import Usuario
from app.schemas.schemas import (
    ProductoCreate,
    ProductoUpdate,
    ProductoResponse,
    ProductoDetailResponse,
    ProductoListResponse,
)
from app.services import product_service
import app.services.inventory_service as inventory_service


router = APIRouter(prefix="/api/productos", tags=["Productos"])


@router.get("/", response_model=ProductoListResponse)
def listar_productos(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(20, ge=1, le=100, description="Número de registros a retornar"),
    categoria_id: Optional[UUID] = Query(None, description="Filtrar por categoría"),
    marca_id: Optional[str] = Query(
        None, description="Filtrar por una o varias marcas (UUIDs separados por coma)"
    ),
    precio_min: Optional[Decimal] = Query(None, ge=0, description="Precio mínimo"),
    precio_max: Optional[Decimal] = Query(None, ge=0, description="Precio máximo"),
    es_nuevo: Optional[bool] = Query(None, description="Filtrar productos nuevos"),
    es_oferta: Optional[bool] = Query(None, description="Filtrar productos en oferta"),
    es_destacado: Optional[bool] = Query(
        None, description="Filtrar productos destacados"
    ),
    activo: Optional[bool] = Query(
        True, description="Filtrar por estado activo/inactivo"
    ),
    search: Optional[str] = Query(
        None, description="Buscar en nombre, descripción o SKU"
    ),
    sort: Optional[str] = Query(
        None,
        description="Ordenar resultados: precio_asc, precio_desc, nuevos",
    ),
):
    """
    Listar productos con filtros y paginación

    - **skip**: Número de registros a saltar (para paginación)
    - **limit**: Número de registros a retornar (máximo 100)
    - **categoria_id**: UUID de la categoría
    - **marca_id**: UUID de la marca
    - **precio_min**: Precio mínimo
    - **precio_max**: Precio máximo
    - **es_nuevo**: true para solo productos nuevos
    - **es_oferta**: true para solo productos en oferta
    - **es_destacado**: true para solo productos destacados
    - **activo**: true para productos activos, false para inactivos
    - **search**: Texto para buscar en nombre, descripción o SKU

    Returns:
        Lista paginada de productos
    """
    marca_ids: List[UUID] = []
    if marca_id:
        marca_ids = [
            UUID(raw.strip()) for raw in marca_id.split(",") if raw.strip()
        ]

    productos, total = product_service.get_productos(
        db=db,
        skip=skip,
        limit=limit,
        categoria_id=categoria_id,
        marca_ids=marca_ids or None,
        precio_min=precio_min,
        precio_max=precio_max,
        es_nuevo=es_nuevo,
        es_oferta=es_oferta,
        es_destacado=es_destacado,
        activo=activo,
        search=search,
        ordenar=sort,
    )

    page = (skip // limit) + 1

    return {"total": total, "page": page, "page_size": limit, "productos": productos}


@router.get("/destacados", response_model=List[ProductoResponse])
def productos_destacados(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50, description="Número de productos a retornar"),
):
    """
    Obtener productos destacados

    Endpoint público para mostrar productos destacados en la página principal
    """
    productos = product_service.get_productos_destacados(db, limit)
    return productos


@router.get("/nuevos", response_model=List[ProductoResponse])
def productos_nuevos(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50, description="Número de productos a retornar"),
):
    """
    Obtener productos nuevos

    Productos marcados como nuevos, ordenados por fecha de creación
    """
    productos = product_service.get_productos_nuevos(db, limit)
    return productos


@router.get("/ofertas", response_model=List[ProductoResponse])
def productos_en_oferta(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50, description="Número de productos a retornar"),
):
    """
    Obtener productos en oferta

    Productos con precio de descuento activo
    """
    productos = product_service.get_productos_en_oferta(db, limit)
    return productos


@router.get("/{producto_id}", response_model=ProductoDetailResponse)
def obtener_producto(
    producto_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[Usuario] = Depends(get_optional_user),
):
    """
    Obtener detalle de un producto específico

    - **producto_id**: UUID del producto

    Returns:
        Información detallada del producto
    """
    producto = product_service.get_producto_by_id(db, producto_id)

    if current_user:
        from app.services.interaccion_service import registrar_interaccion
        registrar_interaccion(
            db=db,
            usuario_id=current_user.id,
            producto_id=producto_id,
            tipo_interaccion="vista",
        )

    return producto


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(
    producto_data: ProductoCreate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Crear un nuevo producto 

    - **sku**: Código único del producto
    - **nombre**: Nombre del producto
    - **descripcion**: Descripción detallada (opcional)
    - **precio_regular**: Precio normal del producto
    - **precio_descuento**: Precio con descuento (opcional)
    - **categoria_id**: UUID de la categoría (opcional)
    - **marca_id**: UUID de la marca (opcional)
    - **es_nuevo**: Marcar como producto nuevo
    - **es_oferta**: Marcar como oferta
    - **es_destacado**: Marcar como destacado

    Returns:
        Producto creado
    """
    nuevo_producto = product_service.create_producto(
        db=db, producto_data=producto_data, admin_user=current_admin
    )
    return nuevo_producto


@router.patch("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: UUID,
    producto_data: ProductoUpdate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Actualizar un producto existente (requiere permisos de administrador)

    Todos los campos son opcionales. Solo se actualizan los campos enviados.

    - **producto_id**: UUID del producto a actualizar

    Returns:
        Producto actualizado
    """
    producto_actualizado = product_service.update_producto(
        db=db,
        producto_id=producto_id,
        producto_data=producto_data,
        admin_user=current_admin,
    )
    return producto_actualizado


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    producto_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
    permanente: bool = Query(
        False, description="Eliminación permanente (true) o soft delete (false)"
    ),
):
    """
    Eliminar un producto (requiere permisos de administrador)

    Por defecto realiza soft delete (marca como inactivo).
    Si permanente=true, elimina físicamente el registro.

    - **producto_id**: UUID del producto a eliminar
    - **permanente**: true para eliminación física, false para soft delete

    Returns:
        204 No Content
    """
    product_service.delete_producto(
        db=db,
        producto_id=producto_id,
        admin_user=current_admin,
        soft_delete=not permanente,
    )
    return None


@router.get("/{producto_id}/variantes")
def obtener_variantes_producto(producto_id: UUID, db: Session = Depends(get_db)):
    """
    Obtiene tallas y colores disponibles de un producto para Quick Add Modal

    Args:
        producto_id: UUID del producto

    Returns:
        {
            "producto_id": "uuid",
            "nombre": "Vestido Elegante",
            "precio_regular": 79.99,
            "precio_descuento": 59.99,
            "imagen_principal": "url",
            "tallas_disponibles": [
                {"id": "uuid", "nombre": "S", "stock": 5}
            ],
            "colores_disponibles": [
                {"id": "uuid", "nombre": "Negro", "codigo_hex": "#000000"}
            ]
        }
    """
    producto = product_service.get_producto_by_id(db, producto_id)
    variantes = inventory_service.get_variantes_producto(db, producto_id)

    imagen_principal = None
    if producto.imagenes:
        img_principal = next(
            (img for img in producto.imagenes if img.es_principal), None
        )
        if img_principal:
            imagen_principal = img_principal.url_imagen
        elif len(producto.imagenes) > 0:
            imagen_principal = producto.imagenes[0].url_imagen

    return {
        "producto_id": str(producto.id),
        "nombre": producto.nombre,
        "precio_regular": float(producto.precio_regular),
        "precio_descuento": (
            float(producto.precio_descuento) if producto.precio_descuento else None
        ),
        "imagen_principal": imagen_principal,
        **variantes,
    }


@router.put("/{producto_id}/estilos", response_model=ProductoDetailResponse)
def actualizar_estilos_producto(
    producto_id: UUID,
    estilo_ids: List[UUID],
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Reemplaza los estilos asignados a un producto.

    - **estilo_ids**: lista de UUIDs de estilos a asignar
    """
    from app.models.models import ProductoEstilo, Estilo
    from fastapi import HTTPException

    producto = product_service.get_producto_by_id(db, producto_id)

    # Validar que todos los estilos existan
    estilos_existentes = db.query(Estilo).filter(Estilo.id.in_(estilo_ids)).all()
    if len(estilos_existentes) != len(estilo_ids):
        existentes = {str(e.id) for e in estilos_existentes}
        faltantes = [str(eid) for eid in estilo_ids if str(eid) not in existentes]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estilos no encontrados: {', '.join(faltantes)}",
        )

    # Eliminar asignaciones actuales
    db.query(ProductoEstilo).filter(ProductoEstilo.producto_id == producto_id).delete()

    # Crear nuevas asignaciones
    for estilo_id in estilo_ids:
        db.add(ProductoEstilo(producto_id=producto_id, estilo_id=estilo_id))

    db.commit()

    # Recargar producto con estilos
    from sqlalchemy.orm import joinedload
    producto = (
        db.query(type(producto))
        .options(joinedload(type(producto).imagenes), joinedload(type(producto).estilos))
        .filter(type(producto).id == producto_id)
        .first()
    )

    return producto
    

