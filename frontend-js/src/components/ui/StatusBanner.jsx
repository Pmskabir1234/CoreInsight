import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, AlertCircle, XCircle, Shield } from 'lucide-react'
import clsx from 'clsx'

const RISK_CONFIG = {
  Low: {
    icon: CheckCircle,
    dot: '#10b981',
    text: '#34d399',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.2)',
    glow: 'rgba(16,185,129,0.15)',
    label: 'SYSTEM NOMINAL',
  },
  Medium: {
    icon: AlertTriangle,
    dot: '#f59e0b',
    text: '#fbbf24',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    glow: 'rgba(245,158,11,0.12)',
    label: 'MONITOR REQUIRED',
  },
  High: {
    icon: AlertCircle,
    dot: '#f97316',
    text: '#fb923c',
    bg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.2)',
    glow: 'rgba(249,115,22,0.12)',
    label: 'ATTENTION REQUIRED',
  },
  Critical: {
    icon: XCircle,
    dot: '#ef4444',
    text: '#f87171',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    glow: 'rgba(239,68,68,0.2)',
    label: 'CRITICAL ALERT',
  },
}

export function StatusBanner({ risk, priority }) {
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.Low
  const Icon = cfg.icon
  const isCritical = risk === 'Critical'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 40px ${cfg.glow}, 0 4px 20px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Animated glow for critical */}
      {isCritical && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: 'rgba(239,68,68,0.04)', pointerEvents: 'none' }}
        />
      )}

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Animated status dot */}
        <div className="relative shrink-0">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ background: cfg.dot }}
            animate={isCritical ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: cfg.dot, opacity: 0.3 }}
          />
        </div>

        <Icon size={18} style={{ color: cfg.text, flexShrink: 0 }} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
          <span className="font-bold text-sm tracking-wider" style={{ color: cfg.text }}>
            {cfg.label}
          </span>
          <span className="text-xs" style={{ color: `${cfg.text}99` }}>
            Priority: {priority}
          </span>
          <span className="text-xs" style={{ color: `${cfg.text}99` }}>
            Risk: {risk}
          </span>
        </div>

        {/* Right badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: `${cfg.dot}15`, border: `1px solid ${cfg.dot}30` }}
        >
          <Shield size={11} style={{ color: cfg.text }} />
          <span className="text-[11px] font-semibold" style={{ color: cfg.text }}>{risk}</span>
        </div>
      </div>
    </motion.div>
  )
}
