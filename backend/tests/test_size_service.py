import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from fastapi import HTTPException

from app.services.size_service import (
    get_tallas,
    get_talla_by_id,
    create_talla,
    update_talla,
    delete_talla,
)
from app.schemas.schemas import TallaCreate, TallaUpdate


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def talla():
    t = MagicMock()
    t.id = uuid4()
    t.nombre = "M"
    t.activo = True
    return t




class TestGetTallas:
    def test_retorna_solo_activas_por_defecto(self, db, talla):
        db.query().filter().order_by().all.return_value = [talla]
        result = get_tallas(db)
        assert result == [talla]

    def test_retorna_todas_si_solo_activas_false(self, db, talla):
        db.query().order_by().all.return_value = [talla]
        result = get_tallas(db, solo_activas=False)
        assert result == [talla]




class TestGetTallaById:
    def test_retorna_talla_existente(self, db, talla):
        db.query().filter().first.return_value = talla
        result = get_talla_by_id(db, talla.id)
        assert result == talla

    def test_lanza_404_si_no_existe(self, db):
        db.query().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            get_talla_by_id(db, uuid4())
        assert exc.value.status_code == 404




class TestCreateTalla:
    def test_crea_talla_correctamente(self, db):
        db.query().filter().first.return_value = None
        data = TallaCreate(nombre="XL", orden=3)
        create_talla(db, data)
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_lanza_400_si_talla_ya_existe(self, db, talla):
        db.query().filter().first.return_value = talla
        data = TallaCreate(nombre="M", orden=2)
        with pytest.raises(HTTPException) as exc:
            create_talla(db, data)
        assert exc.value.status_code == 400
        assert "ya existe" in exc.value.detail




class TestUpdateTalla:
    @patch("app.services.size_service.get_talla_by_id")
    def test_actualiza_talla_correctamente(self, mock_get, db, talla):
        mock_get.return_value = talla
        data = TallaUpdate(nombre="XL")
        update_talla(db, talla.id, data)
        db.commit.assert_called_once()
        db.refresh.assert_called_once()




class TestDeleteTalla:
    @patch("app.services.size_service.get_talla_by_id")
    def test_soft_delete(self, mock_get, db, talla):
        mock_get.return_value = talla
        delete_talla(db, talla.id, soft_delete=True)
        assert talla.activo == False
        db.commit.assert_called_once()

    @patch("app.services.size_service.get_talla_by_id")
    def test_hard_delete(self, mock_get, db, talla):
        mock_get.return_value = talla
        delete_talla(db, talla.id, soft_delete=False)
        db.delete.assert_called_once_with(talla)
        db.commit.assert_called_once()
