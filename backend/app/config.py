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

    # --- realtime provider (OpenAI Realtime) ---
    openai_api_key: str = ""
    realtime_model: str = "gpt-4o-realtime-preview"
    text_model: str = "gpt-4o-mini"         # JD parse + report (cheap)

    # --- guardrails ---
    max_interviews_per_user_per_day: int = 5
    global_daily_session_budget: int = 200  # kill-switch threshold

settings = Settings()
