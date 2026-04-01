from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    backend_root: Path
    manifest_path: Path
    bundle_dir: Path
    stockxpert_sentiment_csv: Path | None
    default_horizon: int
    default_top_n: int
    market_ttl_seconds: int
    off_market_ttl_seconds: int
    market_index_symbol: str
    market_timezone: str
    recommendations_snapshot_dir: Path
    cors_origins: tuple[str, ...]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    backend_root = Path(__file__).resolve().parents[2]

    manifest_raw = os.getenv("STOCKXPERT_MANIFEST_PATH", str(backend_root / "artifacts" / "model_manifest.json"))
    manifest_path = Path(manifest_raw)
    if not manifest_path.is_absolute():
        manifest_path = backend_root / manifest_path

    bundle_raw = os.getenv("STOCKXPERT_BUNDLE_DIR", str(backend_root / "artifacts" / "default_bundle"))
    bundle_dir = Path(bundle_raw)
    if not bundle_dir.is_absolute():
        bundle_dir = backend_root / bundle_dir

    sentiment_raw = os.getenv("STOCKXPERT_SENTIMENT_CSV", "").strip()
    sentiment_path = None
    if sentiment_raw:
        sentiment_path = Path(sentiment_raw)
        if not sentiment_path.is_absolute():
            sentiment_path = backend_root / sentiment_path

    snapshot_raw = os.getenv(
        "STOCKXPERT_RECOMMENDATIONS_SNAPSHOT_DIR",
        str(backend_root / "artifacts" / "cache"),
    )
    snapshot_dir = Path(snapshot_raw)
    if not snapshot_dir.is_absolute():
        snapshot_dir = backend_root / snapshot_dir

    cors_origins = tuple(
        origin.strip()
        for origin in os.getenv("STOCKXPERT_CORS_ORIGINS", "").split(",")
        if origin.strip()
    )

    return Settings(
        app_name="StockXpert Backend",
        app_version="0.2.0",
        backend_root=backend_root,
        manifest_path=manifest_path,
        bundle_dir=bundle_dir,
        stockxpert_sentiment_csv=sentiment_path,
        default_horizon=int(os.getenv("STOCKXPERT_DEFAULT_HORIZON", "1")),
        default_top_n=int(os.getenv("STOCKXPERT_DEFAULT_TOP_N", "10")),
        market_ttl_seconds=int(os.getenv("STOCKXPERT_MARKET_TTL", "300")),
        off_market_ttl_seconds=int(os.getenv("STOCKXPERT_OFF_MARKET_TTL", "3600")),
        market_index_symbol=os.getenv("STOCKXPERT_MARKET_INDEX", "^NSEI"),
        market_timezone=os.getenv("STOCKXPERT_MARKET_TIMEZONE", "Asia/Kolkata"),
        recommendations_snapshot_dir=snapshot_dir,
        cors_origins=cors_origins,
    )
