from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,          # reconnect on stale Supabase connections
    pool_size=5,
    max_overflow=10,
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
