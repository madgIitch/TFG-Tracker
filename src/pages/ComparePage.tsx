import { TopBar } from '../components/layout/TopBar'
import { CompareTable } from '../components/compare/CompareTable'
import { LoadingScreen } from '../components/ui/Spinner'
import { useAllSprints } from '../db/hooks/useSprints'
import { useAllScenarios } from '../db/hooks/useScenarios'
import { aggregateScenario } from '../utils/aggregation'
import type { ScenarioId } from '../types'

const SCENARIO_IDS: ScenarioId[] = ['A', 'B', 'C', 'D']

export default function ComparePage() {
  const allSprints = useAllSprints()
  const allScenarios = useAllScenarios()

  if (allSprints === undefined || allScenarios === undefined) return <LoadingScreen />

  const metrics = SCENARIO_IDS.map((id) => {
    const sprints = allSprints.filter((s) => s.scenarioId === id)
    return aggregateScenario(id, sprints)
  })

  return (
    <div className="flex flex-col flex-1">
      <TopBar crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Comparativa' }]} />

      <div className="p-6 flex flex-col gap-6 flex-1">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            Tabla comparativa — Escenarios A–D
          </h2>
          <p className="text-sm text-slate-400">
            Métricas agregadas de los 6 dimensiones del marco de evaluación.
            <span className="ml-3 text-green-400">■ Mejor</span>
            <span className="ml-2 text-red-400">■ Peor</span>
            <span className="ml-2 text-slate-500">(solo cuando hay ≥2 valores)</span>
          </p>
        </div>

        <CompareTable metrics={metrics} />
      </div>
    </div>
  )
}
