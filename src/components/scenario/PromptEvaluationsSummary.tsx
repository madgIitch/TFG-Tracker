import { Link } from 'react-router-dom'
import { usePromptEvaluationsByScenario } from '../../db/hooks/usePrompts'
import { formatScore } from '../../utils/formatting'
import type { ScenarioId } from '../../types'

interface PromptEvaluationsSummaryProps {
  scenarioId: ScenarioId
}

function acceptedLabel(value: boolean | null): string {
  if (value === true) return 'Aceptada'
  if (value === false) return 'Rechazada'
  return '-'
}

export function PromptEvaluationsSummary({ scenarioId }: PromptEvaluationsSummaryProps) {
  const evaluations = usePromptEvaluationsByScenario(scenarioId)

  if (evaluations === undefined) {
    return <p className="text-sm text-slate-500">Cargando evaluaciones de prompts...</p>
  }

  const linkedToSprints = evaluations.filter((e) => e.sprintNumber != null).length
  const avgQualityValues = evaluations
    .map((e) => e.quality)
    .filter((v): v is number => v != null)
  const avgQuality =
    avgQualityValues.length > 0
      ? avgQualityValues.reduce((a, b) => a + b, 0) / avgQualityValues.length
      : null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Evaluaciones de prompt" value={String(evaluations.length)} />
        <Stat label="Asociadas a sprint" value={String(linkedToSprints)} />
        <Stat label="Calidad media" value={formatScore(avgQuality)} />
        <Stat
          label="Aceptadas"
          value={String(evaluations.filter((e) => e.wasAccepted === true).length)}
        />
      </div>

      {evaluations.length === 0 ? (
        <p className="text-sm text-slate-400">
          Aun no hay evaluaciones de prompts para este escenario.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2e3650]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#252b3b] border-b border-[#2e3650]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Sprint
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Prompt
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Calidad
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr key={`${item.promptId}-${item.scenarioId}`} className="border-b border-[#2e3650]">
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">
                    {item.sprintNumber != null ? `Sprint ${item.sprintNumber}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    <Link to={`/prompts/${item.promptId}`} className="text-blue-400 hover:text-blue-300">
                      {item.prompt?.title ?? `Prompt #${item.promptId}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">
                    {formatScore(item.quality)}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">
                    {acceptedLabel(item.wasAccepted)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#252b3b] border border-[#2e3650] rounded-md p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-base font-semibold font-mono text-slate-100">{value}</p>
    </div>
  )
}
