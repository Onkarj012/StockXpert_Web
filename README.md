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

See [DEPLOYMENT.md](/Users/onkarj012/Projects/major_pro/StockXpert/DEPLOYMENT.md) for the full step-by-step guide.
