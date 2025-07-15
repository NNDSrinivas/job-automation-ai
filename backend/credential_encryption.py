from cryptography.fernet import Fernet
import os
import base64
from typing import Optional

class CredentialEncryption:
    def __init__(self):
        # Get encryption key from environment or generate one
        self.key = self._get_or_create_key()
        self.fernet = Fernet(self.key)

    def _get_or_create_key(self) -> bytes:
        """Get encryption key from environment or create a new one"""
        key_str = os.getenv('CREDENTIAL_ENCRYPTION_KEY')
        if key_str:
            return key_str.encode()
        else:
            # Generate a new key (in production, this should be stored securely)
            key = Fernet.generate_key()
            print(f"Generated new encryption key: {key.decode()}")
            print("Please set CREDENTIAL_ENCRYPTION_KEY environment variable with this key")
            return key

    def encrypt_password(self, password: str) -> str:
        """Encrypt a password"""
        return self.fernet.encrypt(password.encode()).decode()

    def decrypt_password(self, encrypted_password: str) -> str:
        """Decrypt a password"""
        return self.fernet.decrypt(encrypted_password.encode()).decode()

# Global instance
credential_encryption = CredentialEncryption()
