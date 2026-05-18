import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border animate-slide-up max-w-sm',
        type === 'error'
          ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200'
          : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-200'
      )}
      role="alert"
    >
      {type === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle size={18} className="mt-0.5 shrink-0" />}
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 hover:opacity-70 transition-opacity" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
