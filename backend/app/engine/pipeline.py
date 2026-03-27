from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
import yfinance as yf

from backend.app.core.errors import DataUnavailableError
from backend.app.core.settings import Settings
from backend.app.engine.checkpoint_loader import RuntimeBundle
from backend.app.engine.data.csv_sentiment import CSVSentimentClient
from backend.app.engine.data.market_data import YFinanceMarketDataProvider
from backend.app.engine.data.sentiment import merge_sentiment_with_prices
from backend.app.engine.data.trading_calendar import TradingCalendar
from backend.app.engine.predictor import BackendPredictor
from backend.app.engine.ranking import filter_side, sort_cards


@dataclass
class PipelineContext:
    predictions: dict[str, list[dict]]
    feature_map: dict[str, pd.DataFrame]
    price_map: dict[str, pd.DataFrame]


def _now_iso(tz_name: str) -> str:
    return datetime.now(ZoneInfo(tz_name)).isoformat()


class InferencePipeline:
    def __init__(self, runtime: RuntimeBundle, settings: Settings) -> None:
        self.runtime = runtime
        self.settings = settings
        self.market_data = YFinanceMarketDataProvider()
        self.predictor = BackendPredictor(runtime)

    def _attach_sentiment(self, price_map: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
        def with_defaults() -> dict[str, pd.DataFrame]:
            enriched: dict[str, pd.DataFrame] = {}
            for symbol, frame in price_map.items():
                work = frame.copy()
                work["sentiment_mean"] = 0.0
                work["sentiment_count"] = 0
                work["sentiment_std"] = 0.0
                enriched[symbol] = work
            return enriched

        if self.settings.stockxpert_sentiment_csv is None or not self.settings.stockxpert_sentiment_csv.exists():
            return with_defaults()

        calendar = TradingCalendar(price_map)
        client = CSVSentimentClient(str(self.settings.stockxpert_sentiment_csv))
        first_symbol = next(iter(price_map))
        start_date = price_map[first_symbol].index.min()
        end_date = price_map[first_symbol].index.max()
        sentiment = client.fetch_for_symbols(
            symbols=list(price_map.keys()),
            start_date=start_date,
            end_date=end_date,
            trading_calendar=calendar.all_trading_dates,
        )
        if sentiment.empty:
            return with_defaults()
        return merge_sentiment_with_prices(price_map, sentiment)

    def run(self, symbols: list[str]) -> PipelineContext:
        price_map = self.market_data.fetch_history(symbols, lookback_days=450)
        price_map = self._attach_sentiment(price_map)
        feature_map = self.runtime.feature_builder.build_features(price_map, is_inference=True)
        predictions, valid_feature_map = self.predictor.predict(feature_map)
        return PipelineContext(predictions=predictions, feature_map=valid_feature_map, price_map=price_map)

    def recommendations(self, symbols: list[str], horizon: int, top_n: int, side: str) -> dict:
        context = self.run(symbols)
        cards = []
        target_horizon = f"H{horizon}"
        for symbol_cards in context.predictions.values():
            match = next((card for card in symbol_cards if card["horizon"] == target_horizon), None)
            if match is not None:
                cards.append(match)
        cards = sort_cards(filter_side(cards, side))[:top_n]
        return {
            "generated_at": _now_iso(self.settings.market_timezone),
            "model_version": self.runtime.manifest.model_version,
            "config_used": str(self.settings.manifest_path),
            "sources": ["ml"],
            "stocks_scanned": {"ml": len(context.predictions)},
            "count": len(cards),
            "cards": cards,
        }

    def dashboard(self, symbols: list[str], horizon: int, top_n: int) -> dict:
        recs = self.recommendations(symbols, horizon, top_n, side="both")
        cards = recs["cards"]
        bullish = sum(1 for card in cards if card["direction"] == "LONG")
        bearish = sum(1 for card in cards if card["direction"] == "SHORT")
        return {
            "generated_at": _now_iso(self.settings.market_timezone),
            "model_version": self.runtime.manifest.model_version,
            "market_regime": self.market_regime(),
            "aggregate_sentiment": self.aggregate_sentiment(),
            "signal_counts": {"bullish": bullish, "bearish": bearish, "total": len(cards)},
            "data_freshness": {"generated_at": recs["generated_at"]},
            "sector_summary": {},
            "top_cards": cards,
        }

    def stock_detail(self, symbol: str, lookback: int) -> dict:
        context = self.run([symbol])
        feature_df = context.feature_map.get(symbol)
        if feature_df is None or feature_df.empty:
            raise DataUnavailableError(f"No feature data available for {symbol}")
        latest = feature_df.iloc[-1]
        cards = context.predictions[symbol]
        chart = self._chart_points(feature_df.tail(max(lookback, 60)), include_overlays=False)
        return {
            "generated_at": _now_iso(self.settings.market_timezone),
            "ticker": symbol,
            "company_name": symbol.replace(".NS", "").replace(".BO", ""),
            "model_version": self.runtime.manifest.model_version,
            "current_price": float(latest.get("Close", 0.0)),
            "predictions": {"ml_horizons": cards},
            "gap_prediction": {},
            "news_catalysts": [],
            "support_resistance": {
                "fib_levels": {key: float(latest.get(key, np.nan)) for key in ("fib_38.2", "fib_50.0", "fib_61.8")},
                "model_levels": cards,
            },
            "key_indicators": {
                "rsi": float(latest.get("rsi_14", np.nan)),
                "macd_hist": float(latest.get("macd_hist", np.nan)),
                "bb_zscore": float(latest.get("bb_zscore", np.nan)),
                "adx": float(latest.get("adx", np.nan)),
                "volume_ratio": float(latest.get("relative_volume_10d", np.nan)),
                "stochastic": float(latest.get("stoch_k", np.nan)),
            },
            "peer_comparison": {},
            "features_snapshot": {key: _json_scalar(value) for key, value in latest.to_dict().items()},
            "chart": chart,
        }

    def stock_chart(self, symbol: str, lookback: int) -> dict:
        context = self.run([symbol])
        feature_df = context.feature_map.get(symbol)
        if feature_df is None or feature_df.empty:
            raise DataUnavailableError(f"No chart data available for {symbol}")
        points = self._chart_points(feature_df.tail(max(lookback, 60)), include_overlays=True)
        return {
            "generated_at": _now_iso(self.settings.market_timezone),
            "ticker": symbol,
            "company_name": symbol.replace(".NS", "").replace(".BO", ""),
            "count": len(points),
            "points": points,
        }

    def market_regime(self) -> dict:
        df = yf.download(self.settings.market_index_symbol, period="6mo", interval="1d", auto_adjust=True, progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        close = df["Close"].dropna()
        if close.empty:
            return {"regime": "Unknown"}
        sma20 = close.rolling(20).mean().iloc[-1]
        sma50 = close.rolling(50).mean().iloc[-1]
        last = close.iloc[-1]
        if last > sma20 > sma50:
            regime = "Bull"
        elif last < sma20 < sma50:
            regime = "Bear"
        else:
            regime = "Sideways"
        return {
            "regime": regime,
            "index_close": float(last),
            "sma20": float(sma20),
            "sma50": float(sma50),
            "as_of": close.index[-1].isoformat(),
        }

    def aggregate_sentiment(self) -> dict:
        if self.settings.stockxpert_sentiment_csv is None or not self.settings.stockxpert_sentiment_csv.exists():
            return {"value": 0.0, "backend": "none", "articles": 0}
        df = pd.read_csv(self.settings.stockxpert_sentiment_csv)
        if "sentiment_score" not in df.columns:
            if "Sentiment" in df.columns:
                df["sentiment_score"] = df["Sentiment"].map({"Positive": 1.0, "Neutral": 0.0, "Negative": -1.0})
            else:
                return {"value": 0.0, "backend": "csv", "articles": 0}
        date_column = next((column for column in ("Publish Date", "date", "datetime") if column in df.columns), None)
        if date_column:
            df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
            recent = df[df[date_column] >= datetime.now() - timedelta(days=3)]
        else:
            recent = df
        if recent.empty:
            return {"value": 0.0, "backend": "csv", "articles": 0}
        return {
            "value": float(pd.to_numeric(recent["sentiment_score"], errors="coerce").fillna(0.0).mean()),
            "backend": "csv",
            "articles": int(len(recent)),
        }

    def _chart_points(self, frame: pd.DataFrame, include_overlays: bool) -> list[dict]:
        points = []
        for idx, row in frame.iterrows():
            point = {
                "date": idx.isoformat(),
                "open": float(row.get("Open", 0.0)),
                "high": float(row.get("High", 0.0)),
                "low": float(row.get("Low", 0.0)),
                "close": float(row.get("Close", 0.0)),
                "volume": float(row.get("Volume", 0.0)),
            }
            if include_overlays:
                point["overlays"] = {
                    "sma_20": float(row.get("sma_20", np.nan)),
                    "sma_50": float(row.get("sma_50", np.nan)),
                    "vwap_20": float(row.get("vwap_20", np.nan)),
                    "support": float(row.get("fib_38.2", np.nan)),
                    "resistance": float(row.get("fib_61.8", np.nan)),
                }
            else:
                point.update(
                    {
                        "sma_20": float(row.get("sma_20", np.nan)),
                        "sma_50": float(row.get("sma_50", np.nan)),
                        "bb_upper": float(row.get("bb_mid", np.nan) + 2.0 * row.get("bb_std", 0.0)),
                        "bb_lower": float(row.get("bb_mid", np.nan) - 2.0 * row.get("bb_std", 0.0)),
                        "vwap_20": float(row.get("vwap_20", np.nan)),
                    }
                )
            points.append(point)
        return points


def _json_scalar(value):
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    return value
