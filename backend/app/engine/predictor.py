from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import pandas as pd
import torch

from app.core.errors import DataUnavailableError
from app.engine.checkpoint_loader import RuntimeBundle

SYMBOL_SECTORS: dict[str, str] = {
    "RELIANCE.NS": "Energy",
    "TCS.NS": "IT",
    "HDFCBANK.NS": "Financial Services",
    "INFOSYS.NS": "IT",
    "ICICIBANK.NS": "Financial Services",
    "HINDUNILVR.NS": "FMCG",
    "LT.NS": "Infrastructure",
    "SBIN.NS": "Financial Services",
    "BHARTIARTL.NS": "Telecom",
    "ITC.NS": "FMCG",
    "KOTAKBANK.NS": "Financial Services",
    "AXISBANK.NS": "Financial Services",
    "ASIANPAINT.NS": "Consumer Goods",
    "MARUTI.NS": "Automobile",
    "SUNPHARMA.NS": "Pharma",
    "TITAN.NS": "Consumer Goods",
    "BAJFINANCE.NS": "Financial Services",
    "NESTLEIND.NS": "FMCG",
    "ONGC.NS": "Energy",
    "JSWSTEEL.NS": "Metals",
    "HCLTECH.NS": "IT",
    "WIPRO.NS": "IT",
    "ULTRACEMCO.NS": "Cement",
    "ADANIPORTS.NS": "Infrastructure",
    "POWERGRID.NS": "Power",
    "NTPC.NS": "Power",
    "COALINDIA.NS": "Energy",
    "INDUSINDBK.NS": "Financial Services",
    "M&M.NS": "Automobile",
    "TECHM.NS": "IT",
    "BAJAJFINSV.NS": "Financial Services",
    "CIPLA.NS": "Pharma",
    "DRREDDY.NS": "Pharma",
    "HEROMOTOCO.NS": "Automobile",
    "EICHERMOT.NS": "Automobile",
    "GRASIM.NS": "Cement",
    "ADANIENT.NS": "Conglomerate",
    "ADANIPOWER.NS": "Power",
    "BPCL.NS": "Energy",
    "BRITANNIA.NS": "FMCG",
    "CHOLAFIN.NS": "Financial Services",
    "COLPAL.NS": "FMCG",
    "DIVISLAB.NS": "Pharma",
    "DLF.NS": "Real Estate",
    "GAIL.NS": "Energy",
    "GODREJCP.NS": "FMCG",
    "HAL.NS": "Aerospace",
    "HAVELLS.NS": "Consumer Goods",
    "HDFCLIFE.NS": "Insurance",
    "ICICIGI.NS": "Insurance",
    "ICICIPRULI.NS": "Insurance",
    "IOC.NS": "Energy",
    "JINDALSTEL.NS": "Metals",
    "JUBLFOOD.NS": "FMCG",
    "KFA.NS": "FMCG",
    "LICHSGFIN.NS": "Insurance",
    "LTIM.NS": "IT",
    "LUPIN.NS": "Pharma",
    "MARICO.NS": "FMCG",
    "MOTHERSON.NS": "Automobile",
    "NMDC.NS": "Metals",
    "OBEROIREALTY.NS": "Real Estate",
    "ONGC.NS": "Energy",
    "PERSISTENT.NS": "IT",
    "PIDILITIND.NS": "Chemicals",
    "PFC.NS": "Financial Services",
    "POWERGRID.NS": "Power",
    "RECLTD.NS": "Financial Services",
    "SAIL.NS": "Metals",
    "SBILIFE.NS": "Insurance",
    "SHREECEM.NS": "Cement",
    "SHRIRAMFIN.NS": "Financial Services",
    "SIEMENS.NS": "Industrial",
    "SUNTV.NS": "Media",
    "TATACONSUM.NS": "FMCG",
    "TATASTEEL.NS": "Metals",
    "TCS.NS": "IT",
    "TECHM.NS": "IT",
    "TORNTPHARM.NS": "Pharma",
    "TRENT.NS": "Retail",
    "TVSMOTOR.NS": "Automobile",
    "UNIONBANK.NS": "Financial Services",
    "UPL.NS": "Chemicals",
    "VEDL.NS": "Metals",
    "WIPRO.NS": "IT",
    "ZOMATO.NS": "IT",
    "INFY.NS": "IT",
    "HDFCBANK.NS": "Financial Services",
}


@dataclass
class PreparedSymbol:
    symbol: str
    feature_row: pd.Series
    x_short: np.ndarray
    x_mid: np.ndarray
    x_long: np.ndarray
    x_context: np.ndarray
    x_sentiment: np.ndarray


