"""Failure prediction service abstraction."""

from __future__ import annotations

import logging
from typing import Dict, List, Tuple

from backend.ml.pipeline import MLPipeline

logger = logging.getLogger(__name__)


class PredictionService:
    def __init__(self, ml: MLPipeline) -> None:
        self.ml = ml

    def run_failure_prediction(self, values: Dict[str, float]) -> Tuple[float, str, List[dict]]:
        try:
            return self.ml.predict_failure(values)
        except Exception as exc:
            logger.exception("failure_prediction_failed error=%s", exc)
            return 0.0, "Low", []
