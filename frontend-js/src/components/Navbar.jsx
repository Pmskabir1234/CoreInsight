import { Sun, Moon, Activity, Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'

export function Navbar({ theme, onToggleTheme, health, healthLoading }) {
  const isOnline = health?.status === 'ok'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
            <Activity size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">CoreInsight</span>
            <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">Predictive Maintenance</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Backend status */}
          <div className={clsx(
            'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            healthLoading
              ? 'border-slate-200 dark:border-slate-700 text-slate-400'
              : isOnline
              ? 'border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
              : 'border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          )}>
            {healthLoading ? (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            ) : isOnline ? (
              <Wifi size={11} />
            ) : (
              <WifiOff size={11} />
            )}
            {healthLoading ? 'Checking…' : isOnline ? 'Backend Online' : 'Backend Offline'}
          </div>

          {/* Model info */}
          {health?.failure_model && (
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>{health.failure_model}</span>
              {health.failure_model_accuracy && (
                <span className="text-brand-500">({(health.failure_model_accuracy * 100).toFixed(1)}%)</span>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="btn-ghost p-2"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
