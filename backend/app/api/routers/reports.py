from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.db.config import get_db
from app.utils.auth_dependencies import get_current_admin_user
from app.models.models import Usuario
from app.services import report_service, pdf_service

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


@router.get("/ventas-periodo")
def get_ventas_periodo(
    fecha_desde: datetime = Query(...),
    fecha_hasta: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener reporte de ventas por período (JSON)"""
    return report_service.get_ventas_por_periodo(db, fecha_desde, fecha_hasta)


@router.get("/ventas-periodo/pdf")
def export_ventas_periodo_pdf(
    fecha_desde: datetime = Query(...),
    fecha_hasta: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Exportar reporte de ventas a PDF"""

    data = report_service.get_ventas_por_periodo(db, fecha_desde, fecha_hasta)
    pdf_buffer = pdf_service.generar_ventas_pdf(data)

    filename = (
        f"ventas_{fecha_desde.strftime('%Y%m%d')}_{fecha_hasta.strftime('%Y%m%d')}.pdf"
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/productos-vendidos")
def get_productos_mas_vendidos(
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener productos más vendidos (JSON)"""
    return report_service.get_productos_mas_vendidos(
        db, fecha_desde, fecha_hasta, limit
    )


@router.get("/productos-vendidos/pdf")
def export_productos_vendidos_pdf(
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Exportar productos más vendidos a PDF"""

    productos = report_service.get_productos_mas_vendidos(
        db, fecha_desde, fecha_hasta, limit
    )
    pdf_buffer = pdf_service.generar_productos_vendidos_pdf(productos)

    filename = f"productos_vendidos_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/stock-bajo")
def get_stock_bajo(
    umbral: int = Query(default=10, ge=0, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener productos con stock bajo (JSON)"""
    return report_service.get_stock_bajo(db, umbral)


@router.get("/stock-bajo/pdf")
def export_stock_bajo_pdf(
    umbral: int = Query(default=10, ge=0, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Exportar stock bajo a PDF"""

    inventarios = report_service.get_stock_bajo(db, umbral)
    pdf_buffer = pdf_service.generar_stock_bajo_pdf(inventarios)

    filename = f"stock_bajo_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/mejores-clientes")
def get_mejores_clientes(
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Obtener mejores clientes (JSON)"""
    return report_service.get_resumen_clientes(db, fecha_desde, fecha_hasta, limit)


@router.get("/mejores-clientes/pdf")
def export_mejores_clientes_pdf(
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    """Exportar mejores clientes a PDF"""

    clientes = report_service.get_resumen_clientes(db, fecha_desde, fecha_hasta, limit)
    pdf_buffer = pdf_service.generar_clientes_pdf(clientes)

    filename = f"mejores_clientes_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
