import { motion } from 'framer-motion'
import clsx from 'clsx'

const ACCENT_STYLES = {
  cyan:    { icon: 'rgba(6,182,212,0.12)',   text: '#22d3ee',  border: 'rgba(6,182,212,0.15)'   },
  orange:  { icon: 'rgba(249,115,22,0.12)',  text: '#fb923c',  border: 'rgba(249,115,22,0.15)'  },
  green:   { icon: 'rgba(16,185,129,0.12)',  text: '#34d399',  border: 'rgba(16,185,129,0.15)'  },
  red:     { icon: 'rgba(239,68,68,0.12)',   text: '#f87171',  border: 'rgba(239,68,68,0.15)'   },
  amber:   { icon: 'rgba(245,158,11,0.12)',  text: '#fbbf24',  border: 'rgba(245,158,11,0.15)'  },
  purple:  { icon: 'rgba(168,85,247,0.12)',  text: '#c084fc',  border: 'rgba(168,85,247,0.15)'  },
  default: { icon: 'rgba(255,255,255,0.05)', text: '#64748b',  border: 'rgba(255,255,255,0.06)' },
}

export function MetricCard({ label, value, sub, accent, icon: Icon, className, delay = 0 }) {
  const style = ACCENT_STYLES[accent] || ACCENT_STYLES.default

  return (
    <motion.div
      className={clsx('card p-4 flex flex-col gap-2 relative overflow-hidden', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      style={{ borderColor: style.border }}
    >
      {/* Subtle top gradient line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${style.text}30, transparent)` }}
      />

      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {Icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: style.icon }}
          >
            <Icon size={13} style={{ color: style.text }} />
          </div>
        )}
      </div>

      <span
        className="text-xl font-bold leading-tight tracking-tight"
        style={{ color: '#f1f5f9' }}
      >
        {value}
      </span>

      {sub && (
        <span className="text-[11px]" style={{ color: '#475569' }}>{sub}</span>
      )}
    </motion.div>
  )
}
