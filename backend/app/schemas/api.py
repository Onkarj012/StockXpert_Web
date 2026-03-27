from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    model_config = ConfigDict(extra="allow", protected_namespaces=())


class RootResponse(APIModel):
    name: str
    version: str
    openapi: str


class ArtifactContractResponse(APIModel):
    manifest_path: str
    bundle_dir: str
    checkpoint: str
    scalers: str
    calibrator: str | None = None
    run_config: str | None = None
    symbols_count: int
    horizons: list[int]
    windows: dict[str, int]
    feature_counts: dict[str, int]
    model_version: str
    supported_symbols: list[str] | None = None
    ready: bool | None = None


class HealthResponse(APIModel):
    status: str
    generated_at: str
    model_version: str | None = None
    artifacts: dict[str, Any]
    cache: dict[str, Any]
    supported_symbols: int | None = None
    last_runs: dict[str, str]


class MetadataConfigResponse(APIModel):
    generated_at: str
    artifact_contract: ArtifactContractResponse


class RecommendationCard(APIModel):
    ticker: str
    company_name: str
    source: str
    direction: str
    confidence_pct: float
    certainty_pct: float | None = None
    current_price: float | None = None
    entry_price: float | None = None
    target_price: float | None = None
    stop_loss: float | None = None
    expected_return_pct: float | None = None
    risk_reward_ratio: float | None = None
    horizon: str
    support: float | None = None
    resistance: float | None = None
    sector: str | None = None
    secondary: dict[str, Any] = Field(default_factory=dict)


class RecommendationsResponse(APIModel):
    generated_at: str
    model_version: str
    config_used: str
    sources: list[str]
    stocks_scanned: dict[str, int]
    count: int
    cards: list[RecommendationCard]


class DashboardResponse(APIModel):
    generated_at: str
    model_version: str
    market_regime: dict[str, Any]
    aggregate_sentiment: dict[str, Any]
    signal_counts: dict[str, int]
    data_freshness: dict[str, Any]
    sector_summary: dict[str, dict[str, int]]
    top_cards: list[RecommendationCard]


class ChartPoint(APIModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    overlays: dict[str, float | None] | None = None
    sma_20: float | None = None
    sma_50: float | None = None
    bb_upper: float | None = None
    bb_lower: float | None = None
    vwap_20: float | None = None


class StockChartResponse(APIModel):
    generated_at: str
    ticker: str
    company_name: str
    points: list[ChartPoint]


class StockDeepDiveResponse(APIModel):
    generated_at: str
    ticker: str
    company_name: str
    model_version: str
    current_price: float
    predictions: dict[str, Any]
    gap_prediction: Any
    news_catalysts: list[dict[str, Any]]
    support_resistance: dict[str, Any]
    key_indicators: dict[str, float | None]
    peer_comparison: dict[str, Any]
    features_snapshot: dict[str, Any]
    chart: list[ChartPoint]
