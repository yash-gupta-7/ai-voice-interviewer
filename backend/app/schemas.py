from typing import Literal, Optional, List, Dict
from pydantic import BaseModel, EmailStr

Duration = Literal[5, 10, 15]
Difficulty = Literal["easy", "medium", "hard"]

class LoginIn(BaseModel):
    email: EmailStr

class CreateInterviewIn(BaseModel):
    jd_text: str = ""
    duration_min: Duration = 5
    difficulty: Difficulty = "medium"
    save_transcript: bool = True

class InterviewOut(BaseModel):
    id: str
    status: str
    duration_min: int
    difficulty: str
    created_at: str

class RubricDimension(BaseModel):
    name: str
    level: Literal["Below", "Meets", "Exceeds"]
    evidence: str
    strong_answer: str

class Rubric(BaseModel):
    dimensions: List[RubricDimension]
    jd_match_summary: str
    strengths: List[str]
    weaknesses: List[str]
