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

## Hosting

This repo is best deployed as two services:

- `frontend/`: Next.js web app
- `backend/`: FastAPI API with bundled model artifacts

The safest production setup is:

- host the frontend on Vercel
- host the backend on Railway or Render
- set the frontend `BACKEND_URL` env var to your deployed backend URL
- leave `NEXT_PUBLIC_API_BASE` empty so the browser uses same-origin `/api/*`

The backend now serves recommendation traffic from a saved daily snapshot by
default and refreshes that snapshot automatically before market open
(`08:00` IST unless configured otherwise). If you deploy to an environment
without persistent storage, attach a persistent volume or move the snapshot
directory to shared storage so the snapshot survives restarts.

That setup avoids browser CORS issues because Next.js proxies `/api/*` to the backend.

## Deployment Notes

- Render should deploy only the `backend/` folder. The checked-in `render.yaml` now sets `rootDir: backend` so the Python service does not upload or inspect the frontend build context.
- The backend no longer tries to build a fresh recommendation snapshot during startup unless `STOCKXPERT_SNAPSHOT_CATCH_UP_ON_STARTUP=true` is set. This keeps cold starts and health checks faster on hosted platforms.
- Keep generated folders out of deploys and git: `frontend/node_modules`, `frontend/.next`, and backend cache outputs should stay local-only.

See [DEPLOYMENT.md](/Users/onkarj012/Projects/major_pro/StockXpert/DEPLOYMENT.md) for the full step-by-step guide.
