import os
import json
import httpx
import tempfile
import base64
from typing import List, Dict, Any
from .config import settings

GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech"

async def transcribe_audio_groq(audio_bytes: bytes, filename="audio.webm") -> str:
    """Send audio bytes to Groq Whisper for transcription."""
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    
    # We must send as multipart/form-data
    files = {
        "file": (filename, audio_bytes, "audio/webm"),
    }
    data = {
        "model": settings.model,
        "response_format": "json"
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(GROQ_AUDIO_URL, headers=headers, data=data, files=files)
        if not r.is_success:
            raise ValueError(f"Groq STT error {r.status_code}: {r.text}")
        return r.json().get("text", "")

async def generate_chat_response_groq(messages: List[Dict[str, str]]) -> str:
    """Get the interviewer's response from Groq LLM."""
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json"
    }
    body = {
        "model": settings.groq_llm_model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 150 # keep responses concise for voice
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(GROQ_CHAT_URL, headers=headers, json=body)
        if not r.is_success:
            raise ValueError(f"Groq LLM error {r.status_code}: {r.text}")
        return r.json()["choices"][0]["message"]["content"]

async def synthesize_speech_groq(text: str) -> bytes:
    """Generate audio from text using gTTS (unlimited, no API key)."""
    from gtts import gTTS
    import io
    
    # Run gTTS synchronously in a thread (though it's fast enough we can just do it inline here for now)
    tts = gTTS(text=text, lang='en', tld='us') # US English accent
    fp = io.BytesIO()
    tts.write_to_fp(fp)
    fp.seek(0)
    return fp.read()
