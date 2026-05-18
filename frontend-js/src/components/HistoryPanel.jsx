import { Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const RISK_BADGE = {
  Low:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Medium:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  High:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function HistoryPanel({ items }) {
  if (!items?.length) {
    return (
      <div className="card p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        No history records found.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden animate-slide-up">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="section-title flex items-center gap-2">
          <Clock size={14} /> Recent Analysis History
        </h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {items.map((item, i) => (
          <div key={i} className="px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-[140px]">
              <Clock size={12} />
              {item.created_at ? new Date(item.created_at).toLocaleString() : 'n/a'}
            </div>
            <span className={clsx('badge', RISK_BADGE[item.risk_category] || RISK_BADGE.Low)}>
              {item.risk_category || 'Unknown'}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <AlertTriangle size={12} className="text-orange-500" />
              {item.failure_probability_percent?.toFixed(2) ?? '—'}% failure
            </div>
            {item.machine_id && (
              <span className="text-xs font-mono text-slate-400">{item.machine_id}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
