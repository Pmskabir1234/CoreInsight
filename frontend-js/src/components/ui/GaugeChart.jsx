/**
 * SVG-based semi-circular gauge chart.
 * value: 0–100
 */
export function GaugeChart({ value = 0, title, size = 200 }) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const radius = 80
  const cx = size / 2
  const cy = size / 2 + 10
  const circumference = Math.PI * radius // half circle
  const offset = circumference - (clampedValue / 100) * circumference

  // Color stops
  const color =
    clampedValue >= 75
      ? '#22c55e'
      : clampedValue >= 50
      ? '#eab308'
      : clampedValue >= 25
      ? '#f97316'
      : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`} aria-label={`${title}: ${clampedValue}`}>
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Value arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease',
          }}
        />
        {/* Center value */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="fill-slate-800 dark:fill-slate-100"
          style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}
        >
          {clampedValue.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400"
          style={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }}
        >
          / 100
        </text>
        {/* Min / Max labels */}
        <text x={cx - radius + 4} y={cy + 20} textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8' }}>0</text>
        <text x={cx + radius - 4} y={cy + 20} textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8' }}>100</text>
      </svg>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
    </div>
  )
}
