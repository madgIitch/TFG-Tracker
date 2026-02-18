import { TopBar } from '../components/layout/TopBar'
import { ScenarioCard } from '../components/dashboard/ScenarioCard'
import { GlobalSummary } from '../components/dashboard/GlobalSummary'
import { LoadingScreen } from '../components/ui/Spinner'
import { useAllSprints } from '../db/hooks/useSprints'
import { SCENARIO_DEFINITIONS } from '../constants/scenarios'
import type { ScenarioId, SprintRecord } from '../types'

export default function DashboardPage() {
  const allSprints = useAllSprints()

  if (allSprints === undefined) return <LoadingScreen />

  function sprintsFor(id: ScenarioId): SprintRecord[] {
    return allSprints!.filter((s) => s.scenarioId === id)
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar crumbs={[{ label: 'Dashboard' }]} />
      <div className="p-6 flex flex-col gap-6 flex-1">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            Experimento Comparativo IA–IDE
          </h2>
          <p className="text-sm text-slate-400">
            Sprints 7–23 · 4 escenarios · 17 funcionalidades
          </p>
        </div>

        <GlobalSummary sprints={allSprints} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIO_DEFINITIONS.map((def) => (
            <ScenarioCard
              key={def.id}
              definition={def}
              sprints={sprintsFor(def.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
