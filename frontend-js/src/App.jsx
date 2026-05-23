import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './hooks/useTheme'
import { useApi } from './hooks/useApi'
import { api } from './api/client'
import { Navbar } from './components/Navbar'
import { InputPanel, DEFAULT_PARAMS } from './components/InputPanel'
import { AnalysisResult } from './components/AnalysisResult'
import { PredictResult } from './components/PredictResult'
import { SimulationPanel } from './components/SimulationPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { Toast } from './components/ui/Toast'
import { Spinner } from './components/ui/Spinner'
import {
  Activity, Zap, Clock, BarChart2, ChevronRight,
  Menu, X, FlaskConical, Database,
} from 'lucide-react'
import clsx from 'clsx'

const TABS = [
  { id: 'analyze',  label: 'Analysis',   icon: Activity,     accent: '#06b6d4' },
  { id: 'predict',  label: 'Predict',    icon: Zap,          accent: '#fbbf24' },
  { id: 'simulate', label: 'Simulate',   icon: FlaskConical, accent: '#c084fc' },
  { id: 'history',  label: 'History',    icon: Database,     accent: '#34d399' },
]

/* ── Loading skeleton ── */
function SkeletonCard({ h = 'h-32' }) {
  return <div className={clsx('skeleton rounded-2xl', h)} />
}

function LoadingState({ message }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <Spinner size="sm" />
        <span className="text-xs" style={{ color: '#475569' }}>{message}</span>
      </div>
      <SkeletonCard h="h-16" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} h="h-24" />)}
      </div>
      <SkeletonCard h="h-64" />
      <SkeletonCard h="h-48" />
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({ icon: Icon, title, description, action, actionLabel, loading, accent = '#06b6d4' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card-elevated p-16 flex flex-col items-center gap-5 text-center"
    >
      {/* Animated icon */}
      <motion.div
        className="relative"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: `${accent}10`,
            border: `1px solid ${accent}20`,
            boxShadow: `0 0 30px ${accent}15`,
          }}
        >
          <Icon size={26} style={{ color: accent }} />
        </div>
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-2xl animate-ping"
          style={{ background: `${accent}08`, animationDuration: '3s' }}
        />
      </motion.div>

      <div>
        <h3 className="font-semibold text-sm mb-1.5" style={{ color: '#94a3b8' }}>{title}</h3>
        <p className="text-xs leading-relaxed max-w-xs" style={{ color: '#475569' }}>{description}</p>
      </div>

      <button onClick={action} disabled={loading} className="btn-primary">
        {loading ? <Spinner size="sm" /> : <ChevronRight size={13} />}
        {actionLabel}
      </button>
    </motion.div>
  )
}

