import { useState } from 'react'
import { Play, ArrowRight } from 'lucide-react'
import { Spinner } from './ui/Spinner'
import clsx from 'clsx'

const RISK_COLORS = {
  Low:      'text-emerald-600 dark:text-emerald-400',
  Medium:   'text-yellow-600 dark:text-yellow-400',
  High:     'text-orange-600 dark:text-orange-400',
  Critical: 'text-red-600 dark:text-red-400',
}

export function SimulationPanel({ params, machineId, onSimulate, loading, result }) {
  const [deltas, setDeltas] = useState({ bearing_temp_c: 15, vibration_rms: 2, motor_current_a: 10 })

  const sliders = [
    { key: 'bearing_temp_c',  label: 'Bearing Temp Delta', unit: '°C',   min: -30, max: 30 },
    { key: 'vibration_rms',   label: 'Vibration Delta',    unit: 'mm/s', min: -8,  max: 8 },
    { key: 'motor_current_a', label: 'Current Delta',      unit: 'A',    min: -50, max: 50 },
  ]

  function handleRun() {
    const overrides = { ...params }
    overrides.bearing_temp_c = Math.max(-20, Math.min(220, (params.bearing_temp_c || 0) + deltas.bearing_temp_c))
    overrides.vibration_rms  = Math.max(0,   Math.min(50,  (params.vibration_rms  || 0) + deltas.vibration_rms))
    overrides.motor_current_a = Math.max(0,  Math.min(500, (params.motor_current_a || 0) + deltas.motor_current_a))
    onSimulate({ machine_id: machineId, base_parameters: params, overrides })
  }

  const delta = result
    ? result.simulated_failure_probability_percent - result.base_failure_probability_percent
    : null

  return (
    <div className="card p-4 space-y-4">
      <h3 className="section-title flex items-center gap-2">
        <Play size={14} /> What-if Simulation
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sliders.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{s.label}</label>
              <span className="text-xs font-mono text-brand-500">
                {deltas[s.key] >= 0 ? '+' : ''}{deltas[s.key]} {s.unit}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={1}
              value={deltas[s.key]}
              onChange={(e) => setDeltas((d) => ({ ...d, [s.key]: parseFloat(e.target.value) }))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>{s.min}</span>
              <span>{s.max}</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleRun} disabled={loading} className="btn-primary">
        {loading ? <Spinner size="sm" /> : <Play size={14} />}
        Run Simulation
      </button>

      {result && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Base:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {result.base_failure_probability_percent?.toFixed(2)}%
              </span>
              <span className={clsx('badge', RISK_COLORS[result.base_risk])}>
                {result.base_risk}
              </span>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Simulated:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {result.simulated_failure_probability_percent?.toFixed(2)}%
              </span>
              <span className={clsx('badge', RISK_COLORS[result.simulated_risk])}>
                {result.simulated_risk}
              </span>
            </div>
          </div>

          {delta !== null && (
            <div className={clsx(
              'text-sm font-medium',
              delta > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            )}>
              {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)} percentage point {delta > 0 ? 'increase' : 'decrease'} in failure risk
            </div>
          )}

          <p className="text-sm text-slate-600 dark:text-slate-300">{result.impact_summary}</p>
        </div>
      )}
    </div>
  )
}
