# Separate FastAPI Inference Backend for a Frozen StockXpert Checkpoint

## Summary

Build a new, self-contained FastAPI repository that serves **only checkpoint-backed ML inference** and related frontend-facing aggregation, without importing or depending on this repository at runtime.

The new backend will:

- run from a **single frozen model bundle**
- fetch market data itself
- serve a **full app backend** for frontend use
- accept requests for a **subset of symbols**, but only within the checkpoint’s trained symbol universe
- exclude training, backtesting, TA/intraday rule engines, and any runtime interaction with this repo

The key design rule is: **the checkpoint is not sufficient by itself**. The deployable bundle must include the exact config/manifest, scaler artifacts, symbol order, and optional calibrator that match the checkpoint.

---

## Scope

### In scope

- Separate repository
- FastAPI app
- ML-only recommendation backend
- Live OHLCV fetching inside backend
- Dashboard-style aggregate endpoints
- Per-stock detail and chart endpoints
- Frozen artifact bundle for one chosen model version
- CPU-first deployment with optional GPU support

### Out of scope

- Any mutation of this repo
- Training or retraining
- Backtesting
- TA-only signal generation
- Intraday ORB engine
- Shared runtime package dependency on this repo
- Support for arbitrary unseen tickers outside the trained embedding universe
- User accounts, watchlists, auth, or persistence in v1

---

## Required Artifact Bundle

For the chosen “best” run, freeze and copy these files into the new backend repo or its deployment artifact storage:

1. `checkpoints/model_final.pt` or `checkpoints/model.pt`
2. `artifacts/scalers.pkl`
3. `artifacts/calibrator.pkl` if available
4. A frozen config/manifest describing the exact inference contract

### Manifest contents

The new repo must include a frozen `model_manifest.json` or `config.yaml` with these fields:

- `model_version`
- `run_id`
- `checkpoint_filename`
- `scalers_filename`
- `calibrator_filename` or `null`
- `horizons`
- `windows.short`
- `windows.mid`
- `windows.long`
- `short_features`
- `mid_features`
- `long_features`
- `context_features`
- `sentiment_features`
- `trained_symbols` in exact embedding order
- `num_stocks`
- `hidden_dim`
- `stock_embed_dim`
- `attn_heads`
- `dropout`
- `sentiment_mode`
- `market_timezone`
- `target_market`
- `default_top_n`

### Rule

If the selected run already has `config.yaml`, use it as the source of truth and convert or mirror it into the manifest. If it does not, create a frozen manifest once during backend setup and treat that manifest as authoritative from then on.

---

## Recommended New Repository Layout

```text
stockxpert-inference-backend/
  app/
    api/
      routes/
        health.py
        metadata.py
        dashboard.py
        recommendations.py
        stocks.py
    core/
      settings.py
      logging.py
      cache.py
      errors.py
    domain/
      manifest.py
      schemas.py
      ranking.py
      symbol_registry.py
    inference/
      checkpoint_loader.py
      predictor.py
      postprocessing.py
    features/
      indicators.py
      fibonacci.py
      builder.py
      sentiment_defaults.py
    providers/
      market_data.py
      sentiment.py
      calendar.py
    artifacts/
      model_manifest.json
      checkpoint/
      scalers/
      calibrator/
    main.py
  tests/
  pyproject.toml
  README.md
```

### Copy boundary

Copy only the minimal code needed for inference:

- model architecture classes
- encoder/fusion dependencies
- scaler loading
- indicator and feature builder logic
- sentiment merge/default logic
- config/manifest parsing

Do not copy:

- training loops
- dataset splitting
- backtesting
- report generation
- experimental scripts
- TA/intraday rule engines

---

## Backend Architecture

### 1. Startup

On app startup:

1. load settings
2. load frozen manifest
3. validate that artifact files exist
4. load checkpoint
5. infer or validate model dimensions against manifest
6. load scalers
7. load calibrator if present
8. initialize symbol registry from `trained_symbols`
9. warm a lightweight health state

Startup must fail fast if any artifact or shape contract is invalid.

### 2. Request-time data flow

For dashboard/recommendation requests:

1. validate requested symbols are a subset of the trained universe
2. fetch OHLCV for requested symbols
3. normalize raw data shape and timezone
4. attach sentiment features
   - default v1 behavior: zero-filled sentiment features unless a configured sentiment source is added
5. compute indicators and derived features
6. build latest multi-window tensors
7. scale tensors using frozen scalers
8. run model inference
9. apply optional calibration
10. convert outputs into frontend-friendly predictions
11. rank and aggregate results
12. cache result

### 3. Post-processing logic

The backend must standardize model output into:

- `p_up`
- `p_down`
- `direction`
- `confidence`
- `expected_return_pct`
- `target_price`
- `support`
- `resistance`
- `risk_reward_ratio`

Ranking default:

- primary sort: `confidence`
- secondary sort: absolute `expected_return_pct`

---

## Public API Contract

All endpoints versioned under `/v1`.

### `GET /v1/health`

Purpose:
- liveness and readiness

Response:
- service status
- model version
- artifact load status
- cache stats
- supported symbol count
- provider status

### `GET /v1/metadata/model`

Purpose:
- expose the frozen inference contract

Response:
- model version
- run id
- horizons
- feature windows
- supported symbols
- whether calibrator is enabled
- sentiment mode
- default request parameters

### `GET /v1/universe`

Purpose:
- frontend symbol selector data

Query params:
- `q` optional search string

Response:
- list of supported symbols
- optional display names if provided in manifest

### `GET /v1/dashboard`

