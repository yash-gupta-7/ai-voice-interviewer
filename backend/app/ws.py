# Control/state channel ONLY (no audio). Receives turn events from the client,
# updates state via the deterministic engine, persists EVERY turn,
# and returns the next move + timer + phase.
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
from .config import settings
from .db import SessionLocal
from .models import Interview, Message, User
from .state_engine import advance, record_turn

ws_router = APIRouter()

ALGO = "HS256"

@ws_router.websocket("/interviews/{iid}/control")
async def control(
    ws: WebSocket,
    iid: str,
    token: str = Query(default=""),
):
    await ws.accept()
    db = SessionLocal()
    try:
        # Auth gate: validate JWT passed as ?token= query param
        if not token:
            await ws.close(code=4401, reason="Missing token")
            return
        try:
            payload = jwt.decode(token, settings.app_secret, algorithms=[ALGO])
            user_id = payload.get("sub")
        except JWTError:
            await ws.close(code=4403, reason="Invalid token")
            return

        # Validate interview ownership
        iv = db.query(Interview).filter(
            Interview.id == iid,
            Interview.user_id == user_id,
        ).first()
        if not iv:
            await ws.close(code=4404, reason="Interview not found")
            return

        state = json.loads(iv.state_json or "{}")

        while True:
            raw = await ws.receive_text()
            try:
                evt = json.loads(raw)
            except json.JSONDecodeError:
                continue  # ignore malformed messages

            if evt.get("type") == "turn":
                role = evt.get("role", "candidate")
                text = evt.get("text", "")
                elapsed = int(evt.get("elapsed_sec", 0))

                if iv.save_transcript and text.strip():
                    db.add(Message(
                        interview_id=iid,
                        role=role,
                        text=text,
                        ts=datetime.utcnow(),
                    ))

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
    except Exception as exc:
        print(f"[ws] unexpected error for {iid}: {exc}")
    finally:
        db.close()
