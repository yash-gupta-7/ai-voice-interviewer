import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from .db import get_db
from .models import User, Interview, Message, Report
from .schemas import LoginIn, SignUpIn, CreateInterviewIn
from .auth import current_user, make_session_token, hash_password, verify_password
from .config import settings
from .state_engine import new_state
from . import llm

router = APIRouter()


@router.post("/auth/signup")
def signup(body: SignUpIn, db: Session = Depends(get_db)):
    """Register a new user with email + password."""
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(409, "An account with this email already exists.")
    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": make_session_token(user.id)}


@router.post("/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    """Authenticate with email + password."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(401, "Invalid email or password.")
    # Support legacy accounts without passwords: reject if no password set
    if not user.hashed_password:
        raise HTTPException(401, "This account has no password set. Please sign up again.")
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password.")
    return {"token": make_session_token(user.id)}


@router.post("/interviews")
async def create_interview(body: CreateInterviewIn, user: User = Depends(current_user),
                           db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    # per-user daily rate limit
    user_today = db.query(func.count(Interview.id)).filter(
        Interview.user_id == user.id,
        func.date(Interview.created_at) == today).scalar()
    if user_today >= settings.max_interviews_per_user_per_day:
        raise HTTPException(429, "Daily interview limit reached. Try again tomorrow.")
    # global spend kill-switch
    global_today = db.query(func.count(Interview.id)).filter(
        func.date(Interview.created_at) == today).scalar()
    if global_today >= settings.global_daily_session_budget:
        raise HTTPException(503, "Service is busy right now. Please try later.")

    skills = await llm.extract_skills(body.jd_text)
    iv = Interview(user_id=user.id, jd_text=body.jd_text,
                   duration_min=body.duration_min, difficulty=body.difficulty,
                   save_transcript=body.save_transcript)
    db.add(iv); db.commit(); db.refresh(iv)
    state = new_state(iv.id, iv.duration_min, iv.difficulty, skills)
    iv.state_json = json.dumps(state); db.commit()
    return {"id": iv.id, "jd_skills": skills}

def _interviewer_instructions(iv: Interview, skills) -> str:
    skills_list = ", ".join(skills) if skills else "general system design"
    return (
        "You are a strict, professional senior software engineer conducting a system-design interview.\n"
        "YOU MUST ALWAYS SPEAK ENGLISH. Do not speak any other language.\n\n"

        "=== INTERVIEW PARAMETERS ===\n"
        f"Difficulty: {iv.difficulty}\n"
        f"Duration: {iv.duration_min} minutes\n"
        f"JOB REQUIREMENTS (skills to assess): [{skills_list}]\n\n"

        "=== STRICT RULES — YOU MUST FOLLOW ALL OF THESE ===\n\n"

        "RULE 1: You may ONLY ask questions that map directly to one of the JOB REQUIREMENTS listed above. "
        "Do NOT ask generic interview questions unrelated to these requirements.\n\n"

        "RULE 2: Before asking any question, internally verify: 'Which specific JOB REQUIREMENT does this "
        "question test?' If you cannot name one, do NOT ask it.\n\n"

        "RULE 3: Track which requirements have been covered. Do NOT move to the next question until the "
        "current one is either answered or the candidate explicitly passes.\n\n"

        "RULE 4: For follow-up questions, ONLY probe deeper into what the candidate just said. "
        "Do NOT introduce new unrelated topics in a follow-up.\n\n"

        "RULE 5: Keep questions concise (1-2 sentences). Ask ONE question at a time. "
        "NEVER ask compound questions (multiple questions joined together).\n\n"

        "RULE 6: If the candidate's answer is unclear or incomplete, ask ONE targeted clarifying question "
        "before moving on. Do NOT loop indefinitely on the same topic.\n\n"

        "RULE 7: Do NOT provide answers, hints, or correctness feedback during the interview. "
        "Do NOT tell the candidate if they are right or wrong.\n\n"

        "RULE 8: If the candidate goes off-topic, politely redirect to the current question ONCE. "
        "If they go off-topic again, move to the next requirement.\n\n"

        "RULE 9: NEVER fabricate facts about the company, role, or compensation. "
        "If asked something outside your knowledge, say you will have the recruiter follow up.\n\n"

        "RULE 10: End the interview after all JOB REQUIREMENTS are covered or when time runs out, "
        "whichever comes first. Reserve the final ~15%% of time for a brief wrap-up.\n\n"

        "=== BEHAVIOR ===\n"
        "- Start by introducing yourself briefly, then ask the FIRST question targeting the first requirement.\n"
        "- Keep replies to 1-3 sentences.\n"
        "- Use exactly ONE light challenge/constraint change during the interview.\n"
        "- Your tone should match the difficulty level: supportive for easy, balanced for medium, rigorous for hard.\n"
    )

@router.post("/interviews/{iid}/complete")
async def complete(iid: str, user: User = Depends(current_user),
                   db: Session = Depends(get_db)):
    iv = db.query(Interview).filter(Interview.id == iid,
                                    Interview.user_id == user.id).first()
    if not iv:
        raise HTTPException(404, "Not found")
    msgs = db.query(Message).filter(Message.interview_id == iid).order_by(Message.ts).all()
    transcript = "\n".join(f"{m.role}: {m.text}" for m in msgs)
    state = json.loads(iv.state_json or "{}")
    rubric = await llm.generate_report(transcript, state.get("jd_skills", []))
    md = llm.render_report_md(rubric)
    rep = Report(interview_id=iid, rubric_json=rubric.model_dump_json(), report_md=md)
    db.add(rep)
    iv.status = "completed"; iv.ended_at = datetime.utcnow(); db.commit()
    return {"report_md": md}

@router.get("/interviews")
def list_interviews(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Interview).filter(Interview.user_id == user.id)\
        .order_by(Interview.created_at.desc()).all()
    return [{"id": r.id, "status": r.status, "duration_min": r.duration_min,
             "difficulty": r.difficulty, "created_at": r.created_at.isoformat()} for r in rows]

@router.get("/interviews/{iid}/report")
def get_report(iid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    iv = db.query(Interview).filter(Interview.id == iid,
                                    Interview.user_id == user.id).first()
    if not iv:
        raise HTTPException(404, "Not found")
    rep = db.query(Report).filter(Report.interview_id == iid)\
        .order_by(Report.created_at.desc()).first()
    if not rep:
        raise HTTPException(404, "No report yet")
    return {"report_md": rep.report_md}

@router.delete("/interviews/{iid}")
def delete_interview(iid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    iv = db.query(Interview).filter(Interview.id == iid,
                                    Interview.user_id == user.id).first()
    if not iv:
        raise HTTPException(404, "Not found")
    db.query(Message).filter(Message.interview_id == iid).delete()
    db.query(Report).filter(Report.interview_id == iid).delete()
    db.delete(iv); db.commit()
    return {"ok": True}
