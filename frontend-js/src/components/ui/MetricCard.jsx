import clsx from 'clsx'

export function MetricCard({ label, value, sub, accent, icon: Icon, className }) {
  return (
    <div className={clsx('card p-4 flex flex-col gap-1 animate-slide-up', className)}>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {Icon && (
          <span className={clsx('p-1.5 rounded-lg', accent ? `bg-${accent}-100 dark:bg-${accent}-900/30` : 'bg-slate-100 dark:bg-slate-700')}>
            <Icon size={14} className={accent ? `text-${accent}-600 dark:text-${accent}-400` : 'text-slate-500'} />
          </span>
        )}
      </div>
      <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{value}</span>
      {sub && <span className="text-xs text-slate-500 dark:text-slate-400">{sub}</span>}
    </div>
  )
}
