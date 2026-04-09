from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

from app.core.errors import DataUnavailableError


class YFinanceMarketDataProvider:
    def __init__(self, chunk_size: int = 20) -> None:
        self.chunk_size = chunk_size

    def _normalize_frame(self, frame: pd.DataFrame) -> pd.DataFrame:
        if isinstance(frame.columns, pd.MultiIndex):
            frame.columns = frame.columns.get_level_values(0)
        frame = frame.dropna(how="all")
        if frame.empty:
            return frame
        frame.index = pd.to_datetime(frame.index).tz_localize(None)
        return frame

    def _download_single(self, symbol: str, start: str, end: str) -> pd.DataFrame:
        frame = yf.download(
            symbol,
            start=start,
            end=end,
            auto_adjust=True,
            progress=False,
            threads=True,
        )
        return self._normalize_frame(frame)

    def _download_chunk(self, symbols: list[str], start: str, end: str) -> dict[str, pd.DataFrame]:
        if len(symbols) == 1:
            frame = self._download_single(symbols[0], start, end)
            return {symbols[0]: frame} if not frame.empty else {}

        frame = yf.download(
            symbols,
            start=start,
            end=end,
            auto_adjust=True,
            progress=False,
            group_by="ticker",
            threads=True,
        )
        if not isinstance(frame.columns, pd.MultiIndex):
            return {}

        level0 = set(frame.columns.get_level_values(0))
        level1 = set(frame.columns.get_level_values(1))
        if not any(symbol in level0 for symbol in symbols) and any(symbol in level1 for symbol in symbols):
            frame = frame.swaplevel(0, 1, axis=1).sort_index(axis=1)

        payload: dict[str, pd.DataFrame] = {}
        tickers = set(frame.columns.get_level_values(0))
        for symbol in symbols:
            if symbol not in tickers:
                continue
            symbol_frame = self._normalize_frame(frame[symbol].copy())
            if not symbol_frame.empty:
                payload[symbol] = symbol_frame
        return payload

    def fetch_history(self, symbols: list[str], lookback_days: int) -> dict[str, pd.DataFrame]:
        end = datetime.utcnow()
        start = end - timedelta(days=max(lookback_days, 400))
        start_str = start.strftime("%Y-%m-%d")
        end_str = (end + timedelta(days=1)).strftime("%Y-%m-%d")

        payload: dict[str, pd.DataFrame] = {}
        unavailable: list[str] = []
        for idx in range(0, len(symbols), self.chunk_size):
            chunk = symbols[idx : idx + self.chunk_size]
            try:
                chunk_payload = self._download_chunk(chunk, start_str, end_str)
            except ValueError:
                chunk_payload = {}
            except Exception:
                chunk_payload = {}

            if len(chunk_payload) != len(chunk):
                for symbol in chunk:
                    if symbol in chunk_payload:
                        payload[symbol] = chunk_payload[symbol]
                        continue
                    try:
                        symbol_frame = self._download_single(symbol, start_str, end_str)
                    except Exception:
                        symbol_frame = pd.DataFrame()
                    if symbol_frame.empty:
                        unavailable.append(symbol)
                        continue
                    payload[symbol] = symbol_frame
                continue

            payload.update(chunk_payload)
        if not payload:
            if unavailable:
                raise DataUnavailableError(
                    f"No market data available for requested symbols: {', '.join(unavailable)}"
                )
            raise DataUnavailableError("No market data available for requested symbols")
        return payload
