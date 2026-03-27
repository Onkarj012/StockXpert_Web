from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

from backend.app.core.errors import DataUnavailableError


class YFinanceMarketDataProvider:
    def fetch_history(self, symbols: list[str], lookback_days: int) -> dict[str, pd.DataFrame]:
        end = datetime.utcnow()
        start = end - timedelta(days=max(lookback_days, 400))

        payload: dict[str, pd.DataFrame] = {}
        unavailable: list[str] = []
        for symbol in symbols:
            try:
                df = yf.download(
                    symbol,
                    start=start.strftime("%Y-%m-%d"),
                    end=(end + timedelta(days=1)).strftime("%Y-%m-%d"),
                    auto_adjust=True,
                    progress=False,
                )
            except ValueError:
                # yfinance can raise "No objects to concatenate" for missing tickers/data outages.
                unavailable.append(symbol)
                continue
            except Exception:
                unavailable.append(symbol)
                continue
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            df = df.dropna(how="all")
            if df.empty:
                unavailable.append(symbol)
                continue
            df.index = pd.to_datetime(df.index).tz_localize(None)
            payload[symbol] = df
        if not payload:
            if unavailable:
                raise DataUnavailableError(
                    f"No market data available for requested symbols: {', '.join(unavailable)}"
                )
            raise DataUnavailableError("No market data available for requested symbols")
        return payload
