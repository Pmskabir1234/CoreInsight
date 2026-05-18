import { MetricCard } from './ui/MetricCard'
import { GaugeChart } from './ui/GaugeChart'
import { BarChart2, AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

export function PredictResult({ data }) {
  if (!data) return null
  const { failure_probability_percent, risk_category, feature_importance } = data

  const chartData = (feature_importance || []).slice(0, 6).map((f) => ({
    name: f.feature || f.name || 'Unknown',
    value: parseFloat((f.importance || f.value || 0).toFixed(4)),
  }))

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Failure Probability"
          value={`${failure_probability_percent?.toFixed(2)}%`}
          icon={AlertTriangle}
          accent="orange"
        />
        <MetricCard
          label="Risk Category"
          value={risk_category}
          icon={BarChart2}
        />
      </div>
      <div className="card p-6 flex justify-center">
        <GaugeChart value={failure_probability_percent} title="Failure Risk %" />
      </div>
      {chartData.length > 0 && (
        <div className="card p-4">
          <h3 className="section-title mb-3">Top Contributing Factors</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none' }} formatter={(v) => [v.toFixed(4), 'Importance']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${210 + i * 20}, 75%, ${55 - i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
