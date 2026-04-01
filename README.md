# StockXpert_Web

## Getting Started

### Backend (FastAPI)

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
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

That setup avoids browser CORS issues because Next.js proxies `/api/*` to the backend.

See [DEPLOYMENT.md](/Users/onkarj012/Projects/major_pro/StockXpert/DEPLOYMENT.md) for the full step-by-step guide.
