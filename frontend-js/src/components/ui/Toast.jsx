import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  const isError = type === 'error'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl max-w-sm"
        style={{
          background: isError ? 'rgba(30,8,8,0.95)' : 'rgba(8,30,20,0.95)',
          border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}`,
          backdropFilter: 'blur(16px)',
        }}
        role="alert"
      >
        {isError
          ? <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#f87171' }} />
          : <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#34d399' }} />
        }
        <span className="text-sm flex-1" style={{ color: isError ? '#fca5a5' : '#6ee7b7' }}>
          {message}
        </span>
        <button
          onClick={onClose}
          className="shrink-0 transition-opacity hover:opacity-70"
          aria-label="Dismiss"
          style={{ color: '#475569' }}
        >
          <X size={13} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
