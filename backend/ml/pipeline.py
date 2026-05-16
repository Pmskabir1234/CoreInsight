"""ML pipelines for anomaly detection and failure prediction."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from backend.ml.constants import FEATURES
# from backend.ml.ml_flow import ensure_trained, load_best_failure_model

from backend.ml.ml_flow import ensure_trained, load_best_failure_model


# FEATURES: List[str] = [
#     "vibration_rms",
#     "rpm",
#     "torque_nm",
#     "bearing_temp_c",
#     "ambient_temp_c",
#     "motor_current_a",
#     "voltage_v",
#     "flow_rate_l_min",
#     "pressure_bar",
#     "humidity_percent",
# ]


@dataclass
class MLPipeline:
    anomaly_model: IsolationForest
    failure_model: Any
    model_metadata: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def bootstrap(cls, seed: int = 42) -> "MLPipeline":
        """Train anomaly model and load best failure model from ml_flow."""
        from backend.ml.ml_flow import generate_dataset

        metadata = ensure_trained(seed=seed)
        data, y = generate_dataset(seed=seed, n=1500)

        anomaly = IsolationForest(
            contamination=0.08, random_state=seed, n_estimators=200
        ).fit(data[FEATURES])

        failure, loaded_meta = load_best_failure_model()
        if failure is None:
            failure = RandomForestClassifier(
                n_estimators=300, random_state=seed, class_weight="balanced"
            ).fit(data[FEATURES], y)
            metadata = {"best_model": "RandomForest", "best_accuracy": None}

        merged_meta = {**loaded_meta, **metadata} if loaded_meta else metadata
        return cls(anomaly_model=anomaly, failure_model=failure, model_metadata=merged_meta)

    def _estimator(self) -> Any:
        """Return underlying sklearn estimator when wrapped in Pipeline."""
        model = self.failure_model
        if hasattr(model, "named_steps") and "model" in model.named_steps:
            return model.named_steps["model"]
        return model

    def _feature_importance_vector(self) -> np.ndarray:
        estimator = self._estimator()
        if hasattr(estimator, "feature_importances_"):
            return np.array(estimator.feature_importances_, dtype=float)
        if hasattr(estimator, "coef_"):
            coef = estimator.coef_
            return np.abs(coef[0] if coef.ndim > 1 else coef)
        return np.ones(len(FEATURES), dtype=float) / len(FEATURES)

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
        importances = self._feature_importance_vector()
        ranked = sorted(
            [
                {"feature": f, "importance_percent": round(v * 100, 2)}
                for f, v in zip(FEATURES, importances)
            ],
            key=lambda x: x["importance_percent"],
            reverse=True,
        )
        return pct, category, ranked
