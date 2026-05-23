import { motion } from 'framer-motion'
import { Sun, Moon, Activity, Wifi, WifiOff, Cpu } from 'lucide-react'
import clsx from 'clsx'

export function Navbar({ theme, onToggleTheme, health, healthLoading }) {
  const isOnline = health?.status === 'ok'

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Gradient border bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div
        style={{
          background: 'rgba(2,8,23,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Activity size={15} className="text-white" />
              </div>
              {/* Pulse ring when online */}
              {isOnline && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#020817]" />
              )}
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight">CoreInsight</span>
                <span
                  className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider"
                  style={{
                    background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    color: '#22d3ee',
                  }}
                >
                  AI
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-slate-500">Predictive Maintenance</span>
            </div>
          </motion.div>

          {/* Center — model info */}
          {health?.failure_model && (
            <motion.div
              className="hidden lg:flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Cpu size={12} className="text-slate-600" />
              <span className="text-xs text-slate-500 font-mono">{health.failure_model}</span>
              {health.failure_model_accuracy && (
                <span
                  className="text-xs font-semibold font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(6,182,212,0.08)',
                    color: '#22d3ee',
                  }}
                >
                  {(health.failure_model_accuracy * 100).toFixed(1)}%
                </span>
              )}
            </motion.div>
          )}

          {/* Right */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Backend status pill */}
            <div
              className={clsx(
                'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium',
                'border transition-all duration-300',
                healthLoading
                  ? 'border-slate-700 text-slate-500'
                  : isOnline
                  ? 'border-emerald-500/20 text-emerald-400'
                  : 'border-red-500/20 text-red-400'
              )}
              style={{
                background: healthLoading
                  ? 'rgba(255,255,255,0.02)'
                  : isOnline
                  ? 'rgba(16,185,129,0.06)'
                  : 'rgba(239,68,68,0.06)',
              }}
            >
              {healthLoading ? (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
              ) : isOnline ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <WifiOff size={10} />
              )}
              {healthLoading ? 'Connecting…' : isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className="btn-ghost p-2 rounded-lg"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark'
                ? <Sun size={15} className="text-slate-400 hover:text-amber-400 transition-colors" />
                : <Moon size={15} className="text-slate-400 hover:text-cyan-400 transition-colors" />
              }
            </button>
          </motion.div>
        </div>
      </div>
    </header>
  )
}
