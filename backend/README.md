# StockXpert Self-Contained Backend

This `backend/` folder is a portable FastAPI inference backend. It owns its runtime code and artifact contract and does not import from the repo’s `src/` or `scripts/` directories.

## What Is Included

- FastAPI app and typed API schemas
- backend-owned model loading and inference pipeline
- backend-owned feature engineering, scaler loading, and calibrator loading
- yfinance-backed market-data provider
- explicit model bundle and manifest under `backend/artifacts/`

## Model Bundle Contract

The backend loads one explicit bundle. By default it uses:

- manifest: [backend/artifacts/model_manifest.json](/Users/onkarj012/Projects/major_pro/trial/backend/artifacts/model_manifest.json)
- bundle dir: [backend/artifacts/default_bundle](/Users/onkarj012/Projects/major_pro/trial/backend/artifacts/default_bundle)

Required files inside the bundle:

- `checkpoints/model_final.pt`
- `artifacts/scalers.pkl`
- `artifacts/calibrator.pkl` optional
- `config.yaml` optional but recommended

The manifest freezes:

- trained symbol universe and embedding order
- feature windows
- feature lists
- model dimensions
- artifact filenames
- default market timezone and top-N behavior

## API Surface

### `GET /`
Basic service info and docs pointer.

### `GET /api/health`
Health, artifact readiness, model version, cache stats, and supported symbol count.

### `GET /api/metadata/config`
Manifest and artifact contract summary for the frontend.

### `GET /api/dashboard`
Inputs:

- `symbols` optional comma-separated subset of trained symbols
- `horizon` optional trading-day horizon
- `top_n` optional recommendation limit

Returns aggregate dashboard data for ML-backed signals only.

### `GET /api/recommendations`
Inputs:

- `symbols` optional comma-separated subset of trained symbols
- `horizon` optional trading-day horizon
- `top_n` optional recommendation limit
- `side` one of `long`, `short`, `both`
- `live` optional boolean. If `true`, bypasses saved snapshot and runs live inference.

Returns ranked ML recommendation cards.

By default this endpoint serves from the latest saved daily snapshot (today first, then live fallback).

### `GET /api/stocks/{ticker}`
Returns current price, multi-horizon predictions, key indicators, support/resistance, and chart-ready history.

### `GET /api/stocks/{ticker}/chart`
Returns OHLCV points plus overlays for chart rendering.

## Run Locally

1. Install backend dependencies:
   `pip install -r backend/requirements.txt`
2. Start the API:
   `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload`
3. Open docs:
   `http://127.0.0.1:8000/docs`

## Daily Snapshot Workflow

Build recommendations for all trained symbols and horizons (1/3/5/7/10), then save to a local JSON snapshot:

`python -m backend.app.jobs.build_recommendation_snapshot`

Default snapshot location:

- `backend/artifacts/cache/recommendations_YYYY-MM-DD.json`

Recommended schedule:

- run once after market close (or early morning before frontend traffic)
- frontend calls `/api/recommendations` as usual and receives saved data
- use `?live=true` only for debugging/recompute checks

## Environment Variables

- `STOCKXPERT_MANIFEST_PATH`
  Path to the manifest file. Default: `backend/artifacts/model_manifest.json`
- `STOCKXPERT_BUNDLE_DIR`
  Path to the artifact bundle. Default: `backend/artifacts/default_bundle`
- `STOCKXPERT_SENTIMENT_CSV`
  Optional sentiment CSV path. If omitted, sentiment features are zero-filled.
- `STOCKXPERT_DEFAULT_HORIZON`
  Default recommendation horizon. Default: `1`
- `STOCKXPERT_DEFAULT_TOP_N`
  Default recommendation count. Default: `10`
- `STOCKXPERT_MARKET_TTL`
  Cache TTL during market hours. Default: `300`
- `STOCKXPERT_OFF_MARKET_TTL`
  Cache TTL outside market hours. Default: `3600`
- `STOCKXPERT_MARKET_INDEX`
  Index ticker used for regime summary. Default: `^NSEI`
- `STOCKXPERT_MARKET_TIMEZONE`
  Market timezone used in timestamps. Default: `Asia/Kolkata`
- `STOCKXPERT_RECOMMENDATIONS_SNAPSHOT_DIR`
  Directory for saved recommendation snapshots. Default: `backend/artifacts/cache`

## Moving `backend/` To A New Repo

1. Copy the entire `backend/` folder.
2. Keep or replace `backend/artifacts/default_bundle`.
3. Update `backend/artifacts/model_manifest.json` if you swap in a different checkpoint bundle.
4. Install dependencies from `backend/requirements.txt`.
5. Start with `uvicorn backend.app.main:app --reload`.

No runtime dependency on the original repo should remain.

## Intentionally Omitted In V1

- training and retraining
- backtesting
- TA-only and intraday engines
- auth and persistence
- symbols outside the trained checkpoint universe