Purpose:
- full frontend aggregate summary

Query params:
- `symbols` optional comma-separated subset
- `horizon` default `1`
- `top_n` default `10`

Response:
- generated timestamp
- model version
- market regime summary
- signal counts
- top recommendations
- aggregate breadth stats
- symbol coverage summary

### `GET /v1/recommendations`

Purpose:
- ranked ML recommendation feed

Query params:
- `symbols` optional comma-separated subset
- `horizon` one of supported horizons
- `top_n` default `10`
- `side` one of `long|short|both`, default `both`

Response:
- request context
- count
- ranked recommendation cards

Each card contains:
- symbol
- direction
- confidence
- p_up
- expected_return_pct
- entry_price
- target_price
- stop_loss
- support
- resistance
- horizon
- indicator snapshot

### `GET /v1/stocks/{symbol}`

Purpose:
- stock detail page

Response:
- current price
- multi-horizon predictions
- key indicators
- support/resistance summary
- recent chart summary
- model metadata for that symbol

### `GET /v1/stocks/{symbol}/chart`

Purpose:
- frontend chart series

Query params:
- `lookback_days` default `60`

Response:
- OHLCV points
- overlays such as `sma_20`, `sma_50`, `vwap_20`
- optional indicator panel values if needed

---

## Validation and Error Rules

### Symbol validation

- any symbol outside `trained_symbols` returns `400`
- partial-valid requests must fail the whole request, not silently drop invalid symbols

### Data sufficiency

If fetched data cannot satisfy the max configured window:

- return `422` with explicit reason:
  - insufficient history
  - missing columns
  - upstream fetch failure

### Artifact mismatch

If checkpoint/scaler/config dimensions do not align:

- backend must fail startup with `503` readiness false
- never fall back to guessed feature lists in production

### Upstream provider failure

If OHLCV fetch fails:

- return `502` with provider error details sanitized for clients
- include a stable internal error code in response

---

## Defaults Chosen

These are the implementation defaults unless you later override them.

- Framework: FastAPI
- Runtime: Python 3.11+
- Inference device: CPU by default, optional CUDA via env
- Market data owner: backend
- Universe policy: request subset within trained universe only
- Scope: full app backend, but ML-only
- Caching:
  - market hours TTL: 5 minutes
  - off-market TTL: 60 minutes
- Sentiment in v1:
  - disabled by default
  - sentiment features zero-filled unless a frozen sentiment source is explicitly configured
- Auth: none in v1
- Persistence: none in v1
- Background jobs: none in v1
- Response format: JSON only
- API versioning: `/v1`

---

## Implementation Phases

### Phase 1. Freeze the model contract

Deliverables:
- chosen winning run identified
- artifact bundle copied
- frozen manifest created
- startup contract documented

Acceptance criteria:
- implementer can load model, scalers, and calibrator without touching this repo

### Phase 2. Build portable inference core

Deliverables:
- checkpoint loader
- symbol registry
- feature builder
- predictor
- post-processing and ranking

Acceptance criteria:
- one symbol and one batch request can be scored from raw OHLCV input
- outputs are deterministic for a fixed fixture

### Phase 3. Build providers

Deliverables:
- market data provider
- optional sentiment provider interface
- trading calendar normalization

Acceptance criteria:
- backend can fetch latest valid OHLCV and assemble feature-ready frames for supported symbols

### Phase 4. Build FastAPI surface

Deliverables:
- health
- metadata
- universe
- dashboard
- recommendations
- stock detail
- chart endpoints

Acceptance criteria:
- OpenAPI schema is stable and complete
- frontend can consume all required JSON without special-casing model internals

### Phase 5. Parity and hardening

Deliverables:
- regression tests
- fixture-based inference checks
- startup validation
- error handling
- caching

Acceptance criteria:
- new backend outputs materially match reference outputs from the original inference path for chosen symbols/horizons

---

## Test Cases and Scenarios

### Unit tests

- manifest parsing
- symbol subset validation
- checkpoint dimension validation
- scaler feature-count validation
- response schema serialization
- ranking logic
- fallback behavior when calibrator is absent

### Integration tests

- startup with valid artifact bundle
- startup failure with missing scaler
- startup failure with mismatched feature counts
- prediction for one valid symbol
- prediction for multiple valid symbols
- rejection of out-of-universe symbol
- insufficient-history response
- chart endpoint response shape
- dashboard aggregation over subset request

### Regression tests

Use frozen market-data fixtures and compare against reference outputs for:
- 3 representative symbols
- all supported horizons
- with and without calibrator
- with zero-filled sentiment

### Manual acceptance scenarios

- request top 10 recommendations across full universe
- request recommendations for 5 chosen symbols
- open stock detail for one supported symbol
- open chart endpoint for same symbol
- verify no runtime imports from this repo are required

---

## Operational Notes

- The backend must be treated as a **frozen inference service**, not a thin wrapper around research code.
- Model upgrades should happen by replacing the artifact bundle and manifest together.
- Never allow “latest run” auto-discovery in the new repo; model selection must be explicit.
- Symbol order must remain frozen because of the stock embedding layer.
- If you later want arbitrary new tickers, that is a **new model-serving problem**, not a small backend change.

---

## Assumptions

- You will choose one winning run before implementation begins.
- You want a completely separate repo with no runtime dependency on this codebase.
- You are comfortable serving only symbols present in the selected checkpoint’s trained symbol universe.
- You want the backend to fetch data itself rather than receive model-ready tensors from the client.
- v1 should expose a complete frontend backend, but only for ML inference and related aggregation.

