# TANGBL.3dm Converter Microservice (FastAPI)

A minimal FastAPI service exposing `/convert` to down-save Rhino `.3dm` files using `rhino3dm`.

## Endpoints
- `GET /health` → `{ status: "ok" }`
- `POST /convert` (multipart)
  - fields: `file` (.3dm), `targetVersion` (e.g., `5`, `6`, `7`, `8`)
  - returns: converted `.3dm` as attachment

## Local dev
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r microservice/requirements.txt
uvicorn microservice.app:app --reload
```
Open http://127.0.0.1:8000/docs

## Deploy to Render (recommended)
- Create new Web Service
- Runtime: Python 3.10+
- Build Command: `pip install -r microservice/requirements.txt`
- Start Command: `uvicorn microservice.app:app --host 0.0.0.0 --port $PORT`
- Plan: Free (works for moderate file sizes)
- Env Vars:
  - `PYTHONUNBUFFERED=1`
  - `ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app, http://localhost:3000`

Alternatively, use `render.yaml` in repo root (Infrastructure as Code).

## Integrating with Next.js
On Vercel, set an env var:
- `CONVERTER_API_URL=https://<your-render-service>.onrender.com`

The Next.js route at `web-frontend/src/app/api/convert/route.ts` proxies requests to this microservice.

## Large uploads (100MB+)
- Prefer direct-to-microservice upload from the browser (bypass Vercel limits)
- For very large models:
  - Implement chunked uploads (Tus/uppy) or direct-to-storage (S3/R2) then process by URL
  - Increase service plan memory/time if needed
  - Stream output back; service already streams with `FileResponse`
