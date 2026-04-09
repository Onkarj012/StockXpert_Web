from __future__ import annotations

from datetime import datetime, timedelta
import logging
from threading import Event, Thread
from zoneinfo import ZoneInfo

from app.services.backend_service import StockXpertBackendService

logger = logging.getLogger("stockxpert.scheduler")


class SnapshotScheduler:
    def __init__(
        self,
        service: StockXpertBackendService,
        *,
        timezone: str,
        hour: int,
        minute: int,
    ) -> None:
        self.service = service
        self.timezone = timezone
        self.hour = hour
        self.minute = minute
        self._stop_event = Event()
        self._thread: Thread | None = None

    def start(self) -> None:
        if self._thread is not None and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = Thread(target=self._run_loop, name="stockxpert-snapshot-scheduler", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=2)

    def _run_loop(self) -> None:
        self._run_catch_up_if_needed()
        while not self._stop_event.is_set():
            now = datetime.now(ZoneInfo(self.timezone))
            next_run = self._next_run_after(now)
            logger.info("Next recommendation snapshot refresh scheduled for %s", next_run.isoformat())
            wait_seconds = max(1.0, (next_run - now).total_seconds())
            if self._stop_event.wait(wait_seconds):
                return
            self._run_snapshot()

    def _run_catch_up_if_needed(self) -> None:
        now = datetime.now(ZoneInfo(self.timezone))
        freshness = self.service.snapshot_freshness()
        scheduled_today = now.replace(hour=self.hour, minute=self.minute, second=0, microsecond=0)
        if freshness.get("status") == "missing":
            logger.info("No saved recommendation snapshot found; building an initial snapshot now.")
            self._run_snapshot()
            return
        if now.weekday() >= 5:
            return
        if freshness.get("is_today"):
            return
        if now >= scheduled_today:
            logger.info("No current-day snapshot found after the scheduled refresh window; building one now.")
            self._run_snapshot()

    def _next_run_after(self, now: datetime) -> datetime:
        candidate = now.replace(hour=self.hour, minute=self.minute, second=0, microsecond=0)
        if now >= candidate:
            candidate += timedelta(days=1)
        while candidate.weekday() >= 5:
            candidate += timedelta(days=1)
        return candidate

    def _run_snapshot(self) -> None:
        try:
            result = self.service.build_recommendation_snapshot()
            logger.info(
                "Daily recommendation snapshot refreshed: path=%s market_date=%s",
                result["path"],
                result["market_date"],
            )
        except Exception:
            logger.exception("Scheduled recommendation snapshot refresh failed")
