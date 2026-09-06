from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.config import get_db
from app.utils.auth_dependencies import get_current_admin_user
from app.models.models import Usuario
from app.services import dashboard_service


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/general/kpis", response_model=Dict[str, Any])
def get_kpis_generales(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """KPIs principales para tab General"""
    return dashboard_service.obtener_kpis_generales(db)


@router.get("/general/ventas-mes", response_model=Dict[str, List])
def get_ventas_por_mes(
    meses: int = Query(6, ge=1, le=12, description="Número de meses"),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Ventas agrupadas por mes"""
    return dashboard_service.obtener_ventas_por_mes(db, meses)


@router.get("/general/categorias", response_model=Dict[str, List])
def get_ventas_categorias(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Top 5 categorías por ingresos"""
    return dashboard_service.obtener_ventas_por_categoria(db)


@router.get("/general/top-productos", response_model=List[Dict[str, Any]])
def get_top_productos(
    limit: int = Query(10, ge=1, le=50, description="Límite de productos"),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Top N productos más vendidos"""
    return dashboard_service.obtener_top_productos(db, limit)


@router.get("/general/estadisticas-rapidas", response_model=Dict[str, Any])
def get_estadisticas_rapidas(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Estadísticas rápidas para sidebar"""
    return dashboard_service.obtener_estadisticas_rapidas(db)


@router.get("/productos/kpis", response_model=Dict[str, Any])
def get_kpis_productos(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """KPIs para tab Productos"""
    return dashboard_service.obtener_kpis_productos(db)


@router.get("/productos/ingresos-categoria", response_model=Dict[str, List])
def get_ingresos_por_categoria(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Ingresos por categoría (gráfico horizontal)"""
    return dashboard_service.obtener_ingresos_por_categoria(db)


@router.get("/productos/distribucion-categoria", response_model=Dict[str, List])
def get_productos_por_categoria(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Cantidad de productos por categoría (pie chart)"""
    return dashboard_service.obtener_productos_por_categoria(db)


@router.get("/productos/nivel-stock", response_model=List[Dict[str, Any]])
def get_productos_por_nivel_stock(
    nivel: str = Query(None, pattern="^(bajo|medio|alto|optimo)$"),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """
    Productos filtrados por nivel de stock
    - bajo: < 10 unidades
    - medio: 10-50
    - alto: 51-100
    - optimo: > 100
    """
    return dashboard_service.obtener_productos_por_nivel_stock(db, nivel)


@router.get("/clientes/kpis", response_model=Dict[str, Any])
def get_kpis_clientes(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """KPIs para tab Clientes"""
    return dashboard_service.obtener_kpis_clientes(db)


@router.get("/clientes/nuevos-vs-recurrentes", response_model=Dict[str, Any])
def get_clientes_nuevos_vs_recurrentes(
    meses: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Stacked bar: Clientes nuevos vs recurrentes por mes"""
    return dashboard_service.obtener_clientes_nuevos_vs_recurrentes(db, meses)


@router.get("/clientes/por-ciudad", response_model=Dict[str, List])
def get_clientes_por_ciudad(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Horizontal bar: Clientes por ciudad de Ecuador"""
    return dashboard_service.obtener_clientes_por_ciudad(db)


@router.get("/clientes/top-compradores", response_model=List[Dict[str, Any]])
def get_top_compradores(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Top N clientes que más compran"""
    return dashboard_service.obtener_top_compradores(db, limit)


@router.get("/ventas/kpis", response_model=Dict[str, Any])
def get_kpis_ventas(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """KPIs para tab Ventas"""
    return dashboard_service.obtener_kpis_ventas(db)


@router.get("/ventas/metricas-avanzadas", response_model=Dict[str, Any])
def get_metricas_avanzadas(
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Métricas de conversión y retorno"""
    return dashboard_service.obtener_metricas_avanzadas(db)


@router.get("/ventas/mes-especifico", response_model=Dict[str, Any])
def get_ventas_mes_especifico(
    year: int = Query(..., description="Año (ej: 2024)"),
    month: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Obtiene ventas de un mes específico"""
    return dashboard_service.obtener_ventas_mes_especifico(db, year, month)


@router.get("/recomendaciones/productos-mas-recomendados", response_model=List[Dict[str, Any]])
def get_productos_mas_recomendados(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user),
):
    """Top N productos más recomendados por el motor de IA"""
    return dashboard_service.obtener_productos_mas_recomendados(db, limit)
