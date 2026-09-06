"""
Configuración de la base de datos PostgreSQL con SQLAlchemy
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv
import os
import logging
from typing import Generator

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:password@localhost:5432/tu_base_de_datos"
)

SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

engine = create_engine(
    DATABASE_URL,
    echo=SQL_ECHO,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Base de datos inicializada correctamente")


def check_db_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            logger.info("Conexión a PostgreSQL exitosa")
            return True
    except Exception as e:
        logger.error(f"Error de conexión a PostgreSQL: {e}")
        return False
