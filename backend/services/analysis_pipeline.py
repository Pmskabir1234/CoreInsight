"""Robust staged analysis pipeline for /analyze endpoint."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

from backend.services.anomaly_service import AnomalyService
from backend.services.decision_engine import generate_decision_report
from backend.services.diagnostics_service import compute_parameter_diagnostics
from backend.services.explainability_engine import ExplainabilityEngine
from backend.services.history_service import HistoryService
from backend.services.prediction_service import PredictionService
from backend.services.trend_analysis import analyze_trends
from backend.services.visualization_service import VisualizationService
from backend.storage.history_store import HistoryStore

logger = logging.getLogger(__name__)


class AnalysisPipeline:
    def __init__(
        self,
        anomaly_service: AnomalyService,
        prediction_service: PredictionService,
        explainability_engine: ExplainabilityEngine,
        visualization_service: VisualizationService,
        history_service: HistoryService,
        store: HistoryStore,
    ) -> None:
        self.anomaly_service = anomaly_service
        self.prediction_service = prediction_service
        self.explainability_engine = explainability_engine
        self.visualization_service = visualization_service
        self.history_service = history_service
        self.store = store

    def validate_input(self, values: Dict[str, float]) -> Dict[str, float]:
        # Pydantic already validates request shape/ranges; this ensures numeric coercion safety.
        return {k: float(v) for k, v in values.items()}

    def preprocess_input(self, values: Dict[str, float]) -> Dict[str, float]:
        return {k: round(v, 4) for k, v in values.items()}

    def build_final_response(
        self,
        machine_id: str,
        now: str,
        values: Dict[str, float],
        anomaly_score: float,
        anomaly_label: str,
        anomaly_severity: str,
        failure_pct: float,
        decision: Dict,
        feature_importance: List[dict],
        diagnostics_rows: List[dict],
        trends: List[dict],
        report: str,
        explainability: Dict,
        visualizations: List[dict],
        historical_comparison: List[dict],
        key_observations: List[str],
        root_cause_analysis: List[str],
        comparison_note: Optional[str],
    ) -> Dict:
        risk = decision["risk_category"]
        structured = {
            "system_summary": {
                "machine_id": machine_id,
                "decision_priority": decision["decision_priority"],
                "urgency": decision["urgency"],
                "health_score": decision["health_score"],
            },
            "key_observations": key_observations,
            "trend_analysis": trends,
            "root_cause_analysis": root_cause_analysis,
            "recommended_actions": decision.get("recommended_actions", []),
            "risk_assessment": {
                "risk_category": risk,
                "anomaly_score": anomaly_score,
                "failure_probability_percent": failure_pct,
                "severity_score": decision["severity_score"],
            },
            "parameter_diagnostics": diagnostics_rows,
            "visualizations": visualizations,
            "ml_outputs": {
                "anomaly_score": anomaly_score,
                "anomaly_label": anomaly_label,
                "anomaly_severity": anomaly_severity,
                "feature_importance": feature_importance,
            },
            "explainability": explainability,
            "historical_comparison": historical_comparison,
        }
        return {
            "machine_id": machine_id,
            "timestamp": now,
            "anomaly_score": anomaly_score,
            "anomaly_label": anomaly_label,
            "anomaly_severity": anomaly_severity,
            "failure_probability_percent": failure_pct,
            "risk_category": risk,
            "decision_priority": decision["decision_priority"],
            "health_score": decision["health_score"],
            "feature_importance": feature_importance,
            "parameter_diagnostics": diagnostics_rows,
            "trend_insights": [
                {"metric": t["metric"], "trend": t["trend"], "detail": t["detail"]}
                for t in trends
            ],
            "comparison_note": comparison_note,
            "engineering_report": report,
            "structured_analysis": structured,
        }

    def run(self, machine_id: str, raw_values: Dict[str, float]) -> Dict:
        started = time.perf_counter()
        now = datetime.now(timezone.utc).isoformat()
        try:
            values = self.validate_input(raw_values)
            values = self.preprocess_input(values)
            anomaly_score, anomaly_label, anomaly_severity = self.anomaly_service.run_anomaly_detection(values)
            failure_pct, _, feature_importance = self.prediction_service.run_failure_prediction(values)
            prev = self.store.last_parameters(machine_id)
            try:
                diagnostics_rows = compute_parameter_diagnostics(values, previous_values=prev)
            except Exception as exc:
                logger.exception("diagnostics_stage_failed machine_id=%s error=%s", machine_id, exc)
                diagnostics_rows = []
            try:
                history_rows = self.store.list_history(machine_id=machine_id, limit=20)
            except Exception as exc:
                logger.exception("history_stage_failed machine_id=%s error=%s", machine_id, exc)
                history_rows = []
            try:
                trends = analyze_trends(history_rows, values)
            except Exception as exc:
                logger.exception("trend_stage_failed machine_id=%s error=%s", machine_id, exc)
                trends = []
            try:
                historical_comparison = self.history_service.build_historical_comparison(history_rows, values)
            except Exception as exc:
                logger.exception("historical_comparison_failed machine_id=%s error=%s", machine_id, exc)
                historical_comparison = []
            try:
                decision, actions = generate_decision_report(
                    anomaly_score=anomaly_score,
                    failure_probability_percent=failure_pct,
                    diagnostics_rows=diagnostics_rows,
                    trend_rows=trends,
                )
            except Exception as exc:
                logger.exception("decision_stage_failed machine_id=%s error=%s", machine_id, exc)
                decision = {
                    "risk_category": "Low",
                    "decision_priority": "MONITOR",
                    "urgency": "Moderate",
                    "severity_score": 0.0,
                    "health_score": 50.0,
                }
                actions = ["Validate sensor readings and re-run analysis."]
            decision["recommended_actions"] = actions

            comparison_note = None
            if prev and prev.get("vibration_rms"):
                delta = ((values["vibration_rms"] - prev["vibration_rms"]) / max(prev["vibration_rms"], 1e-6)) * 100
                comparison_note = f"Current vibration is {delta:.1f}% compared to previous analysis."

            try:
                report, explainability, key_observations, root_cause_analysis = self.explainability_engine.generate(
                    values=values,
                    diagnostics_rows=diagnostics_rows,
                    trend_rows=trends,
                    feature_importance=feature_importance,
                    anomaly_score=anomaly_score,
                    failure_probability_percent=failure_pct,
                    historical_comparison=historical_comparison,
                )
            except Exception as exc:
                logger.exception("explainability_stage_failed machine_id=%s error=%s", machine_id, exc)
                report = "Explainability service unavailable; using minimal fallback."
                explainability = {"mode": "minimal_fallback", "root_cause_analysis": []}
                key_observations = ["Local explainability stage failed; fallback mode active."]
                root_cause_analysis = []
            try:
                visualizations = self.visualization_service.generate_visualizations(values)
            except Exception as exc:
                logger.exception("visualization_stage_failed machine_id=%s error=%s", machine_id, exc)
                visualizations = []
            final_response = self.build_final_response(
                machine_id=machine_id,
                now=now,
                values=values,
                anomaly_score=anomaly_score,
                anomaly_label=anomaly_label,
                anomaly_severity=anomaly_severity,
                failure_pct=failure_pct,
                decision=decision,
                feature_importance=feature_importance,
                diagnostics_rows=diagnostics_rows,
                trends=trends,
                report=report,
                explainability=explainability,
                visualizations=visualizations,
                historical_comparison=historical_comparison,
                key_observations=key_observations,
                root_cause_analysis=root_cause_analysis,
                comparison_note=comparison_note,
            )
            try:
                payload_to_store = {**final_response, "input_parameters": values}
                self.store.save_analysis(machine_id, now, payload_to_store)
            except Exception as exc:
                logger.exception("history_save_failed machine_id=%s error=%s", machine_id, exc)
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            logger.info("analyze_success machine_id=%s elapsed_ms=%s", machine_id, elapsed_ms)
            return final_response
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            logger.exception("analyze_failed machine_id=%s elapsed_ms=%s error=%s", machine_id, elapsed_ms, exc)
            return {
                "machine_id": machine_id,
                "timestamp": now,
                "anomaly_score": 0.0,
                "anomaly_label": "Normal",
                "anomaly_severity": "Low",
                "failure_probability_percent": 0.0,
                "risk_category": "Low",
                "decision_priority": "MONITOR",
                "health_score": 50.0,
                "feature_importance": [],
                "parameter_diagnostics": [],
                "trend_insights": [],
                "comparison_note": "Analysis failed; returned fallback response.",
                "engineering_report": "Unable to complete full analysis. Verify sensor payload and retry.",
                "structured_analysis": {
                    "system_summary": {"machine_id": machine_id, "status": "degraded"},
                    "key_observations": ["Analysis pipeline encountered an internal failure."],
                    "trend_analysis": [],
                    "root_cause_analysis": [],
                    "recommended_actions": ["Validate sensor payload and retry analysis."],
                    "risk_assessment": {},
                    "parameter_diagnostics": [],
                    "ml_outputs": {},
                    "visualizations": [],
                    "explainability": {},
                    "historical_comparison": [],
                },
            }
