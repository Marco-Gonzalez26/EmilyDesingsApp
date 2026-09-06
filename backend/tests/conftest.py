import pytest
from unittest.mock import MagicMock
from uuid import uuid4


@pytest.fixture
def db():
    """Mock de sesión de base de datos SQLAlchemy"""
    return MagicMock()


@pytest.fixture
def admin_user():
    """Usuario administrador mock"""
    user = MagicMock()
    user.id = uuid4()
    user.email = "admin@emilydesigns.com"
    user.rol = "administrador"
    user.activo = True
    return user


@pytest.fixture
def cliente_user():
    """Usuario cliente mock"""
    user = MagicMock()
    user.id = uuid4()
    user.email = "cliente@example.com"
    user.rol = "cliente"
    user.activo = True
    return user