/* ── Main App ── */
export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('analyze')
  const [machineId, setMachineId] = useState('MOTOR-LINE-07')
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // API hooks — all logic untouched
  const healthApi   = useApi(useCallback((sig) => api.health(sig), []))
  const analyzeApi  = useApi(useCallback((payload, sig) => api.analyze(payload, sig), []))
  const predictApi  = useApi(useCallback((payload, sig) => api.predict(payload, sig), []))
  const simulateApi = useApi(useCallback((payload, sig) => api.simulate(payload, sig), []))
  const historyApi  = useApi(useCallback((id, limit, sig) => api.history(id, limit, sig), []))

  useEffect(() => {
    healthApi.execute()
    const interval = setInterval(() => healthApi.execute(), 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  useEffect(() => {
    const err = analyzeApi.error || predictApi.error || simulateApi.error || historyApi.error
    if (err) setToast({ message: err, type: 'error' })
  }, [analyzeApi.error, predictApi.error, simulateApi.error, historyApi.error])

  function buildPayload() {
    return { machine_id: machineId, parameters: params }
  }

  async function handleAnalyze() {
    await analyzeApi.execute(buildPayload())
    setActiveTab('analyze')
  }

  async function handlePredict() {
    await predictApi.execute(buildPayload())
    setActiveTab('predict')
  }

  async function handleHistory() {
    await historyApi.execute(machineId, 10)
    setActiveTab('history')
  }

  async function handleSimulate(payload) {
    await simulateApi.execute(payload)
  }

  const anyLoading = analyzeApi.loading || predictApi.loading || simulateApi.loading || historyApi.loading

  const hasData = {
    analyze:  !!analyzeApi.data,
    predict:  !!predictApi.data,
    simulate: !!simulateApi.data,
    history:  !!historyApi.data,
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: '#020817', color: '#e2e8f0' }}
    >
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.06) 0%, transparent 60%)',
        }}
      />

      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        health={healthApi.data}
        healthLoading={healthApi.loading}
      />

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-5">

          {/* ── Sidebar overlay (mobile) ── */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 lg:hidden"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* ── Sidebar ── */}
          <aside
            className={clsx(
              'fixed lg:static inset-y-0 left-0 z-40',
              'w-64 xl:w-72 shrink-0',
              'overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'lg:translate-x-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              'pt-14 lg:pt-0 pb-6',
            )}
            style={{
              background: 'rgba(2,8,23,0.95)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Mobile close */}
            <button
              className="lg:hidden absolute top-4 right-4 btn-ghost p-1.5"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={16} style={{ color: '#475569' }} />
            </button>

            <div className="px-3 lg:px-0 space-y-3">
              {/* Sidebar card */}
              <div
                className="rounded-2xl p-4 space-y-4"
                style={{
                  background: 'rgba(13,21,38,0.8)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                <InputPanel
                  params={params}
                  machineId={machineId}
                  onMachineIdChange={setMachineId}
                  onParamsChange={setParams}
                />

                <div className="divider" />

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzeApi.loading}
                    className="btn-primary w-full justify-center"
                  >
                    {analyzeApi.loading ? <Spinner size="sm" /> : <Activity size={13} />}
                    Run Full Analysis
                  </button>
                  <button
                    onClick={handlePredict}
                    disabled={predictApi.loading}
                    className="btn-secondary w-full justify-center"
                  >
                    {predictApi.loading ? <Spinner size="sm" /> : <Zap size={13} />}
                    Quick Predict
                  </button>
                  <button
                    onClick={handleHistory}
                    disabled={historyApi.loading}
                    className="btn-secondary w-full justify-center"
                  >
                    {historyApi.loading ? <Spinner size="sm" /> : <Clock size={13} />}
                    Load History
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Mobile top bar */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-secondary"
                aria-label="Open sidebar"
              >
                <Menu size={14} />
                Inputs
              </button>
              {anyLoading && <Spinner size="sm" />}
            </div>

            {/* Tab bar */}
            <div
              className="flex items-center gap-1 p-1 rounded-2xl overflow-x-auto"
              style={{
                background: 'rgba(13,21,38,0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                const hasDot = hasData[tab.id] && !active

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200"
                    style={{
                      color: active ? '#fff' : '#475569',
                      background: active
                        ? `linear-gradient(135deg, ${tab.accent}25, ${tab.accent}15)`
                        : 'transparent',
                      border: active ? `1px solid ${tab.accent}30` : '1px solid transparent',
                      boxShadow: active ? `0 0 16px ${tab.accent}15` : 'none',
                    }}
                  >
                    <Icon size={13} style={{ color: active ? tab.accent : '#334155' }} />
                    {tab.label}
                    {hasDot && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: tab.accent, boxShadow: `0 0 4px ${tab.accent}` }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'analyze' && (
                  analyzeApi.loading ? (
                    <LoadingState message="Running full analysis pipeline…" />
                  ) : analyzeApi.data ? (
                    <AnalysisResult data={analyzeApi.data} />
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title="No analysis yet"
                      description="Configure your machine parameters in the sidebar and click Run Full Analysis."
                      action={handleAnalyze}
                      actionLabel="Run Analysis"
                      loading={analyzeApi.loading}
                      accent="#06b6d4"
                    />
                  )
                )}

                {activeTab === 'predict' && (
                  predictApi.loading ? (
                    <LoadingState message="Running failure prediction…" />
                  ) : predictApi.data ? (
                    <PredictResult data={predictApi.data} />
                  ) : (
                    <EmptyState
                      icon={Zap}
                      title="No prediction yet"
                      description="Click Quick Predict for a fast failure probability estimate."
                      action={handlePredict}
                      actionLabel="Quick Predict"
                      loading={predictApi.loading}
                      accent="#fbbf24"
                    />
                  )
                )}

                {activeTab === 'simulate' && (
                  <SimulationPanel
                    params={params}
                    machineId={machineId}
                    onSimulate={handleSimulate}
                    loading={simulateApi.loading}
                    result={simulateApi.data}
                  />
                )}

                {activeTab === 'history' && (
                  historyApi.loading ? (
                    <LoadingState message="Loading history…" />
                  ) : (
                    <HistoryPanel items={historyApi.data?.items} />
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
