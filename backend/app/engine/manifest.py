from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from app.core.errors import ArtifactError


@dataclass(frozen=True)
class ModelManifest:
    model_version: str
    run_id: str
    trained_symbols: list[str]
    horizons: list[int]
    windows: dict[str, int]
    short_features: list[str]
    mid_features: list[str]
    long_features: list[str]
    context_features: list[str]
    sentiment_features: list[str]
    num_stocks: int
    hidden_dim: int
    stock_embed_dim: int
    attn_heads: int
    dropout: float
    checkpoint_file: str
    scalers_file: str
    calibrator_file: str | None
    config_file: str | None
    market_timezone: str
    default_top_n: int


def load_manifest(path: Path) -> ModelManifest:
    if not path.exists():
        raise ArtifactError(f"Manifest not found: {path}")

    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    required = [
        "model_version",
        "run_id",
        "trained_symbols",
        "horizons",
        "windows",
        "short_features",
        "mid_features",
        "long_features",
        "context_features",
        "sentiment_features",
        "num_stocks",
        "hidden_dim",
        "stock_embed_dim",
        "attn_heads",
        "dropout",
        "checkpoint_file",
        "scalers_file",
        "market_timezone",
        "default_top_n",
    ]
    missing = [key for key in required if key not in data]
    if missing:
        raise ArtifactError(f"Manifest missing fields: {', '.join(missing)}")

    manifest = ModelManifest(
        model_version=data["model_version"],
        run_id=data["run_id"],
        trained_symbols=list(data["trained_symbols"]),
        horizons=[int(h) for h in data["horizons"]],
        windows={str(key): int(value) for key, value in data["windows"].items()},
        short_features=list(data["short_features"]),
        mid_features=list(data["mid_features"]),
        long_features=list(data["long_features"]),
        context_features=list(data["context_features"]),
        sentiment_features=list(data["sentiment_features"]),
        num_stocks=int(data["num_stocks"]),
        hidden_dim=int(data["hidden_dim"]),
        stock_embed_dim=int(data["stock_embed_dim"]),
        attn_heads=int(data["attn_heads"]),
        dropout=float(data["dropout"]),
        checkpoint_file=str(data["checkpoint_file"]),
        scalers_file=str(data["scalers_file"]),
        calibrator_file=str(data["calibrator_file"]) if data.get("calibrator_file") else None,
        config_file=str(data["config_file"]) if data.get("config_file") else None,
        market_timezone=str(data["market_timezone"]),
        default_top_n=int(data["default_top_n"]),
    )
    if manifest.num_stocks != len(manifest.trained_symbols):
        raise ArtifactError("Manifest symbol count does not match num_stocks")
    return manifest
