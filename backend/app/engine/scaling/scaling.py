from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np
from sklearn.preprocessing import StandardScaler


class ScalerGroup:
    def __init__(self) -> None:
        self.scaler_short = StandardScaler()
        self.scaler_mid = StandardScaler()
        self.scaler_long = StandardScaler()
        self.scaler_context = StandardScaler()
        self.scaler_sentiment = StandardScaler()
        self.fitted = False

    @staticmethod
    def load(path: Path) -> "ScalerGroup":
        with Path(path).open("rb") as handle:
            data = pickle.load(handle)

        scaler_group = ScalerGroup()
        scaler_group.scaler_short = data["scaler_short"]
        scaler_group.scaler_mid = data["scaler_mid"]
        scaler_group.scaler_long = data["scaler_long"]
        scaler_group.scaler_context = data["scaler_context"]
        scaler_group.scaler_sentiment = data.get("scaler_sentiment", StandardScaler())
        scaler_group.fitted = data.get("fitted", True)
        return scaler_group

    def transform_window(self, values: np.ndarray, scaler: StandardScaler) -> np.ndarray:
        shape = values.shape
        return scaler.transform(values.reshape(-1, shape[-1])).reshape(shape).astype(np.float32)

    def transform_vector(self, values: np.ndarray, scaler: StandardScaler) -> np.ndarray:
        return scaler.transform(values.reshape(1, -1))[0].astype(np.float32)
