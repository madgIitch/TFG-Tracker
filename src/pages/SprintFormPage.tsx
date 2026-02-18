import { useParams, Navigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { SprintFormShell } from '../components/sprint-form/SprintFormShell'
import { StatusBadge } from '../components/ui/Badge'
import { LoadingScreen } from '../components/ui/Spinner'
import { useSprint } from '../db/hooks/useSprints'
import { SCENARIO_MAP } from '../constants/scenarios'
import { SPRINT_NAMES } from '../constants/sprints'
import type { ScenarioId } from '../types'

const VALID_IDS: ScenarioId[] = ['A', 'B', 'C', 'D']
const VALID_SPRINTS = Array.from({ length: 17 }, (_, i) => i + 7)

export default function SprintFormPage() {
  const { id, sprintNumber: sprintParam } = useParams<{
    id: string
    sprintNumber: string
  }>()

  const sprintNumber = parseInt(sprintParam ?? '', 10)

  if (
    !id ||
    !VALID_IDS.includes(id as ScenarioId) ||
    isNaN(sprintNumber) ||
    !VALID_SPRINTS.includes(sprintNumber)
  ) {
    return <Navigate to="/" replace />
  }

  const scenarioId = id as ScenarioId
  const def = SCENARIO_MAP[scenarioId]
  const sprintRecord = useSprint(scenarioId, sprintNumber)

  // undefined = todavía cargando | null = cargado pero no existe aún en BD
  if (sprintRecord === undefined) return <LoadingScreen />

  const sprintName = SPRINT_NAMES[sprintNumber] ?? `Sprint ${sprintNumber}`
  const status = sprintRecord?.status ?? 'pending'

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: `Escenario ${scenarioId}`, to: `/scenario/${scenarioId}` },
          { label: `Sprint ${sprintNumber} — ${sprintName}` },
        ]}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${def.accentColor}33`, color: def.accentColor, border: `1px solid ${def.accentColor}66` }}
          >
            {scenarioId}
          </span>
        </div>
      </TopBar>

      <SprintFormShell
        scenarioId={scenarioId}
        sprintNumber={sprintNumber}
        initialRecord={sprintRecord}
      />
    </div>
  )
}