class BackendPredictor:
    def __init__(self, runtime: RuntimeBundle) -> None:
        self.runtime = runtime

    def prepare_features(self, feature_map: dict[str, pd.DataFrame]) -> tuple[list[PreparedSymbol], dict[str, pd.DataFrame]]:
        prepared: list[PreparedSymbol] = []
        valid_feature_map: dict[str, pd.DataFrame] = {}
        manifest = self.runtime.manifest

        for symbol, frame in feature_map.items():
            if frame.empty:
                continue
            if len(frame) < manifest.windows["long"]:
                continue

            t = len(frame) - 1
            row = frame.iloc[t]
            valid_feature_map[symbol] = frame

            x_short = frame.iloc[t - manifest.windows["short"] + 1 : t + 1][manifest.short_features].to_numpy(np.float32)
            x_mid = frame.iloc[t - manifest.windows["mid"] + 1 : t + 1][manifest.mid_features].to_numpy(np.float32)
            x_long = frame.iloc[t - manifest.windows["long"] + 1 : t + 1][manifest.long_features].to_numpy(np.float32)
            x_context = row[manifest.context_features].to_numpy(np.float32)
            x_sentiment = np.array([row.get(feature, 0.0) for feature in manifest.sentiment_features], dtype=np.float32)

            prepared.append(
                PreparedSymbol(
                    symbol=symbol,
                    feature_row=row,
                    x_short=self.runtime.scalers.transform_window(x_short, self.runtime.scalers.scaler_short),
                    x_mid=self.runtime.scalers.transform_window(x_mid, self.runtime.scalers.scaler_mid),
                    x_long=self.runtime.scalers.transform_window(x_long, self.runtime.scalers.scaler_long),
                    x_context=self.runtime.scalers.transform_vector(x_context, self.runtime.scalers.scaler_context),
                    x_sentiment=self.runtime.scalers.transform_vector(x_sentiment, self.runtime.scalers.scaler_sentiment),
                )
            )

        if not prepared:
            raise DataUnavailableError("No symbols had enough feature history for inference")
        return prepared, valid_feature_map

    def predict(self, feature_map: dict[str, pd.DataFrame]) -> tuple[dict[str, list[dict]], dict[str, pd.DataFrame]]:
        prepared, valid_feature_map = self.prepare_features(feature_map)

        batch_short = torch.tensor(np.stack([item.x_short for item in prepared]), dtype=torch.float32, device=self.runtime.device)
        batch_mid = torch.tensor(np.stack([item.x_mid for item in prepared]), dtype=torch.float32, device=self.runtime.device)
        batch_long = torch.tensor(np.stack([item.x_long for item in prepared]), dtype=torch.float32, device=self.runtime.device)
        batch_context = torch.tensor(
            np.stack([item.x_context for item in prepared]), dtype=torch.float32, device=self.runtime.device
        )
        batch_sentiment = torch.tensor(
            np.stack([item.x_sentiment for item in prepared]), dtype=torch.float32, device=self.runtime.device
        )
        batch_idx = torch.tensor(
            [self.runtime.symbol_registry.index_for(item.symbol) for item in prepared],
            dtype=torch.long,
            device=self.runtime.device,
        )

        with torch.no_grad():
            outputs = self.runtime.model(
                batch_short,
                batch_mid,
                batch_long,
                batch_context,
                batch_sentiment,
                batch_idx,
            )

        direction_logits, magnitude_pred, confidence, _, _, level_pred, _ = outputs
        prob = torch.sigmoid(direction_logits).cpu().numpy()
        mag = magnitude_pred.cpu().numpy()
        conf = confidence.cpu().numpy()

        if self.runtime.calibrator is not None:
            mag, prob = self.runtime.calibrator.calibrate(mag, prob)

        predictions: dict[str, list[dict]] = {}
        for row_idx, item in enumerate(prepared):
            close = float(item.feature_row["Close"])
            vol_ref = float(item.feature_row.get("vol_ref", 0.015))
            atr = float(item.feature_row.get("atr_14", close * 0.02))
            per_symbol: list[dict] = []

            for horizon_idx, horizon in enumerate(self.runtime.manifest.horizons):
                p_up = float(prob[row_idx, horizon_idx])
                raw_mag = float(mag[row_idx, horizon_idx])
                confidence_pct = float(conf[row_idx, horizon_idx]) * 100.0
                abs_dlog = abs(raw_mag) * vol_ref
                expected_return = math.exp(abs_dlog) - 1.0
                signed_return = expected_return if p_up >= 0.5 else -expected_return
                direction = "long" if p_up >= 0.5 else "short"
                stop_loss = close - (1.5 * atr) if direction == "long" else close + (1.5 * atr)
                support = close * math.exp(float(level_pred[row_idx, horizon_idx, 1].item()) * vol_ref)
                resistance = close * math.exp(float(level_pred[row_idx, horizon_idx, 0].item()) * vol_ref)
                risk = abs(close - stop_loss)
                reward = abs(signed_return) * close
                risk_reward_ratio = reward / risk if risk > 0 else 0.0

                per_symbol.append(
                    {
                        "ticker": item.symbol,
                        "company_name": item.symbol.replace(".NS", "").replace(".BO", ""),
                        "source": "ml",
                        "direction": direction,
                        "confidence_pct": round(confidence_pct, 2),
                        "certainty_pct": round(abs(p_up - 0.5) * 200.0, 2),
                        "current_price": close,
                        "entry_price": close,
                        "target_price": close * (1.0 + signed_return),
                        "stop_loss": stop_loss,
                        "expected_return_pct": signed_return * 100.0,
                        "risk_reward_ratio": risk_reward_ratio,
                        "horizon": f"H{horizon}",
                        "sector": SYMBOL_SECTORS.get(item.symbol),
                        "support": support,
                        "resistance": resistance,
                        "secondary": {
                            "p_up": p_up,
                            "p_down": 1.0 - p_up,
                            "raw_magnitude": raw_mag,
                            "vol_ref": vol_ref,
                            "indicators": {
                                "rsi": float(item.feature_row.get("rsi_14", np.nan)),
                                "macd_hist": float(item.feature_row.get("macd_hist", np.nan)),
                                "bb_zscore": float(item.feature_row.get("bb_zscore", np.nan)),
                                "adx": float(item.feature_row.get("adx", np.nan)),
                                "volume_ratio": float(item.feature_row.get("relative_volume_10d", np.nan)),
                                "stochastic": float(item.feature_row.get("stoch_k", np.nan)),
                            },
                        },
                    }
                )

            predictions[item.symbol] = per_symbol

        return predictions, valid_feature_map
