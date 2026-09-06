import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from fastapi import HTTPException

from app.services.auth_service import (
    get_user_by_email,
    get_user_by_id,
    create_user,
    authenticate_user,
    create_user_token,
)
from app.schemas.schemas import UsuarioCreate, UserLogin



@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def usuario_activo():
    user = MagicMock()
    user.id = uuid4()
    user.email = "test@example.com"
    user.password_hash = "$2b$12$hashedpassword"
    user.nombre_completo = "Test User"
    user.rol = "cliente"
    user.activo = True
    return user


@pytest.fixture
def usuario_inactivo(usuario_activo):
    usuario_activo.activo = False
    return usuario_activo


class TestGetUserByEmail:
    def test_retorna_usuario_existente(self, db, usuario_activo):
        db.query().filter().first.return_value = usuario_activo
        result = get_user_by_email(db, "test@example.com")
        assert result == usuario_activo

    def test_retorna_none_si_no_existe(self, db):
        db.query().filter().first.return_value = None
        result = get_user_by_email(db, "noexiste@example.com")
        assert result is None



class TestGetUserById:
    def test_retorna_usuario_por_id(self, db, usuario_activo):
        db.query().filter().first.return_value = usuario_activo
        result = get_user_by_id(db, usuario_activo.id)
        assert result == usuario_activo

    def test_retorna_none_si_no_existe(self, db):
        db.query().filter().first.return_value = None
        result = get_user_by_id(db, uuid4())
        assert result is None



class TestCreateUser:
    @patch("app.services.auth_service.get_password_hash", return_value="hashed_pw")
    @patch("app.services.auth_service.get_user_by_email", return_value=None)
    @patch("app.services.auth_service.validar_cedula_ruc", return_value=True)
    def test_crea_usuario_correctamente(self, mock_valida, mock_get, mock_hash, db):
        user_data = UsuarioCreate(
            email="nuevo@example.com",
            password="password123",
            nombre_completo="Nuevo Usuario",
            telefono="0991234567",
            direccion="Calle 123",
            rol="cliente",
            cedula_ruc="1234567890",
        )

        db.refresh = MagicMock()

        result = create_user(db, user_data)

        db.add.assert_called_once()
        db.commit.assert_called_once()

    @patch("app.services.auth_service.get_user_by_email")
    def test_lanza_error_si_email_ya_existe(self, mock_get, db, usuario_activo):
        mock_get.return_value = usuario_activo
        user_data = UsuarioCreate(
            email="test@example.com",
            password="password123",
            nombre_completo="Test",
            rol="cliente",
        )

        with pytest.raises(HTTPException) as exc:
            create_user(db, user_data)
        assert exc.value.status_code == 400
        assert "email ya está registrado" in exc.value.detail

    @patch("app.services.auth_service.get_user_by_email", return_value=None)
    @patch("app.services.auth_service.validar_cedula_ruc", return_value=False)
    def test_lanza_error_si_cedula_invalida(self, mock_valida, mock_get, db):
        user_data = UsuarioCreate(
            email="nuevo@example.com",
            password="password123",
            nombre_completo="Test",
            rol="cliente",
            cedula_ruc="000",
        )

        with pytest.raises(HTTPException) as exc:
            create_user(db, user_data)
        assert exc.value.status_code == 400
        assert "Cédula" in exc.value.detail




class TestAuthenticateUser:
    @patch("app.services.auth_service.verify_password", return_value=True)
    @patch("app.services.auth_service.get_user_by_email")
    def test_autentica_usuario_correcto(self, mock_get, mock_verify, db, usuario_activo):
        mock_get.return_value = usuario_activo
        credentials = UserLogin(email="test@example.com", password="password123")

        result = authenticate_user(db, credentials)
        assert result == usuario_activo

    @patch("app.services.auth_service.get_user_by_email", return_value=None)
    def test_lanza_error_si_email_no_existe(self, mock_get, db):
        credentials = UserLogin(email="noexiste@example.com", password="password123")

        with pytest.raises(HTTPException) as exc:
            authenticate_user(db, credentials)
        assert exc.value.status_code == 401

    @patch("app.services.auth_service.verify_password", return_value=False)
    @patch("app.services.auth_service.get_user_by_email")
    def test_lanza_error_si_password_incorrecto(self, mock_get, mock_verify, db, usuario_activo):
        mock_get.return_value = usuario_activo
        credentials = UserLogin(email="test@example.com", password="wrongpassword")

        with pytest.raises(HTTPException) as exc:
            authenticate_user(db, credentials)
        assert exc.value.status_code == 401

    @patch("app.services.auth_service.verify_password", return_value=True)
    @patch("app.services.auth_service.get_user_by_email")
    def test_lanza_error_si_usuario_inactivo(self, mock_get, mock_verify, db, usuario_inactivo):
        mock_get.return_value = usuario_inactivo
        credentials = UserLogin(email="test@example.com", password="password123")

        with pytest.raises(HTTPException) as exc:
            authenticate_user(db, credentials)
        assert exc.value.status_code == 403



class TestCreateUserToken:
    @patch("app.services.auth_service.create_access_token", return_value="fake_token")
    def test_retorna_token_con_formato_correcto(self, mock_token, usuario_activo):
        result = create_user_token(usuario_activo)

        assert "access_token" in result
        assert result["token_type"] == "bearer"
        assert result["access_token"] == "fake_token"