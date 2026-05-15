"""Anomaly detection service abstraction."""

from __future__ import annotations

import logging
from typing import Dict, Tuple

from backend.ml.pipeline import MLPipeline

logger = logging.getLogger(__name__)


class AnomalyService:
    def __init__(self, ml: MLPipeline) -> None:
        self.ml = ml

    def run_anomaly_detection(self, values: Dict[str, float]) -> Tuple[float, str, str]:
        try:
            return self.ml.detect_anomaly(values)
        except Exception as exc:
            logger.exception("anomaly_detection_failed error=%s", exc)
            return 0.0, "Normal", "Low"
