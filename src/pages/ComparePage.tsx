import { useState } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { CompareTable } from '../components/compare/CompareTable'
import { CompareCharts } from '../components/compare/CompareCharts'
import { BudgetPanel } from '../components/compare/BudgetPanel'
import { SprintTimelineChart } from '../components/compare/SprintTimelineChart'
import { ScatterQualityChart } from '../components/compare/ScatterQualityChart'
import { ScenarioEvolutionCharts } from '../components/compare/ScenarioEvolutionCharts'
import { LoadingScreen } from '../components/ui/Spinner'
import { useAllSprints } from '../db/hooks/useSprints'
import { useAllScenarios } from '../db/hooks/useScenarios'
import { aggregateScenario } from '../utils/aggregation'
import type { ScenarioId } from '../types'

const SCENARIO_IDS: ScenarioId[] = ['A', 'B', 'C', 'D']

type ViewMode = 'table' | 'charts'

export default function ComparePage() {
  const allSprints = useAllSprints()
  const allScenarios = useAllScenarios()
  const [view, setView] = useState<ViewMode>('charts')

  if (allSprints === undefined || allScenarios === undefined) return <LoadingScreen />

  const metrics = SCENARIO_IDS.map((id) => {
    const sprints = allSprints.filter((s) => s.scenarioId === id)
    return aggregateScenario(id, sprints)
  })

  return (
    <div className="flex flex-col flex-1">
      <TopBar crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Comparativa' }]} />

      <div className="p-6 flex flex-col gap-6 flex-1">
        {/* Header + tab toggle */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-1">
              Comparativa — Escenarios A–D
            </h2>
            <p className="text-sm text-slate-400">
              Métricas agregadas de las 6 dimensiones del marco de evaluación.
            </p>
          </div>

          <div className="flex items-center bg-[#0f1117] border border-[#2e3650] rounded-lg p-1 gap-1">
            {(['charts', 'table'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  view === mode
                    ? 'bg-[#252b3b] text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {mode === 'charts' ? '📊 Gráficas' : '📋 Tabla'}
              </button>
            ))}
          </div>
        </div>

        {/* Budget + timeline — siempre visibles */}
        <BudgetPanel allSprints={allSprints} />
        <SprintTimelineChart allSprints={allSprints} />
        <ScatterQualityChart allSprints={allSprints} />

        {/* Evolución sprint a sprint — siempre visible */}
        <section className="bg-[#1a1f2e] border border-[#2e3650] rounded-xl p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Evolución sprint a sprint — A vs B vs C vs D</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              TTS, calidad media y ratio de autonomía por sprint para los 4 escenarios.
            </p>
          </div>
          <ScenarioEvolutionCharts allSprints={allSprints} />
        </section>

        {/* Metrics: charts or table */}
        {view === 'charts' ? (
          <CompareCharts metrics={metrics} />
        ) : (
          <>
            <div className="text-xs text-slate-500">
              <span className="text-green-400">■ Mejor</span>
              <span className="ml-3 text-red-400">■ Peor</span>
              <span className="ml-2">(solo cuando hay ≥2 valores)</span>
            </div>
            <CompareTable metrics={metrics} />
          </>
        )}
      </div>
    </div>
  )
}
