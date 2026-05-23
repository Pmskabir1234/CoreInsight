import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Thermometer, Zap, Gauge, ChevronDown, RotateCcw } from 'lucide-react'

const DEFAULT_PARAMS = {
  vibration_rms: 4.8,
  rpm: 2900,
  torque_nm: 175,
  bearing_temp_c: 78,
  ambient_temp_c: 32,
  motor_current_a: 58,
  voltage_v: 415,
  flow_rate_l_min: 470,
  pressure_bar: 6.2,
  humidity_percent: 54,
}

const PARAM_GROUPS = [
  {
    label: 'Mechanical',
    icon: Cpu,
    accent: '#22d3ee',
    fields: [
      { key: 'vibration_rms',  label: 'Vibration RMS', unit: 'mm/s', min: 0,    max: 50,    step: 0.1 },
      { key: 'rpm',            label: 'RPM',            unit: 'rpm',  min: 100,  max: 10000, step: 10  },
      { key: 'torque_nm',      label: 'Torque',         unit: 'Nm',   min: 0,    max: 5000,  step: 1   },
    ],
  },
  {
    label: 'Thermal',
    icon: Thermometer,
    accent: '#fb923c',
    fields: [
      { key: 'bearing_temp_c', label: 'Bearing Temp', unit: '°C', min: -20, max: 220, step: 0.5 },
      { key: 'ambient_temp_c', label: 'Ambient Temp', unit: '°C', min: -30, max: 80,  step: 0.5 },
    ],
  },
  {
    label: 'Electrical',
    icon: Zap,
    accent: '#fbbf24',
    fields: [
      { key: 'motor_current_a', label: 'Motor Current', unit: 'A', min: 0,   max: 500,  step: 0.5 },
      { key: 'voltage_v',       label: 'Voltage',       unit: 'V', min: 100, max: 1000, step: 1   },
    ],
  },
  {
    label: 'Process',
    icon: Gauge,
    accent: '#c084fc',
    fields: [
      { key: 'flow_rate_l_min',  label: 'Flow Rate', unit: 'L/min', min: 0, max: 3000, step: 1   },
      { key: 'pressure_bar',     label: 'Pressure',  unit: 'bar',   min: 0, max: 100,  step: 0.1 },
      { key: 'humidity_percent', label: 'Humidity',  unit: '%',     min: 0, max: 100,  step: 0.5 },
    ],
  },
]

function GroupSection({ group, params, onChange }) {
  const [open, setOpen] = useState(true)
  const Icon = group.icon

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${group.accent}15` }}
        >
          <Icon size={11} style={{ color: group.accent }} />
        </div>
        <span
          className="text-[11px] font-semibold tracking-wider uppercase flex-1"
          style={{ color: '#64748b' }}
        >
          {group.label}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} style={{ color: '#334155' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="fields"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-3 pb-3 pt-1 space-y-2.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              {group.fields.map((f) => (
                <div key={f.key}>
                  <label
                    className="label"
                    htmlFor={f.key}
                    style={{ color: '#334155' }}
                  >
                    {f.label}
                    <span className="ml-1 normal-case font-normal" style={{ color: '#1e293b' }}>
                      ({f.unit})
                    </span>
                  </label>
                  <input
                    id={f.key}
                    type="number"
                    className="input-field"
                    value={params[f.key]}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    onChange={(e) => onChange(f.key, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function InputPanel({ onParamsChange, machineId, onMachineIdChange }) {
  const [params, setParams] = useState(DEFAULT_PARAMS)

  function handleChange(key, value) {
    const next = { ...params, [key]: value }
    setParams(next)
    onParamsChange(next)
  }

  function handleReset() {
    setParams(DEFAULT_PARAMS)
    onParamsChange(DEFAULT_PARAMS)
  }

  return (
    <div className="space-y-3">
      {/* Machine ID */}
      <div>
        <label className="label" htmlFor="machine-id">Machine ID</label>
        <input
          id="machine-id"
          type="text"
          className="input-field font-mono"
          value={machineId}
          onChange={(e) => onMachineIdChange(e.target.value)}
          placeholder="e.g. MOTOR-LINE-07"
        />
      </div>

      <div className="divider" />

      {/* Parameter groups */}
      <div className="space-y-2">
        {PARAM_GROUPS.map((g) => (
          <GroupSection key={g.label} group={g} params={params} onChange={handleChange} />
        ))}
      </div>

      <button
        onClick={handleReset}
        className="btn-ghost w-full justify-center gap-1.5 text-[11px]"
        style={{ color: '#334155' }}
      >
        <RotateCcw size={11} />
        Reset to defaults
      </button>
    </div>
  )
}

export { DEFAULT_PARAMS }
