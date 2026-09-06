import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from fastapi import HTTPException

from app.services.category_service import (
    get_categorias,
    get_categoria_by_id,
    create_categoria,
    update_categoria,
    delete_categoria,
)
from app.schemas.schemas import CategoriaCreate, CategoriaUpdate


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def categoria():
    c = MagicMock()
    c.id = uuid4()
    c.nombre = "Vestidos"
    c.activo = True
    return c


class TestGetCategorias:
    def test_retorna_solo_activas_por_defecto(self, db, categoria):
        db.query().filter().order_by().all.return_value = [categoria]
        result = get_categorias(db)
        assert result == [categoria]

    def test_retorna_todas_si_solo_activas_false(self, db, categoria):
        db.query().order_by().all.return_value = [categoria]
        result = get_categorias(db, solo_activas=False)
        assert result == [categoria]



class TestGetCategoriaById:
    def test_retorna_categoria_existente(self, db, categoria):
        db.query().filter().first.return_value = categoria
        result = get_categoria_by_id(db, categoria.id)
        assert result == categoria

    def test_lanza_404_si_no_existe(self, db):
        db.query().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            get_categoria_by_id(db, uuid4())
        assert exc.value.status_code == 404



class TestCreateCategoria:
    def test_crea_categoria_correctamente(self, db):
        db.query().filter().first.return_value = None
        data = CategoriaCreate(nombre="Faldas")
        create_categoria(db, data)
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_lanza_400_si_categoria_ya_existe(self, db, categoria):
        db.query().filter().first.return_value = categoria
        data = CategoriaCreate(nombre="Vestidos")
        with pytest.raises(HTTPException) as exc:
            create_categoria(db, data)
        assert exc.value.status_code == 400
        assert "ya existe" in exc.value.detail



class TestUpdateCategoria:
    @patch("app.services.category_service.get_categoria_by_id")
    def test_actualiza_categoria_correctamente(self, mock_get, db, categoria):
        mock_get.return_value = categoria
        data = CategoriaUpdate(nombre="Blusas")
        update_categoria(db, categoria.id, data)
        db.commit.assert_called_once()
        db.refresh.assert_called_once()



class TestDeleteCategoria:
    @patch("app.services.category_service.get_categoria_by_id")
    def test_soft_delete(self, mock_get, db, categoria):
        mock_get.return_value = categoria
        delete_categoria(db, categoria.id, soft_delete=True)
        assert categoria.activo == False
        db.commit.assert_called_once()

    @patch("app.services.category_service.get_categoria_by_id")
    def test_hard_delete(self, mock_get, db, categoria):
        mock_get.return_value = categoria
        delete_categoria(db, categoria.id, soft_delete=False)
        db.delete.assert_called_once_with(categoria)
        db.commit.assert_called_once()