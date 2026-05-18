import { useState, useCallback, useEffect } from 'react'
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
import { Activity, Zap, Clock, BarChart2, ChevronRight, Menu, X } from 'lucide-react'
import clsx from 'clsx'

const TABS = [
  { id: 'analyze',  label: 'Full Analysis',  icon: Activity },
  { id: 'predict',  label: 'Quick Predict',  icon: Zap },
  { id: 'simulate', label: 'Simulation',     icon: BarChart2 },
  { id: 'history',  label: 'History',        icon: Clock },
]

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('analyze')
  const [machineId, setMachineId] = useState('MOTOR-LINE-07')
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // API hooks
  const healthApi  = useApi(useCallback((sig) => api.health(sig), []))
  const analyzeApi = useApi(useCallback((payload, sig) => api.analyze(payload, sig), []))
  const predictApi = useApi(useCallback((payload, sig) => api.predict(payload, sig), []))
  const simulateApi = useApi(useCallback((payload, sig) => api.simulate(payload, sig), []))
  const historyApi = useApi(useCallback((id, limit, sig) => api.history(id, limit, sig), []))

  // Poll health on mount
  useEffect(() => {
    healthApi.execute()
    const interval = setInterval(() => healthApi.execute(), 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  // Show toast on errors
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        health={healthApi.data}
        healthLoading={healthApi.loading}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={clsx(
            'fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-64 xl:w-72 shrink-0',
            'bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent',
            'border-r border-slate-200 dark:border-slate-700/60 lg:border-0',
            'overflow-y-auto transition-transform duration-300 ease-in-out',
            'lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'pt-14 lg:pt-0 px-4 lg:px-0 pb-6'
          )}>
            {/* Mobile close */}
            <button
              className="lg:hidden absolute top-4 right-4 btn-ghost p-1.5"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>

            <div className="card p-4 space-y-4">
              <InputPanel
                params={params}
                machineId={machineId}
                onMachineIdChange={setMachineId}
                onParamsChange={setParams}
              />

              <div className="h-px bg-slate-200 dark:bg-slate-700" />

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzeApi.loading}
                  className="btn-primary w-full justify-center"
                >
                  {analyzeApi.loading ? <Spinner size="sm" /> : <Activity size={14} />}
                  Run Full Analysis
                </button>
                <button
                  onClick={handlePredict}
                  disabled={predictApi.loading}
                  className="btn-secondary w-full justify-center"
                >
                  {predictApi.loading ? <Spinner size="sm" /> : <Zap size={14} />}
                  Quick Predict
                </button>
                <button
                  onClick={handleHistory}
                  disabled={historyApi.loading}
                  className="btn-secondary w-full justify-center"
                >
                  {historyApi.loading ? <Spinner size="sm" /> : <Clock size={14} />}
                  Load History
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 space-y-4">
            {/* Mobile sidebar toggle */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-secondary"
                aria-label="Open sidebar"
              >
                <Menu size={16} />
                Inputs
              </button>
              {anyLoading && <Spinner size="sm" />}
            </div>

            {/* Breadcrumb / tab bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const hasData =
                  (tab.id === 'analyze'  && analyzeApi.data)  ||
                  (tab.id === 'predict'  && predictApi.data)  ||
                  (tab.id === 'simulate' && simulateApi.data) ||
                  (tab.id === 'history'  && historyApi.data)
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150',
                      activeTab === tab.id
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon size={14} />
                    {tab.label}
                    {hasData && activeTab !== tab.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div>
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
            </div>
          </main>
        </div>
      </div>

      {/* Toast notifications */}
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

function LoadingState({ message }) {
  return (
    <div className="card p-12 flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
      <Spinner size="lg" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action, actionLabel, loading }) {
  return (
    <div className="card p-12 flex flex-col items-center gap-4 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
        <Icon size={24} className="text-brand-500" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
      </div>
      <button onClick={action} disabled={loading} className="btn-primary">
        {loading ? <Spinner size="sm" /> : <ChevronRight size={14} />}
        {actionLabel}
      </button>
    </div>
  )
}
