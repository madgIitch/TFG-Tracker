import { SprintRow } from './SprintRow'
import type { SprintRecord, ScenarioId } from '../../types'
import { SPRINT_NUMBERS } from '../../constants/sprints'

interface SprintTableProps {
  scenarioId: ScenarioId
  sprints: SprintRecord[]
}

export function SprintTable({ scenarioId, sprints }: SprintTableProps) {
  const sprintMap = new Map(sprints.map((s) => [s.sprintNumber, s]))

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2e3650]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#252b3b] border-b border-[#2e3650]">
            <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              #
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Funcionalidad
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Estado
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              TTS
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Commits
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Incid.
            </th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {SPRINT_NUMBERS.map((n) => (
            <SprintRow
              key={n}
              scenarioId={scenarioId}
              sprintNumber={n}
              sprint={sprintMap.get(n)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
