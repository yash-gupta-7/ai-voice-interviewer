from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import init_db
from .routes import router
from .ws import ws_router

app = FastAPI(title="AI Voice Interviewer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(router, prefix="/api")
app.include_router(ws_router, prefix="/api/ws")
# minor change
