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

    extraction = await llm.extract_skills(body.jd_text)
    skills = extraction.get("skills", [])
    title = extraction.get("title", "Technical Interview")
    
    iv = Interview(user_id=user.id, jd_text=body.jd_text,
                   duration_min=body.duration_min, difficulty=body.difficulty,
                   save_transcript=body.save_transcript)
    db.add(iv); db.commit(); db.refresh(iv)
    state = new_state(iv.id, iv.duration_min, iv.difficulty, skills, title)
    iv.state_json = json.dumps(state); db.commit()
    return {"id": iv.id, "jd_skills": skills, "title": title}

def _interviewer_instructions(iv: Interview, skills) -> str:
    skills_list = ", ".join(skills) if skills else "general technical skills"
    return (
        "You are a strict, professional senior software engineer conducting a technical interview.\n"
        "YOU MUST ALWAYS SPEAK ENGLISH. Do not speak any other language.\n\n"
        "=== INTERVIEW PARAMETERS ===\n"
        f"Difficulty: {iv.difficulty}\n"
        f"Duration: {iv.duration_min} minutes\n"
        f"CORE INTERVIEW TOPIC / JOB DESCRIPTION: \"{iv.jd_text}\"\n"
        f"KEY TECHNICAL SKILLS TO ASSESS: [{skills_list}]\n\n"
        "=== STRICT RULES — YOU MUST FOLLOW ALL OF THESE ===\n\n"
        "RULE 1: You must dynamically generate technical questions based EXACTLY on the 'CORE INTERVIEW TOPIC / JOB DESCRIPTION' and 'KEY TECHNICAL SKILLS' listed above. "
        "Under NO CIRCUMSTANCES should you ask generic questions (e.g., 'tell me about a time...', 'what are your strengths') "
        "or technical questions outside the scope of the provided topic.\n\n"
        "RULE 2: Before asking any question, internally verify: 'Does this question directly test the candidate's knowledge of the specified topic?' "
        "If it doesn't, YOU MUST NOT ASK IT.\n\n"
        "RULE 3: Track which requirements have been covered. Do NOT move to the next topic until the "
        "current one is sufficiently explored or the candidate explicitly passes.\n\n"
        "RULE 4: For follow-up questions, ONLY probe deeper into the candidate's previous answer to test technical depth. "
        "Do NOT introduce new unrelated topics in a follow-up.\n\n"
        "RULE 5: Keep questions concise (1-2 sentences). Ask ONE question at a time. "
        "NEVER ask compound questions.\n\n"
        "RULE 6: If the candidate's answer is unclear, ask ONE targeted clarifying question before moving on.\n\n"
        "RULE 7: Do NOT provide answers, hints, or correctness feedback. "
        "Never say 'That is correct' or 'Actually, the answer is...'\n\n"
        "RULE 8: If the candidate goes off-topic, politely interrupt and redirect them to the technical question ONCE. "
        "If they go off-topic again, move to the next requirement.\n\n"
        "RULE 9: NEVER fabricate facts about the company or role.\n\n"
        "RULE 10: End the interview after all requirements are covered or when time runs out.\n\n"
        "=== BEHAVIOR ===\n"
        "- Start by introducing yourself briefly (1 sentence), then immediately ask the FIRST technical question targeting the first requirement.\n"
        "- Keep all your replies short and direct (1-3 sentences max).\n"
        "- Maintain a highly professional, focused, and objective tone.\n"
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
    state = json.loads(iv.state_json or "{}")
    return {"report_md": rep.report_md, "title": state.get("title", "Technical Interview")}

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
