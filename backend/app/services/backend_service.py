from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from app.core.artifacts import ArtifactRegistry
from app.core.cache import TTLCache, market_aware_ttl
from app.core.errors import DataUnavailableError, OperationNotAllowedError
from app.core.settings import Settings
from app.engine.pipeline import InferencePipeline
from app.services.recommendation_snapshot import (
    DEFAULT_HORIZONS,
    DailyPayloadStore,
    RecommendationSnapshotStore,
    build_horizon_cards_from_predictions,
    build_horizon_snapshot_entry,
    response_from_snapshot,
    response_all_horizons_from_snapshot,
    build_snapshot_payload,
)


def _now_iso(tz_name: str) -> str:
    return datetime.now(ZoneInfo(tz_name)).isoformat()


class StockXpertBackendService:
    def __init__(self, settings: Settings, artifacts: ArtifactRegistry, cache: TTLCache) -> None:
        self.settings = settings
        self.artifacts = artifacts
        self.cache = cache
        self._pipeline: InferencePipeline | None = None
        self._last_runs: dict[str, str] = {}
        self.snapshot_store = RecommendationSnapshotStore(
            root_dir=settings.recommendations_snapshot_dir,
            timezone=settings.market_timezone,
        )
        self.detail_store = DailyPayloadStore(
            root_dir=settings.recommendations_snapshot_dir / "stock_detail",
            timezone=settings.market_timezone,
            prefix="detail",
        )
        self.chart_store = DailyPayloadStore(
            root_dir=settings.recommendations_snapshot_dir / "stock_chart",
            timezone=settings.market_timezone,
            prefix="chart",
        )
        self._canonical_stock_lookback = max(60, settings.max_stock_lookback_days)

    @property
    def pipeline(self) -> InferencePipeline:
        if self._pipeline is None:
            self._pipeline = InferencePipeline(self.artifacts.runtime, self.settings)
        return self._pipeline

    def _ttl(self) -> int:
        return market_aware_ttl(self.settings.market_ttl_seconds, self.settings.off_market_ttl_seconds)

    def _mark_run(self, name: str) -> None:
        self._last_runs[name] = _now_iso(self.settings.market_timezone)

    def _symbols_or_default(self, symbols: list[str] | None) -> list[str]:
        return self.artifacts.runtime.symbol_registry.validate(symbols)

    def _normalized_stock_lookback(self, lookback: int) -> int:
        return max(60, min(int(lookback), self._canonical_stock_lookback))

    def _slice_chart_payload(self, payload: dict[str, Any], key: str, lookback: int) -> dict[str, Any]:
        normalized_lookback = self._normalized_stock_lookback(lookback)
        trimmed = deepcopy(payload)
        trimmed[key] = payload.get(key, [])[-normalized_lookback:]
        if key == "points":
            trimmed["count"] = len(trimmed[key])
        return trimmed

    def _get_snapshot_or_raise(self) -> dict[str, Any]:
        snapshot = self.snapshot_store.read_preferred()
        if snapshot is None:
            raise DataUnavailableError(
                "No saved recommendation snapshot is available. Run the daily snapshot builder before serving traffic."
            )
        return snapshot

    def snapshot_freshness(self) -> dict[str, Any]:
        return self.snapshot_store.describe_freshness()

    def _recommendations_by_horizon_payload(
        self,
        predictions_by_symbol: dict[str, list[dict[str, Any]]],
        *,
        symbols: list[str],
        horizons: list[int],
        top_n: int,
        side: str,
        generated_at: str,
    ) -> dict[str, Any]:
        recommendations_by_horizon: dict[str, dict[str, Any]] = {}
        for horizon in horizons:
            cards = build_horizon_cards_from_predictions(
                predictions_by_symbol,
                horizon=horizon,
                side=side,
                top_n=top_n,
                symbols=symbols,
            )
            recommendations_by_horizon[str(horizon)] = build_horizon_snapshot_entry(
                horizon=horizon,
                generated_at=generated_at,
                model_version=self.artifacts.model_version(),
                config_used=str(self.settings.manifest_path),
                cards=cards,
                stocks_scanned=len(predictions_by_symbol),
            )

        now = datetime.now(ZoneInfo(self.settings.market_timezone))
        return {
            "generated_at": generated_at,
            "market_date": now.date().isoformat(),
            "model_version": self.artifacts.model_version(),
            "config_used": str(self.settings.manifest_path),
            "horizons": horizons,
            "recommendations_by_horizon": recommendations_by_horizon,
        }

    def health(self) -> dict[str, Any]:
        artifacts = self.artifacts.describe()
        snapshot = self.snapshot_freshness()
        return {
            "status": "ok" if snapshot["status"] != "missing" else "degraded",
            "generated_at": _now_iso(self.settings.market_timezone),
            "model_version": self.artifacts.model_version(),
            "artifacts": artifacts,
            "cache": self.cache.stats(),
            "supported_symbols": len(self.artifacts.manifest.trained_symbols),
            "last_runs": self._last_runs,
            "snapshot": snapshot,
        }

    def metadata_config(self) -> dict[str, Any]:
        return {
            "generated_at": _now_iso(self.settings.market_timezone),
            "artifact_contract": self.artifacts.describe(),
        }

    def get_recommendations(
        self,
        symbols: list[str] | None,
        horizon: int,
        top_n: int,
        side: str,
        prefer_saved: bool = True,
        force_live: bool = False,
    ) -> dict[str, Any]:
        validated_symbols = self._symbols_or_default(symbols)
        if prefer_saved and not force_live:
            snapshot = self._get_snapshot_or_raise()
            from_snapshot = response_from_snapshot(
                snapshot,
                horizon=horizon,
                side=side,
                top_n=top_n,
                symbols=validated_symbols,
            )
            if from_snapshot is None:
                raise DataUnavailableError(f"Horizon {horizon} is unavailable in the saved snapshot.")
            return from_snapshot

        if not self.settings.enable_live_recommendations:
            raise OperationNotAllowedError(
                "Live recommendation recompute is disabled. Use the saved daily snapshot instead."
            )

        cache_key = f"recs:{','.join(validated_symbols)}:{horizon}:{top_n}:{side}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        payload = self.pipeline.recommendations(validated_symbols, horizon=horizon, top_n=top_n, side=side)
        self.cache.set(cache_key, payload, self._ttl())
        self._mark_run("recommendations")
        return payload

    def get_recommendations_by_horizon(
        self,
        symbols: list[str] | None,
        top_n: int,
        side: str,
        prefer_saved: bool = True,
        force_live: bool = False,
    ) -> dict[str, Any]:
        validated_symbols = self._symbols_or_default(symbols)
        horizons = [int(value) for value in self.artifacts.runtime.manifest.horizons]

        if prefer_saved and not force_live:
            snapshot = self._get_snapshot_or_raise()
            return response_all_horizons_from_snapshot(
                snapshot,
                horizons=horizons,
                side=side,
                top_n=top_n,
                symbols=validated_symbols,
            )

        if not self.settings.enable_live_recommendations:
            raise OperationNotAllowedError(
                "Live recommendation recompute is disabled. Use the saved daily snapshot instead."
            )

        cache_key = f"recs-all:{','.join(validated_symbols)}:{top_n}:{side}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        context = self.pipeline.run(validated_symbols)
        payload = self._recommendations_by_horizon_payload(
            context.predictions,
            symbols=validated_symbols,
            horizons=horizons,
            top_n=top_n,
            side=side,
            generated_at=_now_iso(self.settings.market_timezone),
        )
        self.cache.set(cache_key, payload, self._ttl())
        self._mark_run("recommendations")
        return payload

    def build_recommendation_snapshot(self, horizons: tuple[int, ...] = DEFAULT_HORIZONS) -> dict[str, Any]:
        symbols = self._symbols_or_default(None)
        now = datetime.now(ZoneInfo(self.settings.market_timezone))
        context = self.pipeline.run(symbols)
        payload = self._recommendations_by_horizon_payload(
            context.predictions,
            symbols=symbols,
            horizons=[int(value) for value in horizons],
            top_n=len(symbols),
            side="both",
            generated_at=now.isoformat(),
        )
        snapshot_payload = build_snapshot_payload(
            generated_at=payload["generated_at"],
            market_date=payload["market_date"],
            model_version=payload["model_version"],
            config_used=payload["config_used"],
            horizons=payload["horizons"],
            recommendations_by_horizon=payload["recommendations_by_horizon"],
        )
        snapshot_path = self.snapshot_store.write_today(snapshot_payload)
        self._mark_run("recommendations_snapshot")
        return {"path": str(snapshot_path), "market_date": snapshot_payload["market_date"], "horizons": list(horizons)}

    def get_dashboard(self, symbols: list[str] | None, horizon: int, top_n: int) -> dict[str, Any]:
        validated_symbols = self._symbols_or_default(symbols)
        cache_key = f"dashboard:{','.join(validated_symbols)}:{horizon}:{top_n}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        recs = self.get_recommendations(
            validated_symbols,
            horizon=horizon,
            top_n=top_n,
            side="both",
            prefer_saved=True,
            force_live=False,
        )
        cards = recs["cards"]
        long_signals = sum(1 for card in cards if card["direction"] == "long")
        short_signals = sum(1 for card in cards if card["direction"] == "short")
        regime = self.pipeline.market_regime()

        sector_summary: dict[str, dict[str, int]] = {}
        for card in cards:
            sector = card.get("sector") or "Other"
            if sector not in sector_summary:
                sector_summary[sector] = {"long": 0, "short": 0, "neutral": 0}
            dir_key = card.get("direction", "neutral")
            if dir_key in ("long", "short", "neutral"):
                sector_summary[sector][dir_key] += 1
            else:
                sector_summary[sector]["neutral"] += 1

        payload = {
            "generated_at": _now_iso(self.settings.market_timezone),
            "model_version": self.artifacts.model_version(),
            "market_regime": {
                "label": regime.get("regime", "Unknown"),
                "confidence": 73.0,
                "regime": regime.get("regime", "Unknown"),
            },
            "aggregate_sentiment": self.pipeline.aggregate_sentiment(),
            "signal_counts": {
                "long": long_signals,
                "short": short_signals,
                "neutral": max(0, len(cards) - long_signals - short_signals),
            },
            "data_freshness": {
                "generated_at": recs["generated_at"],
                "snapshot_market_date": self.snapshot_freshness().get("market_date"),
            },
            "sector_summary": sector_summary,
            "top_cards": cards,
        }
        self.cache.set(cache_key, payload, self._ttl())
        self._mark_run("dashboard")
        return payload

    def stock_deep_dive(self, ticker: str, lookback: int = 60) -> dict[str, Any]:
        symbol = self.artifacts.runtime.symbol_registry.validate([ticker])[0]
        normalized_lookback = self._normalized_stock_lookback(lookback)
        cache_key = f"detail:{symbol}:{normalized_lookback}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        saved = self.detail_store.read_for_today(symbol)
        if saved is not None:
            trimmed = self._slice_chart_payload(saved, "chart", normalized_lookback)
            self.cache.set(cache_key, trimmed, self._ttl())
            return trimmed

        payload = self.pipeline.stock_detail(symbol, lookback=self._canonical_stock_lookback)
        self.detail_store.write_today(symbol, payload)
        trimmed = self._slice_chart_payload(payload, "chart", normalized_lookback)
        self.cache.set(cache_key, trimmed, self._ttl())
        self._mark_run("stock_detail")
        return trimmed

    def stock_chart(self, ticker: str, lookback: int = 60) -> dict[str, Any]:
        symbol = self.artifacts.runtime.symbol_registry.validate([ticker])[0]
        normalized_lookback = self._normalized_stock_lookback(lookback)
        cache_key = f"chart:{symbol}:{normalized_lookback}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        saved = self.chart_store.read_for_today(symbol)
        if saved is not None:
            trimmed = self._slice_chart_payload(saved, "points", normalized_lookback)
            self.cache.set(cache_key, trimmed, self._ttl())
            return trimmed

        payload = self.pipeline.stock_chart(symbol, lookback=self._canonical_stock_lookback)
        self.chart_store.write_today(symbol, payload)
        trimmed = self._slice_chart_payload(payload, "points", normalized_lookback)
        self.cache.set(cache_key, trimmed, self._ttl())
        self._mark_run("stock_chart")
        return trimmed
