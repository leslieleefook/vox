"""Encryption service for secure credential storage."""
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def _get_encryption_key() -> bytes:
    """Get or derive the encryption key from environment."""
    # Try to get a pre-generated Fernet key first
    fernet_key = os.getenv("CREDENTIAL_ENCRYPTION_KEY")
    if fernet_key:
        return fernet_key.encode() if isinstance(fernet_key, str) else fernet_key

    # Derive key from secret + salt (for development)
    secret = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    salt = os.getenv("ENCRYPTION_SALT", "vox-encryption-salt")

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt.encode(),
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return key


_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    """Get or create Fernet instance."""
    global _fernet
    if _fernet is None:
        key = _get_encryption_key()
        _fernet = Fernet(key)
    return _fernet


def encrypt_value(plaintext: str) -> str:
    """Encrypt a credential value.

    Args:
        plaintext: The value to encrypt

    Returns:
        Encrypted value as a string
    """
    fernet = _get_fernet()
    encrypted = fernet.encrypt(plaintext.encode())
    return encrypted.decode()


def decrypt_value(encrypted: str) -> str:
    """Decrypt a credential value.

    Args:
        encrypted: The encrypted value

    Returns:
        Decrypted plaintext value
    """
    fernet = _get_fernet()
    decrypted = fernet.decrypt(encrypted.encode())
    return decrypted.decode()
