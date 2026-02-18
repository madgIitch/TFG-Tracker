import { useNavigate } from 'react-router-dom'
import { Card, CardBody } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { StatusBadge } from '../ui/Badge'
import type { SprintRecord } from '../../types'
import type { ScenarioDefinition } from '../../constants/scenarios'
import { getSprintCompletionCount, getTotalTTS } from '../../utils/metrics'
import { formatHours } from '../../utils/formatting'

const ACCENT_BORDER: Record<string, string> = {
  blue:   'border-t-blue-500',
  green:  'border-t-green-500',
  purple: 'border-t-purple-500',
  orange: 'border-t-orange-500',
}

const ACCENT_TEXT: Record<string, string> = {
  blue:   'text-blue-400',
  green:  'text-green-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
}

interface ScenarioCardProps {
  definition: ScenarioDefinition
  sprints: SprintRecord[]
}

export function ScenarioCard({ definition, sprints }: ScenarioCardProps) {
  const navigate = useNavigate()
  const completed = getSprintCompletionCount(sprints)
  const inProgress = sprints.filter((s) => s.status === 'in_progress').length
  const totalTTS = getTotalTTS(sprints)
  const totalCommits = sprints.reduce((a, s) => a + (s.commits ?? 0), 0)
  const totalIncidences = sprints.reduce((a, s) => a + (s.incidences?.length ?? 0), 0)

  const borderClass = ACCENT_BORDER[definition.colorClass] ?? 'border-t-slate-600'
  const textClass = ACCENT_TEXT[definition.colorClass] ?? 'text-slate-400'

  return (
    <Card
      className={`border-t-2 ${borderClass} cursor-pointer hover:border-[#3d4b6e] transition-all`}
      onClick={() => navigate(`/scenario/${definition.id}`)}
    >
      <CardBody className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-lg font-bold font-mono ${textClass}`}
              >
                {definition.id}
              </span>
              <span className="text-xs bg-[#252b3b] text-slate-400 px-2 py-0.5 rounded">
                {definition.role}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200">{definition.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {definition.model} · {definition.environment}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold font-mono ${textClass}`}>{completed}</p>
            <p className="text-xs text-slate-500">de 17 sprints</p>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar
          value={completed / 17}
          color={definition.accentColor}
          showPercent={true}
          label={inProgress > 0 ? `${inProgress} en curso` : undefined}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <Stat label="TTS Total" value={formatHours(totalTTS)} />
          <Stat label="Commits" value={totalCommits > 0 ? String(totalCommits) : '—'} />
          <Stat label="Incidencias" value={totalIncidences > 0 ? String(totalIncidences) : '—'} />
        </div>

        {/* Estado de sprints */}
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((i) => {
            const sprint = sprints.find((s) => s.sprintNumber === i + 6)
            const status = sprint?.status ?? 'pending'
            const color =
              status === 'completed'
                ? definition.accentColor
                : status === 'in_progress'
                ? '#ca8a04'
                : '#2e3650'
            return (
              <div
                key={i}
                title={`Sprint ${i + 6}: ${status}`}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-mono font-semibold text-slate-200">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
