from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from backend.app.core.artifacts import ArtifactRegistry
from backend.app.core.cache import TTLCache, market_aware_ttl
from backend.app.core.settings import Settings
from backend.app.engine.pipeline import InferencePipeline


def _now_iso(tz_name: str) -> str:
    return datetime.now(ZoneInfo(tz_name)).isoformat()


class StockXpertBackendService:
    def __init__(self, settings: Settings, artifacts: ArtifactRegistry, cache: TTLCache) -> None:
        self.settings = settings
        self.artifacts = artifacts
        self.cache = cache
        self.pipeline = InferencePipeline(artifacts.runtime, settings)
        self._last_runs: dict[str, str] = {}

    def _ttl(self) -> int:
        return market_aware_ttl(self.settings.market_ttl_seconds, self.settings.off_market_ttl_seconds)

    def _mark_run(self, name: str) -> None:
        self._last_runs[name] = _now_iso(self.settings.market_timezone)

    def _symbols_or_default(self, symbols: list[str] | None) -> list[str]:
        return self.artifacts.runtime.symbol_registry.validate(symbols)

    def health(self) -> dict[str, Any]:
        artifacts = self.artifacts.describe()
        artifacts["checkpoint_meta"] = self.artifacts.checkpoint_meta()
        return {
            "status": "ok",
            "generated_at": _now_iso(self.settings.market_timezone),
            "model_version": self.artifacts.model_version(),
            "artifacts": artifacts,
            "cache": self.cache.stats(),
            "supported_symbols": len(self.artifacts.runtime.symbol_registry.symbols),
            "last_runs": self._last_runs,
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
    ) -> dict[str, Any]:
        validated_symbols = self._symbols_or_default(symbols)
        cache_key = f"recs:{','.join(validated_symbols)}:{horizon}:{top_n}:{side}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        payload = self.pipeline.recommendations(validated_symbols, horizon=horizon, top_n=top_n, side=side)
        self.cache.set(cache_key, payload, self._ttl())
        self._mark_run("recommendations")
        return payload

    def get_dashboard(self, symbols: list[str] | None, horizon: int, top_n: int) -> dict[str, Any]:
        validated_symbols = self._symbols_or_default(symbols)
        cache_key = f"dashboard:{','.join(validated_symbols)}:{horizon}:{top_n}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        payload = self.pipeline.dashboard(validated_symbols, horizon=horizon, top_n=top_n)
        self.cache.set(cache_key, payload, self._ttl())
        self._mark_run("dashboard")
        return payload

    def stock_deep_dive(self, ticker: str, lookback: int = 60) -> dict[str, Any]:
        symbol = self.artifacts.runtime.symbol_registry.validate([ticker])[0]
        cache_key = f"detail:{symbol}:{lookback}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        payload = self.pipeline.stock_detail(symbol, lookback=lookback)
        self.cache.set(cache_key, payload, self._ttl())
        self._mark_run("stock_detail")
        return payload

    def stock_chart(self, ticker: str, lookback: int = 60) -> dict[str, Any]:
        symbol = self.artifacts.runtime.symbol_registry.validate([ticker])[0]
        cache_key = f"chart:{symbol}:{lookback}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        payload = self.pipeline.stock_chart(symbol, lookback=lookback)
        self.cache.set(cache_key, payload, self._ttl())
        self._mark_run("stock_chart")
        return payload
