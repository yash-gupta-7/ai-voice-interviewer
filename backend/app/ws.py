# Control/state channel ONLY (no audio). Receives turn events from the client,
# updates state via the deterministic engine, persists EVERY turn,
# and returns the next move + timer + phase.
import json
import base64
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
from .config import settings
from .db import SessionLocal
from .models import Interview, Message, User
from .state_engine import advance, record_turn
from .audio_pipeline import transcribe_audio_groq, generate_chat_response_groq, synthesize_speech_groq
from .routes import _interviewer_instructions

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

        # Mark as running on connect if not already
        if iv.status != "running":
            iv.status = "running"
            iv.started_at = datetime.utcnow()
            db.commit()

        state = json.loads(iv.state_json or "{}")

        # Get system instructions
        instructions = _interviewer_instructions(iv, state.get("jd_skills", []))

        # Initial greeting if no messages
        msgs = db.query(Message).filter(Message.interview_id == iid).order_by(Message.ts).all()
        if not msgs:
            # Generate the first message proactively
            initial_prompt = [{"role": "system", "content": instructions}, {"role": "user", "content": "Hello, I am ready to begin the interview."}]
            try:
                ai_text = await generate_chat_response_groq(initial_prompt)
                ai_audio = await synthesize_speech_groq(ai_text)
                
                db.add(Message(interview_id=iid, role="interviewer", text=ai_text, ts=datetime.utcnow()))
                db.commit()
                
                await ws.send_text(json.dumps({
                    "type": "ai_response",
                    "text": ai_text,
                    "audio_b64": base64.b64encode(ai_audio).decode("utf-8")
                }))
            except Exception as e:
                print(f"[ws] Error generating initial greeting: {e}")

        while True:
            raw = await ws.receive_text()
            try:
                evt = json.loads(raw)
            except json.JSONDecodeError:
                continue  # ignore malformed messages

            if evt.get("type") == "audio_chunk":
                audio_b64 = evt.get("audio_b64", "")
                elapsed = int(evt.get("elapsed_sec", 0))

                # 1. Decode & Transcribe
                try:
                    audio_bytes = base64.b64decode(audio_b64)
                    candidate_text = await transcribe_audio_groq(audio_bytes)
                except Exception as e:
                    print(f"[ws] STT error: {e}")
                    await ws.send_text(json.dumps({"type": "error", "message": "Failed to transcribe audio"}))
                    continue

                if not candidate_text.strip():
                    # Send state update anyway
                    await ws.send_text(json.dumps({
                        "type": "state",
                        "phase": state.get("phase", ""),
                        "time_remaining_sec": state.get("time_remaining_sec", 0),
                    }))
                    continue

                # Save candidate text
                if iv.save_transcript:
                    db.add(Message(interview_id=iid, role="candidate", text=candidate_text, ts=datetime.utcnow()))

                state = record_turn(state, "candidate", candidate_text)
                state = advance(state, elapsed)
                iv.state_json = json.dumps(state)
                db.commit()

                # Send state update
                await ws.send_text(json.dumps({
                    "type": "state",
                    "phase": state["phase"],
                    "time_remaining_sec": state["time_remaining_sec"],
                    "next_move": state["next_move"],
                    "next_objective": state["next_objective"],
                    "candidate_text": candidate_text, # send back what we transcribed
                }))

                # 2. Generate LLM response
                msgs = db.query(Message).filter(Message.interview_id == iid).order_by(Message.ts).all()
                chat_history = [{"role": "system", "content": instructions}]
                
                # Add context about the current phase / objective from the state engine
                chat_history.append({
                    "role": "system", 
                    "content": f"CURRENT PHASE: {state['phase']}\nYOUR NEXT OBJECTIVE: {state['next_objective']}"
                })
                
                for m in msgs:
                    role = "assistant" if m.role == "interviewer" else "user"
                    chat_history.append({"role": role, "content": m.text})

                try:
                    ai_text = await generate_chat_response_groq(chat_history)
                    # 3. Generate TTS
                    ai_audio_bytes = await synthesize_speech_groq(ai_text)
                    
                    if iv.save_transcript:
                        db.add(Message(interview_id=iid, role="interviewer", text=ai_text, ts=datetime.utcnow()))
                    
                    state = record_turn(state, "interviewer", ai_text)
                    iv.state_json = json.dumps(state)
                    db.commit()

                    await ws.send_text(json.dumps({
                        "type": "ai_response",
                        "text": ai_text,
                        "audio_b64": base64.b64encode(ai_audio_bytes).decode("utf-8")
                    }))
                except Exception as e:
                    print(f"[ws] LLM/TTS error: {e}")
                    await ws.send_text(json.dumps({"type": "error", "message": "Failed to generate AI response"}))

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        print(f"[ws] unexpected error for {iid}: {exc}")
    finally:
        db.close()

