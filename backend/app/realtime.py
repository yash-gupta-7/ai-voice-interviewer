# Mints a SHORT-LIVED ephemeral token so the BROWSER connects directly to the
# voice provider. The real API key never leaves the server.
# Uses OpenAI Realtime ephemeral sessions. // TODO: confirm provider.
import httpx
from .config import settings

OPENAI_SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions"

async def mint_ephemeral_token(instructions: str) -> dict:
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.realtime_model,
        "voice": "alloy",            # // TODO: confirm voice
        "instructions": instructions,
        "turn_detection": {"type": "server_vad"},  # provider VAD (spec 11)
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(OPENAI_SESSIONS_URL, headers=headers, json=body)
        r.raise_for_status()
        return r.json()  # contains client_secret.value (ephemeral) + expiry
