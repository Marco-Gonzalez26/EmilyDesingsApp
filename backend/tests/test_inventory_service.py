import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from fastapi import HTTPException

from app.services.inventory_service import (
    get_inventario_by_id,
    get_stock_disponible,
    create_inventario,
    update_inventario,
    ajustar_stock,
    delete_inventario,
)
from app.schemas.schemas import InventarioCreate, InventarioUpdate, InventarioAjuste


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def inventario():
    inv = MagicMock()
    inv.id = uuid4()
    inv.stock = 20
    inv.stock_reservado = 5
    return inv


@pytest.fixture
def inventario_data():
    return InventarioCreate(
        producto_id=uuid4(),
        talla_id=uuid4(),
        color_id=uuid4(),
        stock=10,
        stock_reservado=0,
    )




class TestGetInventarioById:
    def test_retorna_inventario_existente(self, db, inventario):
        db.query().options().filter().first.return_value = inventario
        result = get_inventario_by_id(db, inventario.id)
        assert result == inventario

    def test_lanza_404_si_no_existe(self, db):
        db.query().options().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            get_inventario_by_id(db, uuid4())
        assert exc.value.status_code == 404



class TestGetStockDisponible:
    def test_retorna_stock_disponible(self, db, inventario):
        inventario.stock = 10
        inventario.stock_reservado = 3
        db.query().filter().first.return_value = inventario
        result = get_stock_disponible(db, uuid4(), uuid4(), uuid4())
        assert result == 7

    def test_retorna_cero_si_no_existe_inventario(self, db):
        db.query().filter().first.return_value = None
        result = get_stock_disponible(db, uuid4(), uuid4(), uuid4())
        assert result == 0


class TestCreateInventario:
    def test_crea_inventario_correctamente(self, db, inventario_data):
        # producto existe, talla existe, color existe, combinación no existe
        db.query().filter().first.side_effect = [
            MagicMock(),
            MagicMock(),
            MagicMock(),
            None,
        ]
        create_inventario(db, inventario_data)
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_lanza_404_si_producto_no_existe(self, db, inventario_data):
        db.query().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            create_inventario(db, inventario_data)
        assert exc.value.status_code == 404

    def test_lanza_404_si_talla_no_existe(self, db, inventario_data):
        db.query().filter().first.side_effect = [MagicMock(), None]
        with pytest.raises(HTTPException) as exc:
            create_inventario(db, inventario_data)
        assert exc.value.status_code == 404

    def test_lanza_404_si_color_no_existe(self, db, inventario_data):
        db.query().filter().first.side_effect = [MagicMock(), MagicMock(), None]
        with pytest.raises(HTTPException) as exc:
            create_inventario(db, inventario_data)
        assert exc.value.status_code == 404

    def test_lanza_400_si_combinacion_ya_existe(self, db, inventario_data, inventario):
        db.query().filter().first.side_effect = [
            MagicMock(),
            MagicMock(),
            MagicMock(),
            inventario,
        ]
        with pytest.raises(HTTPException) as exc:
            create_inventario(db, inventario_data)
        assert exc.value.status_code == 400


class TestUpdateInventario:
    @patch("app.services.inventory_service.get_inventario_by_id")
    def test_actualiza_correctamente(self, mock_get, db, inventario):
        mock_get.return_value = inventario
        inventario.stock = 20
        inventario.stock_reservado = 5
        data = InventarioUpdate(stock=25)
        update_inventario(db, inventario.id, data)
        db.commit.assert_called_once()

    @patch("app.services.inventory_service.get_inventario_by_id")
    def test_lanza_400_si_stock_menor_al_reservado(self, mock_get, db, inventario):
        mock_get.return_value = inventario
        inventario.stock = 20
        inventario.stock_reservado = 10
        data = InventarioUpdate(stock=5)
        with pytest.raises(HTTPException) as exc:
            update_inventario(db, inventario.id, data)
        assert exc.value.status_code == 400



class TestAjustarStock:
    @patch("app.services.inventory_service.get_inventario_by_id")
    def test_incrementa_stock_correctamente(self, mock_get, db, inventario):
        mock_get.return_value = inventario
        inventario.stock = 10
        inventario.stock_reservado = 2
        data = InventarioAjuste(ajuste=5)
        ajustar_stock(db, inventario.id, data)
        assert inventario.stock == 15

    @patch("app.services.inventory_service.get_inventario_by_id")
    def test_lanza_400_si_stock_resultante_negativo(self, mock_get, db, inventario):
        mock_get.return_value = inventario
        inventario.stock = 3
        inventario.stock_reservado = 0
        data = InventarioAjuste(ajuste=-10)
        with pytest.raises(HTTPException) as exc:
            ajustar_stock(db, inventario.id, data)
        assert exc.value.status_code == 400

    @patch("app.services.inventory_service.get_inventario_by_id")
    def test_lanza_400_si_stock_menor_al_reservado(self, mock_get, db, inventario):
        mock_get.return_value = inventario
        inventario.stock = 10
        inventario.stock_reservado = 8
        data = InventarioAjuste(ajuste=-5)  # stock resultante = 5 < 8 reservado
        with pytest.raises(HTTPException) as exc:
            ajustar_stock(db, inventario.id, data)
        assert exc.value.status_code == 400



class TestDeleteInventario:
    @patch("app.services.inventory_service.get_inventario_by_id")
    def test_elimina_correctamente(self, mock_get, db, inventario):
        mock_get.return_value = inventario
        inventario.stock_reservado = 0
        delete_inventario(db, inventario.id)
        db.delete.assert_called_once_with(inventario)
        db.commit.assert_called_once()

    @patch("app.services.inventory_service.get_inventario_by_id")
    def test_lanza_400_si_tiene_stock_reservado(self, mock_get, db, inventario):
        mock_get.return_value = inventario
        inventario.stock_reservado = 3
        with pytest.raises(HTTPException) as exc:
            delete_inventario(db, inventario.id)
        assert exc.value.status_code == 400
