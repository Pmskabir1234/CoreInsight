import { motion } from 'framer-motion'
import { GaugeChart } from './ui/GaugeChart'
import { StatusBanner } from './ui/StatusBanner'
import { MetricCard } from './ui/MetricCard'
import { Accordion } from './ui/Accordion'
import {
  Activity, BarChart2, TrendingUp, TrendingDown, Minus,
  FileText, AlertTriangle, Clock, Zap, Brain,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import clsx from 'clsx'

/* ── helpers ── */
const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  },
}

const STATUS_CFG = {
  Normal:   { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  text: '#34d399', bar: '#10b981' },
  Warning:  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  text: '#fbbf24', bar: '#f59e0b' },
  Critical: { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#f87171', bar: '#ef4444' },
}

const TREND_CFG = {
  Stable:   { icon: Minus,        color: '#64748b', label: 'Stable'   },
  Rising:   { icon: TrendingUp,   color: '#fb923c', label: 'Rising'   },
  Falling:  { icon: TrendingDown, color: '#22d3ee', label: 'Falling'  },
  Volatile: { icon: Activity,     color: '#c084fc', label: 'Volatile' },
}

/* ── sub-components ── */
function SectionHeader({ icon: Icon, title, accent = '#06b6d4' }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: `${accent}15` }}
      >
        <Icon size={12} style={{ color: accent }} />
      </div>
      <span className="section-title" style={{ color: '#475569' }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

function DiagnosticsGrid({ diagnostics }) {
  if (!diagnostics?.length) return (
    <p className="text-sm" style={{ color: '#334155' }}>No diagnostics available.</p>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {diagnostics.map((d, i) => {
        const pct = Math.min(100, Math.abs(d.deviation_percent || 0))
        const cfg = STATUS_CFG[d.status] || STATUS_CFG.Normal

        return (
          <motion.div
            key={d.parameter}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="rounded-xl p-3 space-y-2"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
                {d.parameter}
              </span>
              <span
                className="badge"
                style={{
                  background: `${cfg.bar}20`,
                  color: cfg.text,
                  border: `1px solid ${cfg.bar}30`,
                }}
              >
                {d.status}
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: cfg.bar, boxShadow: `0 0 6px ${cfg.bar}60` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: '#334155' }}>
                {d.actual_value?.toFixed(2)} (safe: {d.safe_min}–{d.safe_max})
              </span>
              <span className="text-[11px] font-mono" style={{ color: cfg.text }}>
                {pct.toFixed(1)}%
              </span>
            </div>

            {d.explanation && (
              <p className="text-[11px] leading-relaxed" style={{ color: '#475569' }}>
                {d.explanation}
              </p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function FeatureImportanceChart({ importance }) {
  if (!importance?.length) return (
    <p className="text-sm" style={{ color: '#334155' }}>Not available.</p>
  )

  const data = importance.slice(0, 8).map((f) => ({
    name: f.feature || f.name || 'Unknown',
    value: parseFloat((f.importance || f.value || 0).toFixed(4)),
  }))

  const BAR_COLORS = [
    '#06b6d4', '#0891b2', '#0e7490', '#155e75',
    '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe',
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: '#334155' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#475569' }}
          width={140}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            background: 'rgba(10,15,30,0.95)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: '0.75rem',
            fontSize: 12,
            color: '#94a3b8',
          }}
          formatter={(v) => [v.toFixed(4), 'Importance']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={BAR_COLORS[i % BAR_COLORS.length]}
              style={{ filter: `drop-shadow(0 0 4px ${BAR_COLORS[i % BAR_COLORS.length]}60)` }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function TrendInsightRow({ t, i }) {
  const cfg = TREND_CFG[t.trend] || TREND_CFG.Stable
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05, duration: 0.3 }}
      className="flex items-start gap-3 p-3 rounded-xl transition-colors"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
      whileHover={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${cfg.color}15` }}
      >
        <Icon size={12} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{t.metric}</span>
          <span
            className="badge"
            style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#475569' }}>{t.detail}</p>
      </div>
    </motion.div>
  )
}

/* ── main export ── */
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
    <motion.div
      className="space-y-4"
      variants={stagger.container}
      initial="initial"
      animate="animate"
    >
      {/* Status banner */}
      <motion.div variants={stagger.item}>
        <StatusBanner risk={risk_category} priority={decision_priority} />
      </motion.div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Failure Probability"
          value={`${failure_probability_percent?.toFixed(2)}%`}
          icon={AlertTriangle}
          accent="orange"
          delay={0.05}
        />
        <MetricCard
          label="Anomaly Score"
          value={anomaly_score?.toFixed(3)}
          icon={Activity}
          accent="cyan"
          delay={0.1}
        />
        <MetricCard
          label="Decision Priority"
          value={decision_priority}
          icon={Zap}
          accent="amber"
          delay={0.15}
        />
        <MetricCard
          label="Risk Category"
          value={risk_category}
          icon={BarChart2}
          accent={risk_category === 'Critical' ? 'red' : risk_category === 'High' ? 'orange' : risk_category === 'Medium' ? 'amber' : 'green'}
          delay={0.2}
        />
      </div>

      {/* Gauges */}
      <motion.div variants={stagger.item} className="card-elevated p-6">
        <SectionHeader icon={Activity} title="System Health & Risk Gauges" />
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <GaugeChart value={health_score} title="Health Score" size={180} variant="health" />
          </div>
          <div className="flex flex-col items-center">
            <GaugeChart value={failure_probability_percent} title="Failure Risk %" size={180} variant="risk" />
          </div>
        </div>
      </motion.div>

      {/* Diagnostics */}
      <motion.div variants={stagger.item} className="card p-5">
        <SectionHeader icon={Activity} title="Parameter Diagnostics" accent="#22d3ee" />
        <DiagnosticsGrid diagnostics={parameter_diagnostics} />
      </motion.div>

      {/* Feature importance */}
      <motion.div variants={stagger.item} className="card p-5">
        <SectionHeader icon={BarChart2} title="Feature Importance" accent="#c084fc" />
        <FeatureImportanceChart importance={feature_importance} />
      </motion.div>

      {/* Trend insights */}
      {trend_insights?.length > 0 && (
        <motion.div variants={stagger.item} className="card p-5">
          <SectionHeader icon={TrendingUp} title="Trend Insights" accent="#fbbf24" />
          <div className="space-y-2">
            {trend_insights.map((t, i) => (
              <TrendInsightRow key={i} t={t} i={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Comparison note */}
      {comparison_note && (
        <motion.div
          variants={stagger.item}
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            background: 'rgba(6,182,212,0.05)',
            border: '1px solid rgba(6,182,212,0.15)',
            borderLeft: '3px solid #06b6d4',
          }}
        >
          <Clock size={14} className="mt-0.5 shrink-0" style={{ color: '#22d3ee' }} />
          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{comparison_note}</p>
        </motion.div>
      )}

      {/* Visualizations */}
      {visuals.length > 0 && (
        <motion.div variants={stagger.item} className="card p-5">
          <SectionHeader icon={BarChart2} title="Generated Visualizations" accent="#06b6d4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visuals.slice(0, 3).map((v, i) => (
              <motion.div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="px-3 py-2 text-[11px] font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: '#475569',
                  }}
                >
                  {v.title || v.metric || `Chart ${i + 1}`}
                </div>
                <img
                  src={`data:image/png;base64,${v.image_base64}`}
                  alt={v.title || 'Visualization'}
                  className="w-full"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Engineering report */}
      <motion.div variants={stagger.item} className="card p-5">
        <SectionHeader icon={Brain} title="AI Engineering Report" accent="#c084fc" />
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: '#64748b', fontFamily: 'var(--font-sans)' }}
        >
          {engineering_report || 'No report available.'}
        </div>
      </motion.div>

      {/* Expandable sections */}
      <motion.div variants={stagger.item} className="space-y-2">
        {rootCause.length > 0 && (
          <Accordion title="Root Cause Analysis">
            <ul className="space-y-2 pt-1">
              {rootCause.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: '#64748b' }}>
                  <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: '#06b6d4' }} />
                  {line}
                </li>
              ))}
            </ul>
          </Accordion>
        )}
        {historicalComparison.length > 0 && (
          <Accordion title="Historical Comparison">
            <ul className="space-y-2 pt-1">
              {historicalComparison.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: '#64748b' }}>
                  <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: '#06b6d4' }} />
                  {item.detail || JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </Accordion>
        )}
      </motion.div>
    </motion.div>
  )
}
