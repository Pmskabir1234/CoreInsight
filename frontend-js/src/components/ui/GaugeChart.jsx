import { useEffect, useRef } from 'react'

/**
 * Animated radial gauge — full circle with arc fill.
 * value: 0–100
 * variant: 'health' | 'risk'
 */
export function GaugeChart({ value = 0, title, size = 180, variant = 'health' }) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const prevValue = useRef(0)

  useEffect(() => {
    prevValue.current = clampedValue
  }, [clampedValue])

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const strokeWidth = size * 0.075
  const circumference = 2 * Math.PI * radius
  // Use 270° arc (¾ circle), starting from bottom-left
  const arcLength = circumference * 0.75
  const offset = arcLength - (clampedValue / 100) * arcLength

  // Color based on variant and value
  const getColor = () => {
    if (variant === 'health') {
      if (clampedValue >= 70) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.4)', text: '#10b981' }
      if (clampedValue >= 40) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.4)', text: '#f59e0b' }
      return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)', text: '#ef4444' }
    } else {
      // risk — inverse
      if (clampedValue <= 30) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.4)', text: '#10b981' }
      if (clampedValue <= 60) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.4)', text: '#f59e0b' }
      if (clampedValue <= 80) return { stroke: '#f97316', glow: 'rgba(249,115,22,0.4)', text: '#f97316' }
      return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)', text: '#ef4444' }
    }
  }

  const colors = getColor()

  // Rotation: start at 135° (bottom-left)
  const rotation = 135

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`${title}: ${clampedValue}`}
          style={{ overflow: 'visible' }}
        >
          {/* Outer glow ring */}
          <circle
            cx={cx} cy={cy} r={radius + strokeWidth / 2 + 2}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="1"
            opacity="0.08"
          />

          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />

          {/* Value arc */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1), stroke 0.6s ease',
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />

          {/* Center value */}
          <text
            x={cx} y={cy - 4}
            textAnchor="middle"
            style={{
              fontSize: size * 0.2,
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              fill: colors.text,
              filter: `drop-shadow(0 0 8px ${colors.glow})`,
            }}
          >
            {clampedValue.toFixed(0)}
          </text>
          <text
            x={cx} y={cy + size * 0.1}
            textAnchor="middle"
            style={{ fontSize: size * 0.075, fill: '#475569', fontFamily: 'Inter, sans-serif' }}
          >
            / 100
          </text>
        </svg>
      </div>
      <span
        className="text-xs font-semibold tracking-wider uppercase"
        style={{ color: '#475569' }}
      >
        {title}
      </span>
    </div>
  )
}
