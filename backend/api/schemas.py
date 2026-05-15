"""Pydantic schemas used by API endpoints."""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class MachineParameters(BaseModel):
    """Industrial machine sensor parameters."""

    vibration_rms: float = Field(..., ge=0.0, le=50.0, description="mm/s RMS")
    rpm: float = Field(..., ge=100.0, le=10000.0)
    torque_nm: float = Field(..., ge=0.0, le=5000.0)
    bearing_temp_c: float = Field(..., ge=-20.0, le=220.0)
    ambient_temp_c: float = Field(..., ge=-30.0, le=80.0)
    motor_current_a: float = Field(..., ge=0.0, le=500.0)
    voltage_v: float = Field(..., ge=100.0, le=1000.0)
    flow_rate_l_min: float = Field(..., ge=0.0, le=3000.0)
    pressure_bar: float = Field(..., ge=0.0, le=100.0)
    humidity_percent: float = Field(..., ge=0.0, le=100.0)


class AnalyzeRequest(BaseModel):
    machine_id: str = Field(..., min_length=2, max_length=100)
    parameters: MachineParameters


class ParameterDiagnostic(BaseModel):
    parameter: str
    actual_value: float
    safe_min: float
    safe_max: float
    deviation_percent: float
    status: Literal["Normal", "Warning", "Critical"]
    explanation: str


class TrendInsight(BaseModel):
    metric: str
    trend: Literal["Stable", "Rising", "Falling", "Volatile"]
    detail: str


class AnalyzeResponse(BaseModel):
    machine_id: str
    timestamp: str
    anomaly_score: float
    anomaly_label: Literal["Normal", "Anomaly"]
    anomaly_severity: Literal["Low", "Medium", "High"]
    failure_probability_percent: float
    risk_category: Literal["Low", "Medium", "High", "Critical"]
    decision_priority: Literal["SAFE", "MONITOR", "ATTENTION REQUIRED", "CRITICAL ACTION"]
    health_score: float
    feature_importance: List[dict]
    parameter_diagnostics: List[ParameterDiagnostic]
    trend_insights: List[TrendInsight]
    comparison_note: Optional[str] = None
    engineering_report: str
    structured_analysis: dict = Field(default_factory=dict)


class PredictResponse(BaseModel):
    failure_probability_percent: float
    risk_category: str
    feature_importance: List[dict]


class SimulateRequest(BaseModel):
    machine_id: str
    base_parameters: MachineParameters
    overrides: MachineParameters


class SimulateResponse(BaseModel):
    scenario: str
    base_failure_probability_percent: float
    simulated_failure_probability_percent: float
    base_risk: str
    simulated_risk: str
    impact_summary: str


class ChatRequest(BaseModel):
    machine_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
