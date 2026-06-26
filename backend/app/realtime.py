# Handles WebRTC SDP exchange with OpenAI Realtime API (unified interface).
# The browser sends its SDP offer to our backend, which forwards it to OpenAI
# along with the real API key and session config. The backend never exposes the key.
import httpx
from .config import settings

OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls"

async def exchange_sdp(sdp_offer: str, instructions: str) -> str:
    """
    Send browser SDP offer to OpenAI Realtime and return the SDP answer.
    Uses multipart form: 'sdp' (the offer) + 'session' (JSON config).
    """
    import json

    session_config = json.dumps({
        "model": settings.realtime_model,
        "voice": "alloy",
        "instructions": instructions,
        "turn_detection": {"type": "server_vad"},
        "input_audio_transcription": {"model": "whisper-1"},
    })

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            OPENAI_REALTIME_CALLS_URL,
            headers=headers,
            data={"session": session_config},
            files={"sdp": ("offer.sdp", sdp_offer, "application/sdp")},
        )
        r.raise_for_status()
        return r.text  # SDP answer string
