# auth.py

from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import User

# Secret key for JWT (in production, use environment variable or secrets manager)
SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Bcrypt hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    # Try to find user by username first
    user = db.query(User).filter(User.username == username).first()
    
    # If not found by username, try by email
    if not user:
        user = db.query(User).filter(User.email == username).first()
    
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
