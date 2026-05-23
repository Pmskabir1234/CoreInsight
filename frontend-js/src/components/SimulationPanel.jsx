import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowRight, FlaskConical } from 'lucide-react'
import { Spinner } from './ui/Spinner'
import clsx from 'clsx'

const RISK_CFG = {
  Low:      { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)'  },
  Medium:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  High:     { color: '#fb923c', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)'  },
  Critical: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
}

function RiskBadge({ risk }) {
  const cfg = RISK_CFG[risk] || RISK_CFG.Low
  return (
    <span
      className="badge"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {risk}
    </span>
  )
}

export function SimulationPanel({ params, machineId, onSimulate, loading, result }) {
  const [deltas, setDeltas] = useState({ bearing_temp_c: 15, vibration_rms: 2, motor_current_a: 10 })

  const sliders = [
    { key: 'bearing_temp_c',  label: 'Bearing Temp Δ', unit: '°C',   min: -30, max: 30,  accent: '#fb923c' },
    { key: 'vibration_rms',   label: 'Vibration Δ',    unit: 'mm/s', min: -8,  max: 8,   accent: '#22d3ee' },
    { key: 'motor_current_a', label: 'Current Δ',      unit: 'A',    min: -50, max: 50,  accent: '#fbbf24' },
  ]

  function handleRun() {
    const overrides = { ...params }
    overrides.bearing_temp_c  = Math.max(-20,  Math.min(220, (params.bearing_temp_c  || 0) + deltas.bearing_temp_c))
    overrides.vibration_rms   = Math.max(0,    Math.min(50,  (params.vibration_rms   || 0) + deltas.vibration_rms))
    overrides.motor_current_a = Math.max(0,    Math.min(500, (params.motor_current_a || 0) + deltas.motor_current_a))
    onSimulate({ machine_id: machineId, base_parameters: params, overrides })
  }

  const delta = result
    ? result.simulated_failure_probability_percent - result.base_failure_probability_percent
    : null

  return (
    <motion.div
      className="card-elevated p-6 space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}
        >
          <FlaskConical size={15} style={{ color: '#22d3ee' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>What-if Simulation</h3>
          <p className="text-[11px]" style={{ color: '#475569' }}>
            Adjust parameters to model failure scenarios
          </p>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {sliders.map((s) => {
          const pct = ((deltas[s.key] - s.min) / (s.max - s.min)) * 100
          return (
            <div key={s.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label" style={{ color: '#334155' }}>{s.label}</label>
                <span
                  className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                  style={{ background: `${s.accent}15`, color: s.accent }}
                >
                  {deltas[s.key] >= 0 ? '+' : ''}{deltas[s.key]} {s.unit}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={1}
                  value={deltas[s.key]}
                  onChange={(e) => setDeltas((d) => ({ ...d, [s.key]: parseFloat(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: s.accent }}
                />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: '#1e293b' }}>
                <span>{s.min}</span>
                <span>0</span>
                <span>{s.max}</span>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={handleRun} disabled={loading} className="btn-primary">
        {loading ? <Spinner size="sm" /> : <Play size={13} />}
        Run Simulation
      </button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl p-4 space-y-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Before → After */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: '#475569' }}>Base</span>
                <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                  {result.base_failure_probability_percent?.toFixed(2)}%
                </span>
                <RiskBadge risk={result.base_risk} />
              </div>

              <ArrowRight size={14} style={{ color: '#334155' }} />

              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: '#475569' }}>Simulated</span>
                <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                  {result.simulated_failure_probability_percent?.toFixed(2)}%
                </span>
                <RiskBadge risk={result.simulated_risk} />
              </div>
            </div>

            {/* Delta indicator */}
            {delta !== null && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: delta > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${delta > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: delta > 0 ? '#f87171' : '#34d399' }}
                >
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}pp
                </span>
                <span className="text-xs" style={{ color: '#475569' }}>
                  {delta > 0 ? 'increase' : 'decrease'} in failure risk
                </span>
              </div>
            )}

            <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
              {result.impact_summary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
