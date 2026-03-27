from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import json
from pathlib import Path
from zoneinfo import ZoneInfo

from backend.app.engine.ranking import filter_side, sort_cards


DEFAULT_HORIZONS: tuple[int, ...] = (1, 3, 5, 7, 10)


@dataclass
class RecommendationSnapshotStore:
    root_dir: Path
    timezone: str

    def _today_key(self) -> str:
        return datetime.now(ZoneInfo(self.timezone)).date().isoformat()

    def _path_for_date(self, date_key: str) -> Path:
        return self.root_dir / f"recommendations_{date_key}.json"

    def latest_path(self) -> Path | None:
        if not self.root_dir.exists():
            return None
        matches = sorted(self.root_dir.glob("recommendations_*.json"))
        return matches[-1] if matches else None

    def read_latest(self) -> dict | None:
        path = self.latest_path()
        if path is None:
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def read_for_today(self) -> dict | None:
        path = self._path_for_date(self._today_key())
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def write_today(self, payload: dict) -> Path:
        self.root_dir.mkdir(parents=True, exist_ok=True)
        path = self._path_for_date(self._today_key())
        temp_path = path.with_suffix(".tmp")
        temp_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")
        temp_path.replace(path)
        return path


def build_snapshot_payload(
    *,
    generated_at: str,
    market_date: str,
    model_version: str,
    config_used: str,
    horizons: list[int],
    recommendations_by_horizon: dict[str, dict],
) -> dict:
    return {
        "generated_at": generated_at,
        "market_date": market_date,
        "model_version": model_version,
        "config_used": config_used,
        "horizons": horizons,
        "recommendations_by_horizon": recommendations_by_horizon,
    }


def response_from_snapshot(
    snapshot: dict,
    *,
    horizon: int,
    side: str,
    top_n: int,
    symbols: list[str],
) -> dict | None:
    base_payload = snapshot.get("recommendations_by_horizon", {}).get(str(horizon))
    if base_payload is None:
        return None

    symbol_set = set(symbols)
    cards = [card for card in base_payload.get("cards", []) if card.get("ticker") in symbol_set]
    cards = sort_cards(filter_side(cards, side))[:top_n]

    return {
        "generated_at": snapshot.get("generated_at", base_payload.get("generated_at")),
        "model_version": snapshot.get("model_version", base_payload.get("model_version", "")),
        "config_used": snapshot.get("config_used", base_payload.get("config_used", "")),
        "sources": base_payload.get("sources", ["ml"]),
        "stocks_scanned": {"ml": len(symbol_set)},
        "count": len(cards),
        "cards": cards,
    }
