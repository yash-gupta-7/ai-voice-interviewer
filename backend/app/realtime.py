# Handles WebRTC SDP exchange with OpenAI Realtime API (unified interface).
# The browser sends its SDP offer to our backend, which forwards it to OpenAI
# along with the real API key and session config. The real key never leaves the server.
import httpx
from .config import settings

OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls"

async def exchange_sdp(sdp_offer: str, instructions: str) -> str:
    """
    Send the browser's WebRTC SDP offer to OpenAI Realtime and return the SDP answer.
    Format: POST raw SDP body with Content-Type: application/sdp,
    model and other config passed as query parameters.
    """
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/sdp",
    }

    params = {
        "model": settings.realtime_model,
        "voice": "alloy",
        "instructions": instructions,
        "modalities": "audio,text",
        "input_audio_transcription[model]": "whisper-1",
        "turn_detection[type]": "server_vad",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            OPENAI_REALTIME_CALLS_URL,
            headers=headers,
            params=params,
            content=sdp_offer.encode("utf-8"),
        )
        if not r.is_success:
            raise ValueError(f"OpenAI Realtime returned {r.status_code}: {r.text[:400]}")
        return r.text  # SDP answer string
