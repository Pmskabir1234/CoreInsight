import { useState } from 'react'
import { Cpu, Thermometer, Zap, Gauge, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

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
    color: 'text-blue-500',
    fields: [
      { key: 'vibration_rms',  label: 'Vibration RMS', unit: 'mm/s', min: 0,    max: 50,   step: 0.1 },
      { key: 'rpm',            label: 'RPM',            unit: 'rpm',  min: 100,  max: 10000, step: 10 },
      { key: 'torque_nm',      label: 'Torque',         unit: 'Nm',   min: 0,    max: 5000, step: 1 },
    ],
  },
  {
    label: 'Thermal',
    icon: Thermometer,
    color: 'text-orange-500',
    fields: [
      { key: 'bearing_temp_c', label: 'Bearing Temp',  unit: '°C', min: -20, max: 220, step: 0.5 },
      { key: 'ambient_temp_c', label: 'Ambient Temp',  unit: '°C', min: -30, max: 80,  step: 0.5 },
    ],
  },
  {
    label: 'Electrical',
    icon: Zap,
    color: 'text-yellow-500',
    fields: [
      { key: 'motor_current_a', label: 'Motor Current', unit: 'A',   min: 0,   max: 500,  step: 0.5 },
      { key: 'voltage_v',       label: 'Voltage',       unit: 'V',   min: 100, max: 1000, step: 1 },
    ],
  },
  {
    label: 'Process',
    icon: Gauge,
    color: 'text-purple-500',
    fields: [
      { key: 'flow_rate_l_min',  label: 'Flow Rate',  unit: 'L/min', min: 0, max: 3000, step: 1 },
      { key: 'pressure_bar',     label: 'Pressure',   unit: 'bar',   min: 0, max: 100,  step: 0.1 },
      { key: 'humidity_percent', label: 'Humidity',   unit: '%',     min: 0, max: 100,  step: 0.5 },
    ],
  },
]

function GroupSection({ group, params, onChange }) {
  const [open, setOpen] = useState(true)
  const Icon = group.icon
  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Icon size={14} className={group.color} />
        <span className="section-title">{group.label}</span>
        <ChevronDown
          size={12}
          className={clsx('ml-auto text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="space-y-2 pl-1">
          {group.fields.map((f) => (
            <div key={f.key}>
              <label className="label" htmlFor={f.key}>
                {f.label}
                <span className="ml-1 text-slate-400 font-normal">({f.unit})</span>
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
      )}
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
    <div className="space-y-4">
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

      <div className="h-px bg-slate-200 dark:bg-slate-700" />

      {/* Parameter groups */}
      <div className="space-y-4">
        {PARAM_GROUPS.map((g) => (
          <GroupSection key={g.label} group={g} params={params} onChange={handleChange} />
        ))}
      </div>

      <button onClick={handleReset} className="btn-ghost w-full justify-center text-xs">
        Reset to defaults
      </button>
    </div>
  )
}

export { DEFAULT_PARAMS }
