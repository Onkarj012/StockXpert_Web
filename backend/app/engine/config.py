from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class BundleConfig:
    raw: dict[str, Any]


def load_bundle_config(path: Path) -> BundleConfig:
    with path.open("r", encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}
    return BundleConfig(raw=raw)
