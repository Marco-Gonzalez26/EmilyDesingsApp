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
from app.db.config import check_db_connection
from app.ml.inference import load_model
import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:4200").split(",")


async def lifespan(app: FastAPI):
    print(">>> LIFESPAN STARTED")
    check_db_connection()
    print(">>> ANTES DE load_model")
    load_model()
    print(">>> DESPUES DE load_model, artifact es None:", inference.get_artifact() is None if False else "usa la variable correcta aquí")
    yield


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
