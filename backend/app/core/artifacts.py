from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import torch

from app.core.errors import ArtifactError
from app.core.settings import Settings
from app.engine.checkpoint_loader import load_runtime_bundle
from app.engine.manifest import load_manifest


@dataclass
class ArtifactPaths:
    bundle_dir: Path
    manifest_path: Path
    checkpoint: Path
    scalers: Path
    calibrator: Path | None
    run_config: Path | None


class ArtifactRegistry:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.manifest = load_manifest(settings.manifest_path)
        self.paths = self._resolve_paths()
        self._runtime = None
        self._checkpoint_meta = None

    def _resolve_paths(self) -> ArtifactPaths:
        bundle_dir = self.settings.bundle_dir
        checkpoint = bundle_dir / self.manifest.checkpoint_file
        scalers = bundle_dir / self.manifest.scalers_file
        calibrator = bundle_dir / self.manifest.calibrator_file if self.manifest.calibrator_file else None
        run_config = bundle_dir / self.manifest.config_file if self.manifest.config_file else None

        missing = [path for path in (checkpoint, scalers) if not path.exists()]
        if missing:
            raise ArtifactError(f"Missing required artifacts: {', '.join(str(path) for path in missing)}")
        if calibrator is not None and not calibrator.exists():
            calibrator = None
        if run_config is not None and not run_config.exists():
            run_config = None

        return ArtifactPaths(
            bundle_dir=bundle_dir,
            manifest_path=self.settings.manifest_path,
            checkpoint=checkpoint,
            scalers=scalers,
            calibrator=calibrator,
            run_config=run_config,
        )

    def _load_checkpoint_meta(self) -> dict[str, Any]:
        ckpt = torch.load(self.paths.checkpoint, map_location="cpu")
        state = ckpt.get("model_state_dict", {})
        emb = state.get("stock_embedding.weight")
        short_proj = state.get("short_encoder.input_proj.weight")
        mid_ih = state.get("mid_encoder.gru.weight_ih_l0")
        long_ih = state.get("long_encoder.lstm.weight_ih_l0")

        return {
            "checkpoint": str(self.paths.checkpoint),
            "epoch": ckpt.get("epoch"),
            "loss": ckpt.get("loss"),
            "num_state_tensors": len(state),
            "stock_embedding_shape": list(emb.shape) if emb is not None else None,
            "short_input_proj_shape": list(short_proj.shape) if short_proj is not None else None,
            "mid_gru_ih_shape": list(mid_ih.shape) if mid_ih is not None else None,
            "long_lstm_ih_shape": list(long_ih.shape) if long_ih is not None else None,
        }

    @property
    def runtime(self):
        if self._runtime is None:
            self._runtime = load_runtime_bundle(self.manifest, self.paths)
        return self._runtime

    def checkpoint_meta(self) -> dict[str, Any]:
        if self._checkpoint_meta is None:
            self._checkpoint_meta = self._load_checkpoint_meta()
        return dict(self._checkpoint_meta)

    def model_version(self) -> str:
        return self.manifest.model_version

    def symbol_map(self) -> dict[str, int]:
        return {sym: idx for idx, sym in enumerate(self.manifest.trained_symbols)}

    def describe(self) -> dict[str, Any]:
        return {
            "manifest_path": str(self.paths.manifest_path),
            "bundle_dir": str(self.paths.bundle_dir),
            "checkpoint": str(self.paths.checkpoint),
            "scalers": str(self.paths.scalers),
            "calibrator": str(self.paths.calibrator) if self.paths.calibrator else None,
            "run_config": str(self.paths.run_config) if self.paths.run_config else None,
            "symbols_count": len(self.manifest.trained_symbols),
            "supported_symbols": self.manifest.trained_symbols,
            "horizons": list(self.manifest.horizons),
            "windows": self.manifest.windows,
            "feature_counts": {
                "short": len(self.manifest.short_features),
                "mid": len(self.manifest.mid_features),
                "long": len(self.manifest.long_features),
                "context": len(self.manifest.context_features),
                "sentiment": len(self.manifest.sentiment_features),
            },
            "model_version": self.model_version(),
            "ready": True,
        }
