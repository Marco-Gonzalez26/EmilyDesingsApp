from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from fastapi.responses import StreamingResponse
from app.services.pdf_service import generar_pdf_orden
from app.db.config import get_db
from app.utils.auth_dependencies import get_current_user, get_current_admin_user
from datetime import datetime
from app.models.models import Usuario
from app.schemas.schemas import (
    OrdenCreate,
    OrdenResponse,
    StripeCheckoutRequest,
    StripeCheckoutResponse,
    EstadisticasOrdenesResponse,
    OrdenEstadoUpdate,
)
from app.services import order_service

router = APIRouter(prefix="/api/ordenes", tags=["Órdenes"])


@router.post("/", response_model=OrdenResponse, status_code=status.HTTP_201_CREATED)
def crear_orden(
    orden_data: OrdenCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Crear una nueva orden"""
    return order_service.create_orden(db, orden_data, current_user)


@router.post("/{orden_id}/checkout", response_model=StripeCheckoutResponse)
def crear_checkout_session(
    orden_id: UUID,
    data: StripeCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Crear sesión de Stripe Checkout para una orden"""
    return order_service.crear_stripe_checkout_session(
        db, orden_id, current_user, data.success_url, data.cancel_url
    )


@router.post("/confirmar-pago/{session_id}", response_model=OrdenResponse)
async def confirmar_pago(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Confirmar pago de Stripe y actualizar orden"""
    return await order_service.confirmar_pago_stripe(db, session_id, current_user)


@router.get("/mias", response_model=List[OrdenResponse])
def mis_ordenes(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener mis órdenes"""
    ordenes, total = order_service.get_mis_ordenes(db, current_user, skip, limit)
    return ordenes


@router.get("/{orden_id}", response_model=OrdenResponse)
def detalle_orden(
    orden_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener detalle de una orden"""
    return order_service.get_orden_by_id(db, orden_id, current_user)


@router.get("/{orden_id}/pdf")
def descargar_pdf_orden(
    orden_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Descargar PDF de la orden"""
    orden = order_service.get_orden_by_id(db, orden_id, current_user)

    pdf_buffer = generar_pdf_orden(orden)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=orden_{orden.numero_orden}.pdf"
        },
    )


@router.get("/admin/all", response_model=dict)
def get_all_ordenes_admin(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    estado: Optional[str] = Query(default=None),
    fecha_desde: Optional[datetime] = Query(default=None),
    fecha_hasta: Optional[datetime] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Obtener todas las órdenes con filtros (SOLO ADMIN)

    - **skip**: Registros a saltar (paginación)
    - **limit**: Límite de registros
    - **estado**: Filtrar por estado específico
    - **fecha_desde**: Filtrar desde fecha (ISO format)
    - **fecha_hasta**: Filtrar hasta fecha (ISO format)
    - **search**: Buscar por número de orden o email de usuario
    """
    ordenes, total = order_service.get_all_ordenes_admin(
        db=db,
        skip=skip,
        limit=limit,
        estado=estado,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        search=search,
    )


    return {
    "ordenes": [OrdenResponse.model_validate(o) for o in ordenes],
    "total": total,
    "skip": skip,
    "limit": limit,
    "filtros": {
        "estado": estado,
        "fecha_desde": fecha_desde,
        "fecha_hasta": fecha_hasta,
        "search": search,
    },
}


@router.get("/admin/{orden_id}", response_model=OrdenResponse)
def get_orden_admin(
    orden_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Obtener detalle de una orden (SOLO ADMIN)"""
    return order_service.get_orden_by_id_admin(db, orden_id)


@router.put("/admin/{orden_id}/estado", response_model=OrdenResponse)
def update_orden_estado(
    orden_id: UUID,
    estado_data: OrdenEstadoUpdate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Actualizar estado de una orden (SOLO ADMIN)

    Estados válidos:
    - Pendiente
    - Confirmado
    - En Proceso
    - Enviado
    - Entregado
    - Cancelado (requiere motivo_cancelacion)
    """
    return order_service.update_orden_estado(
        db=db,
        orden_id=orden_id,
        nuevo_estado=estado_data.estado,
        motivo_cancelacion=estado_data.motivo_cancelacion,
    )


@router.get("/admin/estadisticas/general", response_model=EstadisticasOrdenesResponse)
def get_estadisticas_ordenes(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Obtener estadísticas generales de órdenes (SOLO ADMIN)"""
    return order_service.get_estadisticas_ordenes(db)
