import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from decimal import Decimal
from fastapi import HTTPException

from app.services.product_service import (
    get_producto_by_id,
    get_producto_by_sku,
    create_producto,
    update_producto,
    delete_producto,
    generate_sku,
)
from app.schemas.schemas import ProductoCreate, ProductoUpdate


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def admin_user():
    user = MagicMock()
    user.id = uuid4()
    user.rol = "administrador"
    return user


@pytest.fixture
def producto():
    p = MagicMock()
    p.id = uuid4()
    p.sku = "NIKE-0001"
    p.nombre = "Camiseta Test"
    p.precio_regular = Decimal("50.00")
    p.precio_descuento = None
    p.activo = True
    return p


@pytest.fixture
def producto_data():
    return ProductoCreate(
        nombre="Camiseta Nueva",
        descripcion="Descripción test",
        precio_regular=Decimal("50.00"),
        precio_descuento=None,
        sku="AUTO",
        marca_id=uuid4(),
        categoria_id=uuid4(),
        es_nuevo=True,
        es_oferta=False,
        es_destacado=False,
        activo=True,
    )


class TestGetProductoById:
    def test_retorna_producto_existente(self, db, producto):
        db.query().options().filter().first.return_value = producto
        result = get_producto_by_id(db, producto.id)
        assert result == producto

    def test_lanza_404_si_no_existe(self, db):
        db.query().options().filter().first.return_value = None
        with pytest.raises(HTTPException) as exc:
            get_producto_by_id(db, uuid4())
        assert exc.value.status_code == 404


class TestGetProductoBySku:
    def test_retorna_producto_por_sku(self, db, producto):
        db.query().filter().first.return_value = producto
        result = get_producto_by_sku(db, "NIKE-0001")
        assert result == producto

    def test_retorna_none_si_no_existe(self, db):
        db.query().filter().first.return_value = None
        result = get_producto_by_sku(db, "NOEXISTE-0001")
        assert result is None


class TestCreateProducto:
    @patch("app.services.product_service.generate_sku", return_value="MARK-0001")
    @patch("app.services.product_service.get_producto_by_sku", return_value=None)
    def test_crea_producto_con_sku_auto(
        self, mock_sku_check, mock_gen_sku, db, admin_user, producto_data
    ):
        db.refresh = MagicMock()
        create_producto(db, producto_data, admin_user)
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_lanza_error_si_sku_duplicado(self, db, admin_user, producto_data):
        producto_data.sku = "NIKE-0001"
        db.query().filter().first.return_value = MagicMock()

        with pytest.raises(HTTPException) as exc:
            create_producto(db, producto_data, admin_user)
        assert exc.value.status_code == 400
        assert "SKU" in exc.value.detail

    @patch("app.services.product_service.generate_sku", return_value="MARK-0001")
    @patch("app.services.product_service.get_producto_by_sku", return_value=None)
    def test_lanza_error_si_precio_descuento_mayor_al_regular(
        self, mock_sku, mock_gen, db, admin_user, producto_data
    ):
        producto_data.sku = "AUTO"
        producto_data.precio_regular = Decimal("30.00")
        producto_data.precio_descuento = Decimal("50.00")

        with pytest.raises(HTTPException) as exc:
            create_producto(db, producto_data, admin_user)
        assert exc.value.status_code == 400
        assert "precio de descuento" in exc.value.detail


class TestUpdateProducto:
    @patch("app.services.product_service.get_producto_by_id")
    @patch("app.services.product_service.get_producto_by_sku", return_value=None)
    def test_actualiza_producto_correctamente(
        self, mock_sku, mock_get, db, admin_user, producto
    ):
        mock_get.return_value = producto
        update_data = ProductoUpdate(nombre="Camiseta Actualizada")

        update_producto(db, producto.id, update_data, admin_user)

        db.commit.assert_called_once()
        db.refresh.assert_called_once()

    @patch("app.services.product_service.get_producto_by_id")
    def test_lanza_error_si_precio_descuento_invalido(
        self, mock_get, db, admin_user, producto
    ):
        mock_get.return_value = producto
        producto.precio_regular = Decimal("50.00")
        producto.precio_descuento = None
        update_data = ProductoUpdate(precio_descuento=Decimal("100.00"))

        with pytest.raises(HTTPException) as exc:
            update_producto(db, producto.id, update_data, admin_user)
        assert exc.value.status_code == 400


class TestDeleteProducto:
    @patch("app.services.product_service.get_producto_by_id")
    def test_soft_delete_marca_como_inactivo(self, mock_get, db, admin_user, producto):
        mock_get.return_value = producto
        delete_producto(db, producto.id, admin_user, soft_delete=True)

        assert producto.activo == False
        db.commit.assert_called_once()

    @patch("app.services.product_service.get_producto_by_id")
    def test_hard_delete_elimina_producto(self, mock_get, db, admin_user, producto):
        mock_get.return_value = producto
        delete_producto(db, producto.id, admin_user, soft_delete=False)

        db.delete.assert_called_once_with(producto)
        db.commit.assert_called_once()


class TestGenerateSku:
    def test_genera_sku_con_marca(self, db):
        marca = MagicMock()
        marca.nombre = "Nike"
        db.query().filter().first.return_value = marca
        db.query().filter().count.return_value = 0
        db.query().filter().first.side_effect = [marca, None]

        result = generate_sku(db, uuid4())
        assert result.startswith("NIKE-")

    def test_genera_sku_sin_marca(self, db):
        db.query().filter().count.return_value = 2
        db.query().filter().first.return_value = None

        result = generate_sku(db, None)
        assert result.startswith("PROD-")
        assert result == "PROD-0003"
