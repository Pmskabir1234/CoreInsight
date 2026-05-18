import clsx from 'clsx'
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

const RISK_CONFIG = {
  Low:      { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle,    dot: 'bg-emerald-500' },
  Medium:   { bg: 'bg-yellow-500/10 border-yellow-500/30',   text: 'text-yellow-700 dark:text-yellow-300',   icon: AlertTriangle,  dot: 'bg-yellow-500' },
  High:     { bg: 'bg-orange-500/10 border-orange-500/30',   text: 'text-orange-700 dark:text-orange-300',   icon: AlertCircle,    dot: 'bg-orange-500' },
  Critical: { bg: 'bg-red-500/10 border-red-500/30',         text: 'text-red-700 dark:text-red-300',         icon: XCircle,        dot: 'bg-red-500' },
}

export function StatusBanner({ risk, priority }) {
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.Low
  const Icon = cfg.icon
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl border animate-fade-in', cfg.bg)}>
      <span className={clsx('w-2.5 h-2.5 rounded-full animate-pulse-slow', cfg.dot)} />
      <Icon size={18} className={cfg.text} />
      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
        <span className={clsx('font-semibold text-sm', cfg.text)}>System Status: {priority}</span>
        <span className={clsx('text-xs', cfg.text)}>Risk Category: {risk}</span>
      </div>
    </div>
  )
}
