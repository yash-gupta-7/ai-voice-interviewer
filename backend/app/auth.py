from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import User

ALGO = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def make_session_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, settings.app_secret, algorithm=ALGO)


def get_or_create_user(db: Session, email: str) -> User:
    """Legacy stub: get or create user WITHOUT a password (used nowhere now, kept for compat)."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(token, settings.app_secret, algorithms=[ALGO])
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(401, "Unknown user")
    return user
