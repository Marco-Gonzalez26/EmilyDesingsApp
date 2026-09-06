import pytest
from unittest.mock import MagicMock, patch, call
from uuid import uuid4
from fastapi import HTTPException

from app.models.models import CarritoItem
from app.services.cart_service import (
    get_or_create_carrito,
    add_item,
    update_item_quantity,
    remove_item,
    clear_carrito,
    get_total,
)


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def usuario_id():
    return uuid4()


@pytest.fixture
def carrito(usuario_id):
    c = MagicMock()
    c.id = uuid4()
    c.usuario_id = usuario_id
    c.activo = True
    c.items = []
    return c


@pytest.fixture
def producto():
    p = MagicMock()
    p.id = uuid4()
    p.activo = True
    p.precio_regular = 30.0
    p.precio_descuento = None
    return p


@pytest.fixture
def inventario():
    inv = MagicMock()
    inv.stock = 10
    inv.stock_reservado = 2
    return inv




class TestGetOrCreateCarrito:
    def test_retorna_carrito_existente(self, db, carrito, usuario_id):
        db.query().options().filter().first.return_value = carrito
        result = get_or_create_carrito(db, usuario_id)
        assert result == carrito

    def test_crea_carrito_si_no_existe(self, db, usuario_id):
        db.query().options().filter().first.return_value = None
        db.refresh = MagicMock()
        get_or_create_carrito(db, usuario_id)
        db.add.assert_called_once()
        db.commit.assert_called_once()




class TestAddItem:
    @patch("app.services.cart_service.get_or_create_carrito")
    def test_lanza_404_si_producto_no_existe(self, mock_carrito, db, usuario_id):
        db.query().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            add_item(db, usuario_id, uuid4(), uuid4(), uuid4(), 1)
        assert exc.value.status_code == 404

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_lanza_400_si_inventario_no_existe(
        self, mock_carrito, db, usuario_id, producto
    ):
        # Primera llamada devuelve producto, segunda None (inventario)
        db.query().filter().first.side_effect = [producto, None]
        with pytest.raises(HTTPException) as exc:
            add_item(db, usuario_id, uuid4(), uuid4(), uuid4(), 1)
        assert exc.value.status_code == 400

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_lanza_400_si_stock_insuficiente(
        self, mock_carrito, db, usuario_id, producto, inventario
    ):
        inventario.stock = 2
        inventario.stock_reservado = 2  # stock disponible = 0
        db.query().filter().first.side_effect = [producto, inventario]
        with pytest.raises(HTTPException) as exc:
            add_item(db, usuario_id, uuid4(), uuid4(), uuid4(), 5)
        assert exc.value.status_code == 400

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_agrega_item_nuevo_correctamente(
        self, mock_carrito, db, usuario_id, producto, inventario, carrito
    ):
        mock_carrito.return_value = carrito
        db.query().filter().first.side_effect = [
            producto,
            inventario,
            None,
        ]  # producto, inventario, no existing_item
        add_item(db, usuario_id, producto.id, uuid4(), uuid4(), 1)
        added_items = [c[0][0] for c in db.add.call_args_list if isinstance(c[0][0], CarritoItem)]
        assert len(added_items) == 1
        assert added_items[0].producto_id == producto.id
        db.commit.assert_called_once()

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_incrementa_cantidad_si_item_ya_existe(
        self, mock_carrito, db, usuario_id, producto, inventario, carrito
    ):
        mock_carrito.return_value = carrito
        existing_item = MagicMock()
        existing_item.cantidad = 2
        db.query().filter().first.side_effect = [producto, inventario, existing_item]
        add_item(db, usuario_id, producto.id, uuid4(), uuid4(), 1)
        assert existing_item.cantidad == 3
        db.commit.assert_called_once()



class TestUpdateItemQuantity:
    @patch("app.services.cart_service.get_or_create_carrito")
    def test_lanza_404_si_item_no_existe(self, mock_carrito, db, usuario_id, carrito):
        mock_carrito.return_value = carrito
        db.query().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            update_item_quantity(db, usuario_id, uuid4(), 2)
        assert exc.value.status_code == 404

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_lanza_400_si_stock_insuficiente(
        self, mock_carrito, db, usuario_id, carrito, inventario
    ):
        mock_carrito.return_value = carrito
        item = MagicMock()
        item.cantidad = 1
        inventario.stock = 3
        inventario.stock_reservado = 3  # disponible = 0
        db.query().filter().first.side_effect = [item, inventario]
        with pytest.raises(HTTPException) as exc:
            update_item_quantity(db, usuario_id, uuid4(), 5)
        assert exc.value.status_code == 400

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_elimina_item_si_cantidad_es_cero(
        self, mock_carrito, db, usuario_id, carrito, inventario
    ):
        mock_carrito.return_value = carrito
        item = MagicMock()
        item.cantidad = 2
        db.query().filter().first.side_effect = [item, inventario]
        update_item_quantity(db, usuario_id, uuid4(), 0)
        db.delete.assert_called_once_with(item)




class TestRemoveItem:
    @patch("app.services.cart_service.get_or_create_carrito")
    def test_lanza_404_si_item_no_existe(self, mock_carrito, db, usuario_id, carrito):
        mock_carrito.return_value = carrito
        db.query().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            remove_item(db, usuario_id, uuid4())
        assert exc.value.status_code == 404

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_elimina_item_y_libera_stock(
        self, mock_carrito, db, usuario_id, carrito, inventario
    ):
        mock_carrito.return_value = carrito
        item = MagicMock()
        item.cantidad = 2
        inventario.stock_reservado = 5
        db.query().filter().first.side_effect = [item, inventario]
        remove_item(db, usuario_id, uuid4())
        assert inventario.stock_reservado == 3
        db.delete.assert_called_once_with(item)
        db.commit.assert_called_once()




class TestGetTotal:
    @patch("app.services.cart_service.get_or_create_carrito")
    def test_calcula_total_sin_envio(self, mock_carrito, db, usuario_id, carrito):
        item = MagicMock()
        item.precio_unitario = 30.0
        item.cantidad = 2  # subtotal = 60 >= 50, envio = 0
        carrito.items = [item]
        mock_carrito.return_value = carrito

        result = get_total(db, usuario_id)

        assert result["subtotal"] == 60.0
        assert result["envio"] == 0.0
        assert result["total"] == 60.0

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_calcula_total_con_envio(self, mock_carrito, db, usuario_id, carrito):
        item = MagicMock()
        item.precio_unitario = 10.0
        item.cantidad = 2  # subtotal = 20 < 50, envio = 5
        carrito.items = [item]
        mock_carrito.return_value = carrito

        result = get_total(db, usuario_id)

        assert result["subtotal"] == 20.0
        assert result["envio"] == 5.0
        assert result["total"] == 25.0

    @patch("app.services.cart_service.get_or_create_carrito")
    def test_retorna_cantidad_items(self, mock_carrito, db, usuario_id, carrito):
        item1 = MagicMock()
        item1.precio_unitario = 10.0
        item1.cantidad = 3
        item2 = MagicMock()
        item2.precio_unitario = 5.0
        item2.cantidad = 2
        carrito.items = [item1, item2]
        mock_carrito.return_value = carrito

        result = get_total(db, usuario_id)
        assert result["cantidad_items"] == 5
