import { motion } from 'framer-motion'
import { Clock, AlertTriangle, Database } from 'lucide-react'

const RISK_CFG = {
  Low:      { color: '#34d399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.15)'  },
  Medium:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)'  },
  High:     { color: '#fb923c', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.15)'  },
  Critical: { color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.15)'   },
}

function RiskBar({ pct, risk }) {
  const cfg = RISK_CFG[risk] || RISK_CFG.Low
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[80px]">
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[11px] font-mono w-10 text-right" style={{ color: cfg.color }}>
        {pct?.toFixed(1)}%
      </span>
    </div>
  )
}

export function HistoryPanel({ items }) {
  if (!items?.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card p-16 flex flex-col items-center gap-4 text-center"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}
        >
          <Database size={20} style={{ color: '#22d3ee' }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#475569' }}>No history records</p>
          <p className="text-xs mt-1" style={{ color: '#334155' }}>
            Run an analysis to start building history
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(6,182,212,0.12)' }}
        >
          <Clock size={12} style={{ color: '#22d3ee' }} />
        </div>
        <span className="section-title">Recent Analysis History</span>
        <span
          className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee' }}
        >
          {items.length}
        </span>
      </div>

      {/* Rows */}
      <div>
        {items.map((item, i) => {
          const cfg = RISK_CFG[item.risk_category] || RISK_CFG.Low
          const pct = item.failure_probability_percent || 0

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="px-5 py-3.5 flex flex-wrap items-center gap-3 transition-colors"
              style={{
                borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}
              whileHover={{ background: 'rgba(255,255,255,0.02)' }}
            >
              {/* Timestamp */}
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <Clock size={11} style={{ color: '#334155' }} />
                <span className="text-[11px] font-mono" style={{ color: '#475569' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : 'n/a'}
                </span>
              </div>

              {/* Risk badge */}
              <span
                className="badge"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
              >
                {item.risk_category || 'Unknown'}
              </span>

              {/* Failure bar */}
              <RiskBar pct={pct} risk={item.risk_category} />

              {/* Machine ID */}
              {item.machine_id && (
                <span className="text-[11px] font-mono" style={{ color: '#334155' }}>
                  {item.machine_id}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
