"""FastAPI routes for Innovexa backend."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    PredictResponse,
    SimulateRequest,
    SimulateResponse,
)
from backend.ml.pipeline import MLPipeline
from backend.services.analysis_pipeline import AnalysisPipeline
from backend.services.anomaly_service import AnomalyService
from backend.services.explainability_engine import ExplainabilityEngine
from backend.services.history_service import HistoryService
from backend.services.prediction_service import PredictionService
from backend.services.visualization_service import VisualizationService
from backend.storage.history_store import HistoryStore

logger = logging.getLogger(__name__)


def create_router(ml: MLPipeline, store: HistoryStore) -> APIRouter:
    router = APIRouter()
    pipeline = AnalysisPipeline(
        anomaly_service=AnomalyService(ml),
        prediction_service=PredictionService(ml),
        explainability_engine=ExplainabilityEngine(),
        visualization_service=VisualizationService(),
        history_service=HistoryService(),
        store=store,
    )

    @router.post("/predict", response_model=PredictResponse)
    def predict(payload: AnalyzeRequest) -> PredictResponse:
        try:
            values = payload.parameters.model_dump()
            failure_pct, risk, importance = ml.predict_failure(values)
            return PredictResponse(
                failure_probability_percent=failure_pct, risk_category=risk, feature_importance=importance
            )
        except Exception as exc:
            logger.exception("predict_failed machine_id=%s error=%s", payload.machine_id, exc)
            raise HTTPException(status_code=500, detail="Prediction failed.") from exc

    @router.post("/analyze", response_model=AnalyzeResponse)
    def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
        try:
            values = payload.parameters.model_dump()
            result = pipeline.run(machine_id=payload.machine_id, raw_values=values)
            return AnalyzeResponse(**result)
        except Exception as exc:
            logger.exception("analyze_failed machine_id=%s error=%s", payload.machine_id, exc)
            raise HTTPException(status_code=500, detail="Analysis failed.") from exc

    @router.post("/simulate", response_model=SimulateResponse)
    def simulate(payload: SimulateRequest) -> SimulateResponse:
        try:
            base = payload.base_parameters.model_dump()
            sim = payload.overrides.model_dump()
            base_pct, base_risk, _ = ml.predict_failure(base)
            sim_pct, sim_risk, _ = ml.predict_failure(sim)
            delta = sim_pct - base_pct
            direction = "increases" if delta >= 0 else "decreases"
            return SimulateResponse(
                scenario="What-if simulation executed on overridden parameters.",
                base_failure_probability_percent=base_pct,
                simulated_failure_probability_percent=sim_pct,
                base_risk=base_risk,
                simulated_risk=sim_risk,
                impact_summary=f"Failure probability {direction} by {abs(delta):.2f} percentage points.",
            )
        except Exception as exc:
            logger.exception("simulate_failed machine_id=%s error=%s", payload.machine_id, exc)
            raise HTTPException(status_code=500, detail="Simulation failed.") from exc

    @router.get("/history")
    def history(machine_id: str | None = Query(default=None), limit: int = Query(default=25, ge=1, le=200)):
        try:
            return {"items": store.list_history(machine_id=machine_id, limit=limit)}
        except Exception as exc:
            logger.exception("history_fetch_failed machine_id=%s error=%s", machine_id, exc)
            raise HTTPException(status_code=500, detail="History lookup failed.") from exc

    return router
