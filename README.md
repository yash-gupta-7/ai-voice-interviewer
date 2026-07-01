# 🎙️ AI Voice Interviewer

An open-source, full-stack AI platform that conducts realistic, voice-to-voice technical interviews. 

By simply pasting a Job Description (JD), the platform dynamically extracts the required technical skills and conducts a strict, professional voice interview over WebSockets. Once the interview concludes, it generates a comprehensive, strictly-scored rubric evaluating the candidate's performance across multiple dimensions.

![AI Voice Interviewer](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **Voice-to-Voice Realtime WebSockets:** Low-latency conversational architecture using WebRTC/Web Audio APIs and FastAPI WebSockets.
- **Dynamic Skill Extraction:** Paste *any* Job Description or keyword list. The AI automatically parses it, titles the interview, and generates a custom interview loop based strictly on those requirements.
- **Advanced Voice Activity Detection (VAD):** The React frontend automatically detects when you stop speaking to seamlessly hand the turn back to the AI.
- **Comprehensive Grading & Rubrics:** Generates a highly detailed Markdown report scoring the candidate out of 10 on Articulation, Depth of Knowledge, Technical Expertise, and Problem Solving, plus an overall score out of 100.
- **Unlimited Free Audio:** Uses Groq's insanely fast Whisper (Llama 3) for STT and Google's unlimited `gTTS` engine for TTS to bypass API rate limits.

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Glassmorphism aesthetic
- **Animations & Icons:** Framer Motion + Lucide React
- **Audio:** Native Web Audio API + MediaRecorder

### Backend
- **Framework:** Python 3.13 + FastAPI + Uvicorn
- **Database:** SQLAlchemy ORM (designed for PostgreSQL / Supabase)
- **Authentication:** JWT (JSON Web Tokens) with Passlib bcrypt hashing
- **AI/LLM:** Groq API (`llama-3.3-70b-versatile` & `whisper-large-v3-turbo`)
- **TTS:** Google Text-to-Speech (`gTTS`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (3.11+)
- A [Groq API Key](https://console.groq.com/keys) (Free)
- A PostgreSQL Database URL (e.g., [Supabase](https://supabase.com/))

### 2. Environment Setup
Create a `.env` file in the **root** of the project:
```env
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
GROQ_API_KEY="gsk_your_groq_api_key_here"
```

### 3. Backend Setup
Navigate to the `backend` directory, install dependencies, and run the server:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*The backend will run on `http://127.0.0.1:8000`*

### 4. Frontend Setup
Open a new terminal, navigate to the `frontend` directory, install dependencies, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## 🐋 Docker Setup

If you prefer to run the backend via Docker, a `docker-compose.yml` is provided at the root:

```bash
docker-compose up --build -d
```
*Make sure your `.env` file is present in the root directory before running Docker.*

---

## 🧠 How it Works (Under the Hood)

1. **Initialization:** The user pastes a JD. The backend LLM extracts skills (e.g. `["React", "Node.js", "System Design"]`) and generates a title.
2. **WebSocket Connection:** The frontend connects to `/api/ws/interviews/{id}/control`. The backend state machine initializes to the `exploration` phase.
3. **Turn-Based Loop:**
   - **User speaks:** The frontend VAD detects silence and uploads the audio Blob as base64 to the WebSocket.
   - **STT:** The backend decodes the audio and sends it to Groq Whisper for transcription.
   - **State Engine:** The backend updates the interview state machine (managing time and conversational phase).
   - **LLM Context:** The transcript, combined with strict system prompts enforcing the current phase, is sent to Llama 3 on Groq.
   - **TTS:** The AI's text response is synthesized into an MP3 using `gTTS` and streamed back down the WebSocket.
4. **Completion:** When time runs out or the user ends the session, the `generate_report` pipeline analyzes the full transcript, issues numeric scores, and formats a markdown rubric.

---

## 🛡️ License

This project is licensed under the MIT License.
