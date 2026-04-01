# StockXpert Deployment Guide

This application is split into two deployable parts:

- `frontend/` is a Next.js 15 app
- `backend/` is a FastAPI service that loads local model artifacts from `backend/artifacts/`

## Recommended Setup

Deploy the app as two services:

1. Frontend on Vercel
2. Backend on Railway or Render

This repo already supports the clean production path:

- the frontend browser can call `/api/*` on the same domain
- Next.js rewrites forward those requests to your backend service
- no backend CORS setup is required for that path

## Frontend Environment Variables

Set these in your frontend hosting provider:

```bash
BACKEND_URL=https://your-backend-domain.example.com
NEXT_PUBLIC_API_BASE=
NEXT_PUBLIC_USE_MOCK=false
```

Notes:

- `BACKEND_URL` is used by Next.js rewrites on the server
- leave `NEXT_PUBLIC_API_BASE` empty unless you intentionally want the browser to call the backend domain directly
- if you do set `NEXT_PUBLIC_API_BASE`, also set `STOCKXPERT_CORS_ORIGINS` on the backend

## Backend Environment Variables

The backend works with the bundled artifacts by default, so you can usually deploy with only optional env vars:

```bash
STOCKXPERT_DEFAULT_HORIZON=1
STOCKXPERT_DEFAULT_TOP_N=10
STOCKXPERT_MARKET_TTL=300
STOCKXPERT_OFF_MARKET_TTL=3600
STOCKXPERT_MARKET_INDEX=^NSEI
STOCKXPERT_MARKET_TIMEZONE=Asia/Kolkata
```

Optional:

```bash
STOCKXPERT_CORS_ORIGINS=https://your-frontend-domain.example.com
STOCKXPERT_SENTIMENT_CSV=/absolute/path/to/sentiment.csv
```

## Deploy The Frontend

Suggested Vercel setup:

1. Import this repository.
2. Set the project root directory to `frontend`.
3. Add the frontend environment variables above.
4. Deploy.

The frontend will build with the standard Next.js production flow.

## Deploy The Backend

Important: deploy the backend from the repository root, not from the `backend/` folder by itself, because the app imports modules using the `backend.*` package path.

Suggested service settings:

- Root Directory: repository root
- Build Command: `pip install -r backend/requirements.txt`
- Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`

After deployment, verify:

- `GET /`
- `GET /api/health`
- `GET /api/metadata/config`

## Railway Example

Use one service for the backend:

- root: repository root
- build command: `pip install -r backend/requirements.txt`
- start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`

Then copy the generated public backend URL into the frontend `BACKEND_URL` env var.

## Render Example

Create a Python web service with:

- root: repository root
- build command: `pip install -r backend/requirements.txt`
- start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`

Then set the frontend `BACKEND_URL` to the Render service URL.

## Common Pitfalls

- Do not set only `NEXT_PUBLIC_API_BASE` unless backend CORS is configured.
- Do not deploy the backend from `backend/` as the working root unless you also change the Python import paths.
- Do not enable mock mode in production.
- If your backend sleeps on free tiers, the first request may be slow.

## Smoke Test

Once both services are live:

1. Open the frontend home page.
2. Open the status page and confirm health/metadata load.
3. Check recommendations and a stock detail page.
4. If API calls fail in the browser, confirm `BACKEND_URL` is set on the frontend and `NEXT_PUBLIC_API_BASE` is empty.
