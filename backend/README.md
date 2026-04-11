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
- `live` optional boolean. If `true`, attempts live inference, but only when
  live recompute is enabled by backend configuration.

Returns ranked ML recommendation cards.

By default this endpoint serves from the latest saved daily snapshot (today
first, then latest previous snapshot). It does not recompute live on normal
user traffic.

### `GET /api/recommendations/horizons`
Inputs:

- `symbols` optional comma-separated subset of trained symbols
- `top_n` optional recommendation limit
- `side` one of `long`, `short`, `both`
- `live` optional boolean. Same config gate as `/api/recommendations`

Returns all supported horizons from the saved snapshot in one payload. The
frontend horizons page uses this endpoint to avoid five separate requests.

### `GET /api/stocks/{ticker}`
Returns current price, multi-horizon predictions, key indicators, support/resistance, and chart-ready history.

### `GET /api/stocks/{ticker}/chart`
Returns OHLCV points plus overlays for chart rendering.

## Run Locally

1. Install backend dependencies:
   `pip install -r requirements.txt`
2. Start the API:
   `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
3. Open docs:
   `http://127.0.0.1:8000/docs`

## Daily Snapshot Workflow

Build recommendations for all trained symbols and horizons (1/3/5/7/10):

`python -m app.jobs.build_recommendation_snapshot`

Storage behavior:

- local development defaults to `backend/artifacts/cache/recommendations_YYYY-MM-DD.json`
- production can store recommendation snapshots in Cloudflare R2 using the
  S3-compatible API
- when R2 is enabled, the backend writes:
  - `recommendations/daily/YYYY-MM-DD/all_horizons.json`
  - `recommendations/daily/latest.json`

Recommended schedule:

- local development can use the built-in scheduler
- production should use a Railway cron job to run the snapshot builder before
  market open (`08:00` IST)
- the manual job below remains available for one-off rebuilds and verification
- frontend calls `/api/recommendations` as usual and receives saved data
- if today's snapshot is missing, the API serves the latest saved snapshot and
  reports stale freshness in `/api/health`
- stock detail and chart payloads are computed once per symbol each day with
  the maximum supported lookback, then sliced on read for 30/60/90/180/365-day
  views
- use `?live=true` only for debugging/recompute checks, and only when live
  recompute is explicitly enabled
- if your platform does not preserve local disk across restarts, move the
  snapshot directory to shared storage or attach a persistent volume

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
- `STOCKXPERT_SNAPSHOT_BACKEND`
  Snapshot backend. One of `local` or `r2`. Default: `local`
- `STOCKXPERT_RECOMMENDATIONS_SNAPSHOT_DIR`
  Directory for saved recommendation snapshots in local mode. Default: `backend/artifacts/cache`
- `STOCKXPERT_R2_BUCKET`
  Cloudflare R2 bucket for recommendation snapshots
- `STOCKXPERT_R2_ENDPOINT`
  Cloudflare R2 S3 endpoint, for example `https://<account-id>.r2.cloudflarestorage.com`
- `STOCKXPERT_R2_ACCESS_KEY_ID`
  R2 access key id
- `STOCKXPERT_R2_SECRET_ACCESS_KEY`
  R2 secret access key
- `STOCKXPERT_R2_REGION`
  R2 region value for the S3 client. Default: `auto`
- `STOCKXPERT_R2_PREFIX`
  Object key prefix for recommendation snapshots. Default: `recommendations/daily`
- `STOCKXPERT_ENABLE_LIVE_RECOMMENDATIONS`
  Allow `?live=true` to run model inference on demand. Default: `false`
- `STOCKXPERT_FALLBACK_TO_LIVE_WHEN_SNAPSHOT_MISSING`
  Allow normal API traffic to use live inference when no saved snapshot is available. Default: `true`
- `STOCKXPERT_SNAPSHOT_SCHEDULE_ENABLED`
  Enable the built-in daily snapshot scheduler. Default: `true` in local mode and `false` in R2 mode
- `STOCKXPERT_SNAPSHOT_SCHEDULE_HOUR`
  IST hour for the automatic daily snapshot refresh. Default: `8`
- `STOCKXPERT_SNAPSHOT_SCHEDULE_MINUTE`
  IST minute for the automatic daily snapshot refresh. Default: `0`
- `STOCKXPERT_MAX_STOCK_LOOKBACK_DAYS`
  Canonical stock detail/chart cache size. Default: `365`

## Moving `backend/` To A New Repo

1. Copy the entire `backend/` folder.
2. Keep or replace `backend/artifacts/default_bundle`.
3. Update `backend/artifacts/model_manifest.json` if you swap in a different checkpoint bundle.
4. Install dependencies from `requirements.txt`.
5. Start with `uvicorn app.main:app --reload`.

No runtime dependency on the original repo should remain.

## Intentionally Omitted In V1

- training and retraining
- backtesting
- TA-only and intraday engines
- auth and persistence
- symbols outside the trained checkpoint universe
