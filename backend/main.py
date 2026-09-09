from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.routers import (
    auth,
    products,
    catalog,
    orders,
    categories,
    brands,
    cart,
    sizes,
    colors,
    inventory,
    dashboard,
    product_images,
    user,
    reports,
    preferences,
    styles,
    favoritos,
    recomendaciones,
    interacciones,
)

from app.models import (
    Usuario,
    TokenSesion,
    TokenRecuperacion,
    Marca,
    Categoria,
    Color,
    Talla,
    Producto,
    ImagenProducto,
    Inventario,
    Carrito,
    CarritoItem,
    Orden,
    OrdenItem,
    Comprobante,
    HistorialProducto,
    RecomendacionIA,
    HistorialReporte,
    PreferenciasUsuario,
    Estilo,
    InteraccionUsuario,
    Favorito,
    ProductoEstilo,
    RecomendacionGenerada,
)
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
from app.db.config import check_db_connection, get_db
from app.ml import inference
import logging
import os
import asyncio

logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:4200").split(",")

_clean_task_handle = None

async def _reservation_cleaner():
    """Tarea periódica: libera reservas de carritos inactivos cada 30 min."""
    from app.services.cart_service import liberar_reservas_vencidas
    while True:
        await asyncio.sleep(30 * 60)  # cada 30 minutos
        try:
            db = next(get_db())
            liberados = liberar_reservas_vencidas(db)
            if liberados:
                logger.info("Reservas vencidas liberadas: %d", liberados)
            db.close()
        except Exception as e:
            logger.error("Error limpiando reservas vencidas: %s", e)


async def lifespan(app: FastAPI):
    global _clean_task_handle
    logger.info("LIFESPAN STARTED")
    check_db_connection()
    inference.load_model()
    logger.info("Artifact es None: %s", inference.get_artifact() is None)
    _clean_task_handle = asyncio.create_task(_reservation_cleaner())
    yield
    _clean_task_handle.cancel()


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Emily Designs API",
    description="API de e-commerce con recomendaciones personalizadas",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Demasiados intentos, espera 1 minuto"})


app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(catalog.router)
app.include_router(orders.router)
app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(cart.router)
app.include_router(sizes.router)
app.include_router(colors.router)
app.include_router(inventory.router)
app.include_router(dashboard.router)
app.include_router(product_images.router)
app.include_router(user.router)
app.include_router(reports.router)
app.include_router(preferences.router)
app.include_router(styles.router)
app.include_router(favoritos.router)
app.include_router(recomendaciones.router)
app.include_router(interacciones.router)
