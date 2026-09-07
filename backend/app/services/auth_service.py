from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import timedelta
from uuid import UUID

from app.models.models import Usuario
from app.schemas.schemas import UsuarioCreate, UserLogin
from app.utils.validators import validar_cedula_ruc
from app.utils.auth_security import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)


def get_user_by_email(db: Session, email: str) -> Usuario:
    """Obtener usuario por email"""
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_user_by_id(db: Session, user_id: UUID) -> Usuario:
    """Obtener usuario por ID"""
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def create_user(db: Session, user: UsuarioCreate) -> Usuario:
    """
    Crear un nuevo usuario

    Args:
        db: Sesión de base de datos
        user: Datos del usuario a crear

    Returns:
        Usuario creado

    Raises:
        HTTPException: Si el email ya está registrado
    """
    # Verificar si el email ya existe
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )
    if user.cedula_ruc and not validar_cedula_ruc(user.cedula_ruc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cédula o RUC inválido"
        )

    # Crear nuevo usuario con contraseña hasheada
    hashed_password = get_password_hash(user.password)

    new_user = Usuario(
        email=user.email,
        password_hash=hashed_password,
        cedula_ruc=user.cedula_ruc,
        nombre_completo=user.nombre_completo,
        telefono=user.telefono,
        direccion=user.direccion,
        ciudad=user.ciudad,
        rol=user.rol,
        acepta_terminos=user.acepta_terminos,
        activo=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def _is_admin_blocked_without_2fa(user: Usuario) -> bool:
    return user.rol == 'administrador' and not getattr(user, 'totp_enabled', False)


def authenticate_user(db: Session, credentials: UserLogin) -> Usuario:
    """
    Autenticar usuario

    Args:
        db: Sesión de base de datos
        credentials: Credenciales de login (email y password)

    Returns:
        Usuario autenticado

    Raises:
        HTTPException: Si las credenciales son inválidas o admin sin 2FA
    """
    # Buscar usuario por email
    user = get_user_by_email(db, credentials.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar contraseña
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar que el usuario esté activo
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador.",
        )

    # Admin sin 2FA no puede operar (ni login)
    if _is_admin_blocked_without_2fa(user):
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="Admin requiere 2FA, activa en Admin Configuración",
        )

    return user


def verify_admin_2fa_or_block(user: Usuario) -> None:
    if _is_admin_blocked_without_2fa(user):
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="Admin requiere 2FA, activa en Admin Configuración",
        )


def create_user_token(user: Usuario) -> dict:
    """
    Crear token JWT para un usuario

    Args:
        user: Usuario para el cual crear el token

    Returns:
        Dict con access_token y token_type
    """
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Datos a incluir en el token
    token_data = {
        "sub": str(user.id),  # subject (usuario ID)
        "email": user.email,
        "rol": user.rol,
    }

    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


# --- TOTP helpers con cifrado AES-256-GCM y single-use ---
_used_codes: set[str] = set()  # single-use cache 30s (en prod usar Redis)

def generate_totp_secret() -> str:
    import pyotp
    return pyotp.random_base32()  # 32 chars Base32

def get_totp_uri(secret: str, email: str) -> str:
    import pyotp
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name='EmilyDesigns')

def verify_totp(secret: str, code: str, user_id: str = "") -> bool:
    import pyotp
    # window=1 => ±30s tolerancia, evita replay prolongado (decisión seguridad)
    key = f"{user_id}:{code}"
    if key in _used_codes:
        return False  # single-use: invalida reutilización misma ventana 30s
    ok = pyotp.TOTP(secret).verify(code.strip(), valid_window=1)
    if ok:
        _used_codes.add(key)
        # expira 35s
        import threading
        threading.Timer(35, lambda: _used_codes.discard(key)).start()
    return ok

def encrypt_and_store_secret(db, user, plain_secret: str) -> None:
    from app.utils.crypto import encrypt_secret
    user.totp_secret_encrypted = encrypt_secret(plain_secret)
    db.commit()

def decrypt_user_secret(user) -> str | None:
    if getattr(user, "totp_secret_encrypted", None):
        from app.utils.crypto import decrypt_secret
        return decrypt_secret(user.totp_secret_encrypted)
    return None

def generate_recovery_codes(db, user) -> list[str]:
    import secrets
    from app.models.models import TotpRecoveryCode
    from app.utils.auth_security import get_password_hash
    codes = [secrets.token_hex(4).upper() for _ in range(5)]  # Hex8 5 códigos
    db.query(TotpRecoveryCode).filter_by(usuario_id=user.id).delete()
    for c in codes:
        db.add(TotpRecoveryCode(usuario_id=user.id, code_hash=get_password_hash(c), usado=False))
    db.commit()
    return codes


def change_password(
    db: Session, email: str, password_actual: str, password_nueva: str
) -> bool:
    """Cambiar contraseña del usuario"""

    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )

    if not verify_password(password_actual, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta",
        )

    usuario.password_hash = get_password_hash(password_nueva)

    db.commit()

    return True
