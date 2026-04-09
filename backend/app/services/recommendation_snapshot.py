from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import json
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from app.engine.ranking import filter_side, sort_cards


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

    def read_preferred(self) -> dict | None:
        return self.read_for_today() or self.read_latest()

    def describe_freshness(self) -> dict[str, Any]:
        today_path = self._path_for_date(self._today_key())
        path = today_path if today_path.exists() else self.latest_path()
        if path is None:
            return {
                "status": "missing",
                "market_date": None,
                "generated_at": None,
                "path": None,
                "is_today": False,
            }

        payload = json.loads(path.read_text(encoding="utf-8"))
        market_date = payload.get("market_date")
        return {
            "status": "current" if path == today_path else "stale",
            "market_date": market_date,
            "generated_at": payload.get("generated_at"),
            "path": str(path),
            "is_today": market_date == self._today_key(),
        }

    def write_today(self, payload: dict) -> Path:
        self.root_dir.mkdir(parents=True, exist_ok=True)
        path = self._path_for_date(self._today_key())
        temp_path = path.with_suffix(".tmp")
        temp_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")
        temp_path.replace(path)
        return path


@dataclass
class DailyPayloadStore:
    root_dir: Path
    timezone: str
    prefix: str

    def _today_key(self) -> str:
        return datetime.now(ZoneInfo(self.timezone)).date().isoformat()

    def _safe_key(self, cache_key: str) -> str:
        return "".join(char if char.isalnum() else "_" for char in cache_key).strip("_")

    def _path_for_today(self, cache_key: str) -> Path:
        safe_key = self._safe_key(cache_key)
        return self.root_dir / f"{self.prefix}_{self._today_key()}_{safe_key}.json"

    def read_for_today(self, cache_key: str) -> dict | None:
        path = self._path_for_today(cache_key)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def write_today(self, cache_key: str, payload: dict[str, Any]) -> Path:
        self.root_dir.mkdir(parents=True, exist_ok=True)
        path = self._path_for_today(cache_key)
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


def build_recommendation_response(
    *,
    generated_at: str,
    model_version: str,
    config_used: str,
    cards: list[dict[str, Any]],
    stocks_scanned: int,
    sources: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "generated_at": generated_at,
        "model_version": model_version,
        "config_used": config_used,
        "sources": sources or ["ml"],
        "stocks_scanned": {"ml": stocks_scanned},
        "count": len(cards),
        "cards": cards,
    }


def build_horizon_snapshot_entry(
    *,
    horizon: int,
    cards: list[dict[str, Any]],
    generated_at: str,
    model_version: str,
    config_used: str,
    stocks_scanned: int,
    sources: list[str] | None = None,
) -> dict[str, Any]:
    payload = build_recommendation_response(
        generated_at=generated_at,
        model_version=model_version,
        config_used=config_used,
        cards=cards,
        stocks_scanned=stocks_scanned,
        sources=sources,
    )
    return {
        "horizon": horizon,
        **payload,
    }


def build_horizon_cards_from_predictions(
    predictions_by_symbol: dict[str, list[dict[str, Any]]],
    *,
    horizon: int,
    side: str,
    top_n: int | None,
    symbols: list[str],
) -> list[dict[str, Any]]:
    target_horizon = f"H{horizon}"
    symbol_set = set(symbols)
    cards = [
        card
        for symbol_cards in predictions_by_symbol.values()
        for card in symbol_cards
        if card.get("horizon") == target_horizon and card.get("ticker") in symbol_set
    ]
    cards = sort_cards(filter_side(cards, side))
    if top_n is not None:
        cards = cards[:top_n]
    return cards


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
    return build_recommendation_response(
        generated_at=snapshot.get("generated_at", base_payload.get("generated_at", "")),
        model_version=snapshot.get("model_version", base_payload.get("model_version", "")),
        config_used=snapshot.get("config_used", base_payload.get("config_used", "")),
        cards=cards,
        stocks_scanned=len(symbol_set),
        sources=base_payload.get("sources", ["ml"]),
    )


def response_all_horizons_from_snapshot(
    snapshot: dict,
    *,
    horizons: list[int],
    side: str,
    top_n: int,
    symbols: list[str],
) -> dict[str, Any]:
    recommendations_by_horizon: dict[str, dict[str, Any]] = {}
    for horizon in horizons:
        base_payload = snapshot.get("recommendations_by_horizon", {}).get(str(horizon))
        if base_payload is None:
            continue
        symbol_set = set(symbols)
        cards = [card for card in base_payload.get("cards", []) if card.get("ticker") in symbol_set]
        cards = sort_cards(filter_side(cards, side))[:top_n]
        recommendations_by_horizon[str(horizon)] = build_horizon_snapshot_entry(
            horizon=horizon,
            generated_at=snapshot.get("generated_at", base_payload.get("generated_at", "")),
            model_version=snapshot.get("model_version", base_payload.get("model_version", "")),
            config_used=snapshot.get("config_used", base_payload.get("config_used", "")),
            cards=cards,
            stocks_scanned=len(symbol_set),
            sources=base_payload.get("sources", ["ml"]),
        )

    return {
        "generated_at": snapshot.get("generated_at", ""),
        "market_date": snapshot.get("market_date", ""),
        "model_version": snapshot.get("model_version", ""),
        "config_used": snapshot.get("config_used", ""),
        "horizons": horizons,
        "recommendations_by_horizon": recommendations_by_horizon,
    }
