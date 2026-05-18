import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          size={16}
          className={clsx('text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 animate-fade-in border-t border-slate-100 dark:border-slate-700/50">
          {children}
        </div>
      )}
    </div>
  )
}
