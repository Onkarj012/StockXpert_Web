# StockXpert_Web

## Getting Started

### Backend (FastAPI)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Production Hosting

This repo is intended to be hosted as:

- `frontend/` on Vercel
- `backend/` on Railway
- recommendation snapshots in Cloudflare R2

The frontend should call the backend through Next.js rewrites:

- set `BACKEND_URL` on Vercel to your Railway backend URL
- leave `NEXT_PUBLIC_API_BASE` empty so the browser uses same-origin `/api/*`

The backend reads recommendation snapshots from R2 first and falls back to live
inference when no usable snapshot is available.

## Railway + R2 Setup

Configure the Railway backend service with:

- root directory: `backend`
- start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- build command: `pip install -r requirements.txt`

Recommended Railway cron job:

- command: `python -m app.jobs.build_recommendation_snapshot`
- schedule: weekdays before market open, such as `08:00` IST

Required backend env vars for production:

- `STOCKXPERT_SNAPSHOT_BACKEND=r2`
- `STOCKXPERT_R2_BUCKET`
- `STOCKXPERT_R2_ENDPOINT`
- `STOCKXPERT_R2_ACCESS_KEY_ID`
- `STOCKXPERT_R2_SECRET_ACCESS_KEY`
- `STOCKXPERT_R2_REGION=auto`
- `STOCKXPERT_R2_PREFIX=recommendations/daily`

Recommended production env vars:

- `STOCKXPERT_SNAPSHOT_SCHEDULE_ENABLED=false`
- `STOCKXPERT_FALLBACK_TO_LIVE_WHEN_SNAPSHOT_MISSING=true`

Keep generated folders and caches out of git and hosting contexts:

- `frontend/node_modules`
- `frontend/.next`
- `backend/artifacts/cache`
