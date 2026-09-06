import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from fastapi import HTTPException

from app.services.brand_service import (
    get_marcas,
    get_marca_by_id,
    create_marca,
    update_marca,
    delete_marca,
)
from app.schemas.schemas import MarcaCreate, MarcaUpdate


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def marca():
    m = MagicMock()
    m.id = uuid4()
    m.nombre = "Nike"
    m.activo = True
    return m




class TestGetMarcas:
    def test_retorna_solo_activas_por_defecto(self, db, marca):
        db.query().filter().order_by().all.return_value = [marca]
        result = get_marcas(db)
        assert result == [marca]

    def test_retorna_todas_si_solo_activas_false(self, db, marca):
        db.query().order_by().all.return_value = [marca]
        result = get_marcas(db, solo_activas=False)
        assert result == [marca]




class TestGetMarcaById:
    def test_retorna_marca_existente(self, db, marca):
        db.query().filter().first.return_value = marca
        result = get_marca_by_id(db, marca.id)
        assert result == marca

    def test_lanza_404_si_no_existe(self, db):
        db.query().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            get_marca_by_id(db, uuid4())
        assert exc.value.status_code == 404




class TestCreateMarca:
    def test_crea_marca_correctamente(self, db):
        db.query().filter().first.return_value = None
        data = MarcaCreate(nombre="Adidas")
        create_marca(db, data)
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_lanza_400_si_marca_ya_existe(self, db, marca):
        db.query().filter().first.return_value = marca
        data = MarcaCreate(nombre="Nike")
        with pytest.raises(HTTPException) as exc:
            create_marca(db, data)
        assert exc.value.status_code == 400
        assert "ya existe" in exc.value.detail




class TestUpdateMarca:
    @patch("app.services.brand_service.get_marca_by_id")
    def test_actualiza_marca_correctamente(self, mock_get, db, marca):
        mock_get.return_value = marca
        data = MarcaUpdate(nombre="Puma")
        update_marca(db, marca.id, data)
        db.commit.assert_called_once()
        db.refresh.assert_called_once()




class TestDeleteMarca:
    @patch("app.services.brand_service.get_marca_by_id")
    def test_soft_delete(self, mock_get, db, marca):
        mock_get.return_value = marca
        delete_marca(db, marca.id, soft_delete=True)
        assert marca.activo == False
        db.commit.assert_called_once()

    @patch("app.services.brand_service.get_marca_by_id")
    def test_hard_delete(self, mock_get, db, marca):
        mock_get.return_value = marca
        delete_marca(db, marca.id, soft_delete=False)
        db.delete.assert_called_once_with(marca)
        db.commit.assert_called_once()
