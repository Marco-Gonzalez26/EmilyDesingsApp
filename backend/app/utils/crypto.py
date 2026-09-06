import os, base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

load_dotenv()

def _get_key() -> bytes:
    b64 = os.getenv("TOTP_ENCRYPTION_KEY")
    if not b64:
        # dev fallback 32B zero key — no usar en prod, solo para no romper sin env
        return b"\x00" * 32
    # espera base64 de 32 bytes (44 chars con padding)
    return base64.b64decode(b64)

def encrypt_secret(plain: str) -> str:
    """AES-256-GCM: nonce 12B random + ct+tag base64"""
    key = _get_key()
    aes = AESGCM(key)
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, plain.encode(), None)  # tag 16B incluido
    return base64.b64encode(nonce + ct).decode()

def decrypt_secret(enc: str) -> str:
    raw = base64.b64decode(enc)
    nonce, ct = raw[:12], raw[12:]
    return AESGCM(_get_key()).decrypt(nonce, ct, None).decode()
