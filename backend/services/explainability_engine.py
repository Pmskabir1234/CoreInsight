"""Deterministic local explainability engine for engineering analysis."""

from __future__ import annotations

from typing import Dict, List, Tuple


class ExplainabilityEngine:
    def _rank_contributors(self, diagnostics_rows: List[dict], feature_importance: List[dict]) -> List[dict]:
        dev_by_param = {
            row["parameter"]: float(row.get("deviation_percent", 0.0))
            for row in diagnostics_rows
        }
        ranked: List[dict] = []
        for fi in feature_importance:
            parameter = fi["feature"]
            importance = float(fi.get("importance_percent", 0.0))
            deviation = dev_by_param.get(parameter, 0.0)
            combined = 0.65 * importance + 0.35 * min(deviation * 2.0, 100.0)
            ranked.append(
                {
                    "parameter": parameter,
                    "importance_percent": round(importance, 2),
                    "deviation_percent": round(deviation, 2),
                    "contribution_score": round(combined, 2),
                }
            )
        ranked.sort(key=lambda x: x["contribution_score"], reverse=True)
        return ranked

    def generate(
        self,
        values: Dict[str, float],
        diagnostics_rows: List[dict],
        trend_rows: List[dict],
        feature_importance: List[dict],
        anomaly_score: float,
        failure_probability_percent: float,
        historical_comparison: List[dict],
    ) -> Tuple[str, dict, List[str], List[str]]:
        ranked = self._rank_contributors(diagnostics_rows, feature_importance)
        top = ranked[:3]

        key_observations: List[str] = []
        root_causes: List[str] = []

        if top:
            first = top[0]
            key_observations.append(
                f"Highest risk driver is {first['parameter']} (contribution {first['contribution_score']:.1f})."
            )

        if failure_probability_percent >= 70 or anomaly_score >= 0.72:
            key_observations.append("Combined ML signals indicate immediate reliability risk escalation.")
        elif failure_probability_percent >= 45 or anomaly_score >= 0.52:
            key_observations.append("ML outputs indicate elevated risk that requires near-term maintenance action.")
        else:
            key_observations.append("ML outputs remain in low-to-moderate range with no immediate critical trigger.")

        trend_map = {t["metric"]: t for t in trend_rows}
        for metric in ["bearing_temp_c", "vibration_rms", "motor_current_a"]:
            t = trend_map.get(metric)
            if not t:
                continue
            if t["trend"] == "Rising":
                root_causes.append(f"{metric} shows rising trend, suggesting progressive stress accumulation.")
            elif t["trend"] == "Volatile":
                root_causes.append(f"{metric} is volatile, indicating unstable operating conditions.")

        for row in diagnostics_rows:
            if row.get("status") == "Critical":
                root_causes.append(
                    f"{row['parameter']} exceeds safe range by {row['deviation_percent']:.1f}%, indicating "
                    f"{row.get('insight', 'abnormal operating stress').lower()}"
                )

        if not root_causes:
            root_causes.append("No critical threshold breach identified; behavior aligns with nominal operation.")

        actions: List[str] = []
        if any(r.get("parameter") == "bearing_temp_c" and r.get("status") != "Normal" for r in diagnostics_rows):
            actions.append("Inspect bearing lubrication and friction surfaces during the next maintenance window.")
        if any(r.get("parameter") == "vibration_rms" and r.get("status") != "Normal" for r in diagnostics_rows):
            actions.append("Perform alignment and dynamic balance verification to reduce rotational instability.")
        if any(r.get("parameter") == "motor_current_a" and r.get("status") != "Normal" for r in diagnostics_rows):
            actions.append("Check motor load profile and verify electrical integrity under peak operating conditions.")
        if not actions:
            actions.append("Maintain current operating regime and continue periodic condition monitoring.")

        hist_notes = [item["detail"] for item in historical_comparison[:3]]
        if hist_notes:
            key_observations.extend(hist_notes)

        report = (
            "Engineering Decision Report\n\n"
            f"- Failure probability: {failure_probability_percent:.2f}%\n"
            f"- Anomaly score: {anomaly_score:.3f}\n"
            + "\n".join([f"- {x}" for x in key_observations[:4]])
            + "\n\nRoot Cause Analysis\n"
            + "\n".join([f"- {x}" for x in root_causes[:5]])
            + "\n\nRecommended Actions\n"
            + "\n".join([f"- {x}" for x in actions[:4]])
        )

        explainability = {
            "mode": "deterministic_local",
            "contributors": top,
            "root_cause_analysis": root_causes,
            "dynamic_observations": key_observations,
        }
        return report, explainability, key_observations, root_causes
