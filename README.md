# AI Voice Interviewer (V1)

JD-driven, always-on voice mock interviewer. Built strictly to BUILD_SPEC.md.

## Run locally
1. `cp .env.example .env` and fill `OPENAI_API_KEY` + `APP_SECRET`.
2. `docker compose up --build`
3. Open https://localhost (accept the local cert) and sign in.

## Deploy on Oracle Cloud Always Free (ARM)
1. Create an Ampere (aarch64) VM, open ports 80/443.
2. Install Docker + Compose plugin.
3. Point a domain at the VM IP, set `DOMAIN` in `.env`.
4. `docker compose up -d --build` (images build natively for ARM).

## Notes / scope
- Audio goes browser -> OpenAI Realtime DIRECTLY via WebRTC (ephemeral token).
  The backend never proxies audio. // TODO: confirm provider if not OpenAI.
- Backend = control/state + auth + persistence + report only.
- SQLite on a mounted volume. Single instance by design (V1).
- Out-of-scope items (admin dashboards, payments, Postgres/Redis, 30-min
  sessions, PDF upload, etc.) are intentionally NOT built.
