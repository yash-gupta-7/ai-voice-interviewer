# Control/state channel ONLY (no audio). Receives turn events from the client,
# updates state via the deterministic engine, persists EVERY turn (spec 3),
# and returns the next move + timer + phase.
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .db import SessionLocal
from .models import Interview, Message
from .state_engine import advance, record_turn

ws_router = APIRouter()

@ws_router.websocket("/interviews/{iid}/control")
async def control(ws: WebSocket, iid: str):
    await ws.accept()
    db = SessionLocal()
    try:
        iv = db.query(Interview).filter(Interview.id == iid).first()
        if not iv:
            await ws.close(code=4404); return
        state = json.loads(iv.state_json or "{}")
        while True:
            raw = await ws.receive_text()
            evt = json.loads(raw)
            # evt = {type:"turn", role, text, elapsed_sec}
            if evt.get("type") == "turn":
                role = evt.get("role", "candidate")
                text = evt.get("text", "")
                elapsed = int(evt.get("elapsed_sec", 0))
                if iv.save_transcript and text.strip():
                    db.add(Message(interview_id=iid, role=role, text=text,
                                   ts=datetime.utcnow()))
                state = record_turn(state, role, text)
                state = advance(state, elapsed)
                iv.state_json = json.dumps(state)
                db.commit()  # persist EVERY turn
                await ws.send_text(json.dumps({
                    "type": "state",
                    "phase": state["phase"],
                    "time_remaining_sec": state["time_remaining_sec"],
                    "next_move": state["next_move"],
                    "next_objective": state["next_objective"],
                }))
    except WebSocketDisconnect:
        pass
    finally:
        db.close()
