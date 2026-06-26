import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# Resolve db_path relative to the project root (two levels up from this file:
# backend/app/db.py -> backend/ -> project root)
_project_root = Path(__file__).resolve().parent.parent.parent
_raw_path = settings.db_path

if not os.path.isabs(_raw_path):
    _db_path = str(_project_root / _raw_path)
else:
    _db_path = _raw_path

# Ensure the parent directory exists
os.makedirs(os.path.dirname(_db_path), exist_ok=True)

engine = create_engine(
    f"sqlite:///{_db_path}",
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
