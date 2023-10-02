from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # --- core ---
    app_secret: str = "change-me"           # signs session tokens
    db_path: str = "/data/app.db"           # mounted volume (see compose)
    frontend_origin: str = "https://localhost"

    # --- realtime provider (OpenAI Realtime) // TODO: confirm provider ---
    openai_api_key: str = ""
    realtime_model: str = "gpt-4o-realtime-preview"
    text_model: str = "gpt-4o-mini"         # JD parse + report (cheap)

    # --- guardrails ---
    max_interviews_per_user_per_day: int = 5
    global_daily_session_budget: int = 200  # kill-switch threshold

    class Config:
        env_file = ".env"

settings = Settings()
