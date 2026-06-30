from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",   # ignore DOMAIN and any other extra env vars
    )

    # --- core ---
    app_secret: str = "change-me"           # signs session tokens
    db_path: str = "./data/app.db"          # local path (Docker uses /data/app.db)
    frontend_origin: str = "http://localhost:5173"

    # --- groq (STT, LLM, TTS) ---
    groq_api_key: str = ""
    model: str = "whisper-large-v3"          # STT model
    groq_llm_model: str = "llama-3.1-70b-versatile"
    tts_model: str = "playai-tts"            # Groq TTS model

    # --- guardrails ---
    max_interviews_per_user_per_day: int = 5
    global_daily_session_budget: int = 200  # kill-switch threshold

settings = Settings()
