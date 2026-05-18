import { GaugeChart } from './ui/GaugeChart'
import { StatusBanner } from './ui/StatusBanner'
import { MetricCard } from './ui/MetricCard'
import { Accordion } from './ui/Accordion'
import { Activity, BarChart2, TrendingUp, FileText, AlertTriangle, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import clsx from 'clsx'

const STATUS_COLORS = {
  Normal:   'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  Warning:  'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  Critical: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
}

const TREND_ICONS = {
  Stable:   '→',
  Rising:   '↑',
  Falling:  '↓',
  Volatile: '↕',
}

const TREND_COLORS = {
  Stable:   'text-slate-500',
  Rising:   'text-orange-500',
  Falling:  'text-blue-500',
  Volatile: 'text-purple-500',
}

function DiagnosticsTable({ diagnostics }) {
  if (!diagnostics?.length) return <p className="text-sm text-slate-500">No diagnostics available.</p>
  return (
    <div className="space-y-2">
      {diagnostics.map((d) => {
        const pct = Math.min(100, Math.abs(d.deviation_percent || 0))
        const cfg = STATUS_COLORS[d.status] || STATUS_COLORS.Normal
        return (
          <div key={d.parameter} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-200">{d.parameter}</span>
              <span className={clsx('badge', cfg)}>{d.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-700',
                    d.status === 'Normal' ? 'bg-emerald-500' : d.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{d.explanation}</p>
          </div>
        )
      })}
    </div>
  )
}

function FeatureImportanceChart({ importance }) {
  if (!importance?.length) return <p className="text-sm text-slate-500">Not available.</p>
  const data = importance.slice(0, 8).map((f) => ({
    name: f.feature || f.name || 'Unknown',
    value: parseFloat((f.importance || f.value || 0).toFixed(4)),
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          formatter={(v) => [v.toFixed(4), 'Importance']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsl(${200 + i * 15}, 80%, ${55 - i * 3}%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AnalysisResult({ data }) {
  if (!data) return null

  const {
    failure_probability_percent,
    anomaly_score,
    decision_priority,
    risk_category,
    health_score,
    parameter_diagnostics,
    feature_importance,
    trend_insights,
    comparison_note,
    engineering_report,
    structured_analysis,
  } = data

  const visuals = structured_analysis?.visualizations || []
  const rootCause = structured_analysis?.root_cause_analysis || []
  const historicalComparison = structured_analysis?.historical_comparison || []

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Status banner */}
      <StatusBanner risk={risk_category} priority={decision_priority} />

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Failure Probability"
          value={`${failure_probability_percent?.toFixed(2)}%`}
          icon={AlertTriangle}
          accent="orange"
        />
        <MetricCard
          label="Anomaly Score"
          value={anomaly_score?.toFixed(3)}
          icon={Activity}
          accent="blue"
        />
        <MetricCard
          label="Decision Priority"
          value={decision_priority}
          icon={AlertTriangle}
        />
        <MetricCard
          label="Risk Category"
          value={risk_category}
          icon={BarChart2}
        />
      </div>

      {/* Gauges */}
      <div className="card p-6">
        <h3 className="section-title mb-4">Health &amp; Risk Gauges</h3>
        <div className="grid grid-cols-2 gap-4">
          <GaugeChart value={health_score} title="Health Score" />
          <GaugeChart value={failure_probability_percent} title="Failure Risk %" />
        </div>
      </div>

      {/* Parameter diagnostics */}
      <div className="card p-4">
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Activity size={14} /> Parameter Diagnostics
        </h3>
        <DiagnosticsTable diagnostics={parameter_diagnostics} />
      </div>

      {/* Feature importance */}
      <div className="card p-4">
        <h3 className="section-title mb-3 flex items-center gap-2">
          <BarChart2 size={14} /> Feature Importance
        </h3>
        <FeatureImportanceChart importance={feature_importance} />
      </div>

      {/* Trend insights */}
      {trend_insights?.length > 0 && (
        <div className="card p-4">
          <h3 className="section-title mb-3 flex items-center gap-2">
            <TrendingUp size={14} /> Trend Insights
          </h3>
          <div className="space-y-2">
            {trend_insights.map((t, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className={clsx('font-mono text-base leading-none mt-0.5', TREND_COLORS[t.trend])}>
                  {TREND_ICONS[t.trend] || '→'}
                </span>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{t.metric}</span>
                  <span className="text-slate-500 dark:text-slate-400"> — {t.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison note */}
      {comparison_note && (
        <div className="card p-4 border-l-4 border-brand-500">
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Clock size={14} className="mt-0.5 shrink-0 text-brand-500" />
            {comparison_note}
          </div>
        </div>
      )}

      {/* Visualizations */}
      {visuals.length > 0 && (
        <div className="card p-4">
          <h3 className="section-title mb-3">Generated Visualizations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visuals.slice(0, 3).map((v, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-700/50">
                  {v.title || v.metric || `Chart ${i + 1}`}
                </p>
                <img
                  src={`data:image/png;base64,${v.image_base64}`}
                  alt={v.title || 'Visualization'}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engineering report */}
      <div className="card p-4">
        <h3 className="section-title mb-3 flex items-center gap-2">
          <FileText size={14} /> Engineering Decision Report
        </h3>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {engineering_report || 'No report available.'}
        </div>
      </div>

      {/* Expandable sections */}
      <div className="space-y-2">
        {rootCause.length > 0 && (
          <Accordion title="Root Cause Analysis">
            <ul className="space-y-1.5">
              {rootCause.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-brand-500 mt-0.5">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </Accordion>
        )}
        {historicalComparison.length > 0 && (
          <Accordion title="Historical Comparison">
            <ul className="space-y-1.5">
              {historicalComparison.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-brand-500 mt-0.5">•</span>
                  {item.detail || JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </Accordion>
        )}
      </div>
    </div>
  )
}
