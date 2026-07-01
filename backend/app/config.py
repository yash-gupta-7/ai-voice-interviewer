from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at project root: backend/app/config.py -> ../../.env
_env_file = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_env_file),
        extra="ignore",   # ignore DOMAIN and any other extra env vars
    )

    # --- core ---
    app_secret: str = "change-me"           # signs session tokens
    database_url: str                       # REQUIRED — must be set in .env as DATABASE_URL
    frontend_origin: str = "http://localhost:5173"

    # --- groq (STT, LLM, TTS) ---
    groq_api_key: str = ""
    model: str = "whisper-large-v3-turbo"    # STT model
    groq_llm_model: str = "llama-3.3-70b-versatile"
    tts_model: str = "canopylabs/orpheus-v1-english"            # Groq TTS model

    # --- guardrails ---
    max_interviews_per_user_per_day: int = 5
    global_daily_session_budget: int = 200  # kill-switch threshold

settings = Settings()
