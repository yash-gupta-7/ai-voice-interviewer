import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from .db import get_db
from .models import User, Interview, Message, Report
from .schemas import LoginIn, CreateInterviewIn
from .auth import current_user, get_or_create_user, make_session_token
from .config import settings
from .state_engine import new_state
from .realtime import exchange_sdp
from . import llm

router = APIRouter()

@router.post("/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = get_or_create_user(db, body.email)
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
    return (
        "You are a senior software engineer conducting a system-design interview. "
        "DRIVE the conversation. Ask ONE question at a time. Keep replies to 1-3 "
        "sentences. Ground follow-ups in the JD skills or what the candidate just "
        f"said. Difficulty: {iv.difficulty}. Duration: {iv.duration_min} min. "
        f"JD skills to assess: {skills}. Use exactly ONE light challenge. "
        "Max 2 laddered hints. Reserve the end for a brief wrap-up. "
        "Start by introducing yourself briefly, then ask the first question."
    )

@router.post("/interviews/{iid}/sdp")
async def handle_sdp(
    iid: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    sdp_offer: str = Body(..., media_type="text/plain"),
):
    """
    Browser posts its WebRTC SDP offer here. Backend forwards it to OpenAI
    Realtime (unified interface) and returns the SDP answer. 
    The real API key never leaves the server.
    """
    iv = db.query(Interview).filter(Interview.id == iid,
                                    Interview.user_id == user.id).first()
    if not iv:
        raise HTTPException(404, "Not found")

    state = json.loads(iv.state_json or "{}")
    instructions = _interviewer_instructions(iv, state.get("jd_skills", []))

    try:
        sdp_answer = await exchange_sdp(sdp_offer, instructions)
    except Exception as e:
        raise HTTPException(502, f"Realtime API error: {str(e)}")

    iv.status = "running"
    iv.started_at = datetime.utcnow()
    db.commit()

    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(sdp_answer, media_type="application/sdp")

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
