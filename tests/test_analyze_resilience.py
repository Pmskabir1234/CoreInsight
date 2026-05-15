from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.main import create_app


def valid_payload():
    return {
        "machine_id": "M-100",
        "parameters": {
            "vibration_rms": 4.8,
            "rpm": 2900.0,
            "torque_nm": 175.0,
            "bearing_temp_c": 78.0,
            "ambient_temp_c": 32.0,
            "motor_current_a": 58.0,
            "voltage_v": 415.0,
            "flow_rate_l_min": 470.0,
            "pressure_bar": 6.2,
            "humidity_percent": 54.0,
        },
    }


def test_invalid_input_missing_parameter():
    app = create_app()
    client = TestClient(app)
    payload = valid_payload()
    del payload["parameters"]["rpm"]
    response = client.post("/analyze", json=payload)
    assert response.status_code == 422


def test_local_explainability_failure_still_returns_response():
    app = create_app()
    client = TestClient(app)
    with patch("backend.services.explainability_engine.ExplainabilityEngine.generate", side_effect=RuntimeError("fail")):
        response = client.post("/analyze", json=valid_payload())
    assert response.status_code == 200
    body = response.json()
    assert "structured_analysis" in body
    assert "explainability" in body["structured_analysis"]


def test_visualization_failure_does_not_crash():
    app = create_app()
    client = TestClient(app)
    with patch(
        "backend.services.visualization_service.VisualizationService.generate_visualizations",
        side_effect=RuntimeError("plot fail"),
    ):
        response = client.post("/analyze", json=valid_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["structured_analysis"]["visualizations"] == []


def test_extreme_but_valid_values():
    app = create_app()
    client = TestClient(app)
    payload = valid_payload()
    payload["parameters"]["bearing_temp_c"] = 220.0
    payload["parameters"]["vibration_rms"] = 50.0
    payload["parameters"]["motor_current_a"] = 500.0
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["risk_category"] in {"Low", "Medium", "High", "Critical"}
