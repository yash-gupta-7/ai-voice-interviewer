import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from .db import Base

def _id() -> str:
    return uuid.uuid4().hex

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=_id)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(String, primary_key=True, default=_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="created")  # created|running|completed|aborted
    jd_text = Column(Text, default="")
    duration_min = Column(Integer, default=5)   # 5|10|15
    difficulty = Column(String, default="medium")
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    save_transcript = Column(Boolean, default=True)
    state_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=_id)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    role = Column(String, nullable=False)  # interviewer|candidate|system
    text = Column(Text, default="")
    ts = Column(DateTime, default=datetime.utcnow)

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, default=_id)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    rubric_json = Column(Text, default="{}")
    report_md = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
