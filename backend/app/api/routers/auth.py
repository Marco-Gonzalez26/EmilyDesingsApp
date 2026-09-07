from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Annotated
import base64, io, secrets

import pyotp, qrcode
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.config import get_db
from app.schemas.schemas import UsuarioCreate, UsuarioResponse, UserLogin, Token, CambiarPasswordRequest
from app.services import auth_service
from app.utils.auth_dependencies import get_current_admin_user, get_current_user
from app.utils.crypto import encrypt_secret, decrypt_secret
from app.utils.auth_security import verify_password, create_access_token, decode_access_token
from app.models.models import TotpRecoveryCode
from pydantic import BaseModel

router = APIRouter(tags=["Autenticación"], prefix="/api/auth")
limiter = Limiter(key_func=lambda: get_remote_address)  # por IP + usuario se combina abajo

# --- Modelos ---
class Verify2FARequest(BaseModel):
    code: str

class Enable2FAResponse(BaseModel):
    secret: str  # Base32 manual
    otpauth_url: str
    qr_base64: str  # imagen base64

class Disable2FARequest(BaseModel):
    password: str
    code: str

# --- Registro/Login sin cambios (ver auth_service) ---

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UsuarioCreate, db: Session = Depends(get_db)):
    new_user = auth_service.create_user(db, user_data)
    token_data = auth_service.create_user_token(new_user)
    return {**token_data, "user": UsuarioResponse.model_validate(new_user)}

@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db), request: Request = None):
    user = auth_service.get_user_by_email(db, credentials.email)
    if not user or not auth_service.verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos", headers={"WWW-Authenticate": "Bearer"})
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    if getattr(user, "totp_enabled", False):
        temp = create_access_token({"sub": str(user.id), "type": "2fa_temp"}, expires_delta=__import__('datetime').timedelta(minutes=5))
        return {"requires2FA": True, "tempToken": temp, "detail": "2FA requerido"}
    if user.rol == 'administrador' and not getattr(user, "totp_enabled", False):
        # admin nuevo sin 2FA: entra solo a configurarlo, operaciones siguen en 428
        temp = create_access_token({"sub": str(user.id), "type": "setup_2fa"}, expires_delta=__import__('datetime').timedelta(minutes=10))
        return {"requiresSetup2FA": True, "tempToken": temp, "detail": "Admin requiere 2FA, activa en Admin Configuración"}
    return {**auth_service.create_user_token(user), "user": UsuarioResponse.model_validate(user)}

@router.post("/2fa/verify-login")
@limiter.limit("5/minute")  # rate 5/min por IP
def verify_login(payload: Verify2FARequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    code = payload.code.strip()
    # recovery Hex8: un solo uso, se marca usado
    if len(code) == 8:
        rows = db.query(TotpRecoveryCode).filter(
            TotpRecoveryCode.usuario_id == current_user.id,
            TotpRecoveryCode.usado == False,
        ).all()
        for row in rows:
            if verify_password(code, row.code_hash):
                row.usado = True
                db.commit()
                return {**auth_service.create_user_token(current_user), "user": UsuarioResponse.model_validate(current_user)}
        raise HTTPException(400, "Código de recuperación inválido o ya usado")
    # single-use: verify_totp con user_id previene replay misma ventana 30s
    secret_enc = getattr(current_user, "totp_secret_encrypted", None)
    if not secret_enc:
        raise HTTPException(400, "No hay secreto")
    secret = decrypt_secret(secret_enc)
    if not auth_service.verify_totp(secret, code, str(current_user.id)):
        raise HTTPException(400, "Código 2FA inválido")
    return {**auth_service.create_user_token(current_user), "user": UsuarioResponse.model_validate(current_user)}

@router.get("/me", response_model=UsuarioResponse)
def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout():
    return {"message": "Sesión cerrada exitosamente. Elimine el token del cliente."}

# 1. Iniciar activación 2FA: genera secreto, NO activa, devuelve QR base64 + secret Base32
@router.post("/2fa/enable", response_model=Enable2FAResponse)
@limiter.limit("5/minute")
def totp_enable(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    secret = auth_service.generate_totp_secret()
    enc = encrypt_secret(secret)
    current_user.totp_secret_encrypted = enc
    current_user.totp_enabled = False  # no activar aún
    db.commit()
    uri = auth_service.get_totp_uri(secret, current_user.email)
    img = qrcode.make(uri); buf = io.BytesIO(); img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode()
    return {"secret": secret, "otpauth_url": uri, "qr_base64": f"data:image/png;base64,{b64}"}

# 2. Confirmar activación: window=1 + single-use + recovery 1 uso
@router.post("/2fa/confirm")
@limiter.limit("5/minute")
def totp_confirm(payload: Verify2FARequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    enc = getattr(current_user, "totp_secret_encrypted", None)
    if not enc:
        raise HTTPException(400, "No hay secreto generado, usa /enable")
    secret = decrypt_secret(enc)
    # window=1 => ±30s, evita replay prolongado (decisión: balance drift vs seguridad)
    # single-use cache 30s en auth_service.verify_totp con _used set
    if not auth_service.verify_totp(secret, payload.code, str(current_user.id)):
        raise HTTPException(400, "Código 2FA inválido")
    current_user.totp_enabled = True
    # backup codes 1 uso tabla aparte, hash bcrypt
    codes = auth_service.generate_recovery_codes(db, current_user)  # 5 Hex8 hasheados
    db.commit()
    # NO devolver secret de nuevo, solo recovery
    return {"totp_enabled": True, "recovery_codes": codes}

@router.get("/2fa/status")
def totp_status(current_user=Depends(get_current_user)):
    return {"totp_enabled": bool(getattr(current_user, "totp_enabled", False))}

# 4. Desactivar requiere password + code vigente (no solo sesión)
@router.post("/2fa/disable")
@limiter.limit("5/minute")
def totp_disable(payload: Disable2FARequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(401, "Contraseña incorrecta")
    enc = getattr(current_user, "totp_secret_encrypted", None)
    if not enc or not auth_service.verify_totp(decrypt_secret(enc), payload.code, str(current_user.id)):
        raise HTTPException(400, "Código 2FA inválido")
    current_user.totp_secret_encrypted = None
    current_user.totp_enabled = False
    db.query(TotpRecoveryCode).filter_by(usuario_id=current_user.id).delete()
    db.commit()
    return {"totp_enabled": False}

@router.post("/reestablecer-contraseña")
def cambiar_password(data: CambiarPasswordRequest, db: Session = Depends(get_db)):
    auth_service.cambiar_password(db=db, email=data.email, password_actual=data.password_actual, password_nueva=data.password_nueva)
    return {"message": "Contraseña actualizada exitosamente"}
