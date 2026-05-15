"""ML pipelines for anomaly detection and failure prediction."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier


FEATURES: List[str] = [
    "vibration_rms",
    "rpm",
    "torque_nm",
    "bearing_temp_c",
    "ambient_temp_c",
    "motor_current_a",
    "voltage_v",
    "flow_rate_l_min",
    "pressure_bar",
    "humidity_percent",
]


@dataclass
class MLPipeline:
    anomaly_model: IsolationForest
    failure_model: RandomForestClassifier

    @classmethod
    def bootstrap(cls, seed: int = 42) -> "MLPipeline":
        """Create synthetic data and train both models."""
        rng = np.random.default_rng(seed)
        n = 1500
        data = pd.DataFrame(
            {
                "vibration_rms": rng.normal(4.5, 1.8, n).clip(0.2, 20),
                "rpm": rng.normal(2900, 420, n).clip(600, 5000),
                "torque_nm": rng.normal(180, 45, n).clip(20, 600),
                "bearing_temp_c": rng.normal(72, 14, n).clip(20, 180),
                "ambient_temp_c": rng.normal(30, 6, n).clip(10, 55),
                "motor_current_a": rng.normal(60, 15, n).clip(5, 200),
                "voltage_v": rng.normal(415, 20, n).clip(300, 500),
                "flow_rate_l_min": rng.normal(460, 90, n).clip(100, 900),
                "pressure_bar": rng.normal(6.5, 1.4, n).clip(1, 20),
                "humidity_percent": rng.normal(52, 14, n).clip(15, 95),
            }
        )
        risk_score = (
            0.30 * (data["bearing_temp_c"] / 120)
            + 0.22 * (data["vibration_rms"] / 12)
            + 0.15 * (data["motor_current_a"] / 120)
            + 0.10 * (data["pressure_bar"] / 12)
            + 0.08 * (data["torque_nm"] / 300)
            + 0.05 * np.maximum((data["rpm"] - 3500) / 2500, 0)
        )
        noise = rng.normal(0, 0.06, n)
        y = ((risk_score + noise) > 0.48).astype(int)

        anomaly = IsolationForest(
            contamination=0.08, random_state=seed, n_estimators=200
        ).fit(data[FEATURES])
        failure = RandomForestClassifier(
            n_estimators=300, random_state=seed, class_weight="balanced"
        ).fit(data[FEATURES], y)
        return cls(anomaly_model=anomaly, failure_model=failure)

    def _to_vector(self, values: Dict[str, float]) -> np.ndarray:
        return np.array([[values[f] for f in FEATURES]], dtype=float)

    def detect_anomaly(self, values: Dict[str, float]) -> Tuple[float, str, str]:
        x = self._to_vector(values)
        score = float(-self.anomaly_model.score_samples(x)[0])
        pred = int(self.anomaly_model.predict(x)[0])
        label = "Anomaly" if pred == -1 else "Normal"
        severity = "Low" if score < 0.52 else "Medium" if score < 0.72 else "High"
        return round(score, 4), label, severity

    def predict_failure(self, values: Dict[str, float]) -> Tuple[float, str, List[dict]]:
        x = self._to_vector(values)
        prob = float(self.failure_model.predict_proba(x)[0][1])
        pct = round(prob * 100, 2)
        category = (
            "Low"
            if pct < 20
            else "Medium"
            if pct < 45
            else "High"
            if pct < 70
            else "Critical"
        )
        importances = self.failure_model.feature_importances_
        ranked = sorted(
            [
                {"feature": f, "importance_percent": round(v * 100, 2)}
                for f, v in zip(FEATURES, importances)
            ],
            key=lambda x: x["importance_percent"],
            reverse=True,
        )
        return pct, category, ranked
