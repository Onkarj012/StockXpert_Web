from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

import torch

from app.core.errors import ArtifactError
from app.engine.calibration.calibration import PredictionCalibrator
from app.engine.features.builder import FeatureBuilder
from app.engine.manifest import ModelManifest
from app.engine.models.stockxpert import StockXpertModel
from app.engine.scaling.scaling import ScalerGroup
from app.engine.symbol_registry import SymbolRegistry

if TYPE_CHECKING:
    from app.core.artifacts import ArtifactPaths


@dataclass
class RuntimeBundle:
    manifest: ModelManifest
    model: StockXpertModel
    scalers: ScalerGroup
    calibrator: PredictionCalibrator | None
    feature_builder: FeatureBuilder
    symbol_registry: SymbolRegistry
    device: torch.device


def _validate_state_dict(manifest: ModelManifest, state: dict) -> None:
    emb = state.get("stock_embedding.weight")
    if emb is None:
        raise ArtifactError("Checkpoint is missing stock_embedding.weight")
    if tuple(emb.shape) != (manifest.num_stocks, manifest.stock_embed_dim):
        raise ArtifactError(
            "Checkpoint embedding shape does not match manifest: "
            f"{tuple(emb.shape)} != {(manifest.num_stocks, manifest.stock_embed_dim)}"
        )


def _validate_scalers(manifest: ModelManifest, scalers: ScalerGroup) -> None:
    expected = {
        "short": (scalers.scaler_short, len(manifest.short_features)),
        "mid": (scalers.scaler_mid, len(manifest.mid_features)),
        "long": (scalers.scaler_long, len(manifest.long_features)),
        "context": (scalers.scaler_context, len(manifest.context_features)),
        "sentiment": (scalers.scaler_sentiment, len(manifest.sentiment_features)),
    }
    for name, (scaler, size) in expected.items():
        n_features = getattr(scaler, "n_features_in_", size)
        if n_features != size:
            raise ArtifactError(f"Scaler mismatch for {name}: expected {size}, got {n_features}")


def load_runtime_bundle(manifest: ModelManifest, paths: "ArtifactPaths") -> RuntimeBundle:
    checkpoint = torch.load(paths.checkpoint, map_location="cpu")
    state = checkpoint.get("model_state_dict")
    if state is None:
        raise ArtifactError("Checkpoint missing model_state_dict")

    _validate_state_dict(manifest, state)

    model = StockXpertModel(
        num_stocks=manifest.num_stocks,
        short_dim=len(manifest.short_features),
        mid_dim=len(manifest.mid_features),
        long_dim=len(manifest.long_features),
        context_dim=len(manifest.context_features),
        num_horizons=len(manifest.horizons),
        hidden_dim=manifest.hidden_dim,
        stock_embed_dim=manifest.stock_embed_dim,
        attn_heads=manifest.attn_heads,
        dropout=manifest.dropout,
    )
    model.load_state_dict(state, strict=True)
    model.eval()

    scalers = ScalerGroup.load(paths.scalers)
    _validate_scalers(manifest, scalers)
    calibrator = PredictionCalibrator.load(paths.calibrator) if paths.calibrator is not None else None

    return RuntimeBundle(
        manifest=manifest,
        model=model,
        scalers=scalers,
        calibrator=calibrator,
        feature_builder=FeatureBuilder(horizons=manifest.horizons),
        symbol_registry=SymbolRegistry(manifest.trained_symbols),
        device=torch.device("cpu"),
    )
