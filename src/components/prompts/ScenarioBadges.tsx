import type { ScenarioId } from '../../types'
import { SCENARIO_MAP } from '../../constants/scenarios'

const BG: Record<string, string> = {
  blue:   'bg-blue-900/50 text-blue-300 border border-blue-700/40',
  green:  'bg-green-900/50 text-green-300 border border-green-700/40',
  purple: 'bg-purple-900/50 text-purple-300 border border-purple-700/40',
  orange: 'bg-orange-900/50 text-orange-300 border border-orange-700/40',
}

interface ScenarioBadgesProps {
  scenarioIds: ScenarioId[]
  size?: 'sm' | 'md'
}

export function ScenarioBadges({ scenarioIds, size = 'md' }: ScenarioBadgesProps) {
  const dim = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
  return (
    <div className="flex items-center gap-1">
      {scenarioIds.map((id) => {
        const def = SCENARIO_MAP[id]
        return (
          <span
            key={id}
            title={def.label}
            className={`${dim} rounded-full flex items-center justify-center font-bold ${BG[def.colorClass]}`}
          >
            {id}
          </span>
        )
      })}
    </div>
  )
}
