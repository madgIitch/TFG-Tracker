import type { SprintRecord } from '../../types'
import { getSprintCompletionCount, getTotalTTS } from '../../utils/metrics'
import { formatHours } from '../../utils/formatting'

interface GlobalSummaryProps {
  sprints: SprintRecord[]
}

export function GlobalSummary({ sprints }: GlobalSummaryProps) {
  const completed = getSprintCompletionCount(sprints)
  const total = 68 // 4 × 17
  const inProgress = sprints.filter((s) => s.status === 'in_progress').length
  const totalTTS = getTotalTTS(sprints)
  const totalIncidences = sprints.reduce((a, s) => a + (s.incidences?.length ?? 0), 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <SummaryStat
        label="Sprints completados"
        value={`${completed} / ${total}`}
        sub={`${((completed / total) * 100).toFixed(0)}%`}
      />
      <SummaryStat label="En curso" value={String(inProgress)} sub="sprints activos" />
      <SummaryStat label="TTS acumulado" value={formatHours(totalTTS)} sub="todos los escenarios" />
      <SummaryStat label="Incidencias totales" value={String(totalIncidences)} sub="registradas" />
    </div>
  )
}

function SummaryStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4 flex flex-col gap-1">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold font-mono text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}
