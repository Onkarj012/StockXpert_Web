from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time
from threading import RLock
from typing import Any
from zoneinfo import ZoneInfo


@dataclass
class CacheItem:
    value: Any
    expires_at: float
    created_at: float


class TTLCache:
    def __init__(self) -> None:
        self._store: dict[str, CacheItem] = {}
        self._lock = RLock()

    def get(self, key: str) -> Any | None:
        now = datetime.now().timestamp()
        with self._lock:
            item = self._store.get(key)
            if item is None:
                return None
            if item.expires_at < now:
                self._store.pop(key, None)
                return None
            return item.value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        now = datetime.now().timestamp()
        with self._lock:
            self._store[key] = CacheItem(
                value=value,
                created_at=now,
                expires_at=now + max(1, int(ttl_seconds)),
            )

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def stats(self) -> dict[str, Any]:
        now = datetime.now().timestamp()
        with self._lock:
            alive = 0
            for item in self._store.values():
                if item.expires_at >= now:
                    alive += 1
            return {"items": alive, "total": len(self._store)}


def market_aware_ttl(market_ttl: int, off_market_ttl: int) -> int:
    now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
    weekday = now_ist.weekday()
    if weekday >= 5:
        return off_market_ttl

    market_open = time(9, 15)
    market_close = time(15, 30)
    if market_open <= now_ist.time() <= market_close:
        return market_ttl
    return off_market_ttl
