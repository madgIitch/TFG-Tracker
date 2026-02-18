import { Link } from 'react-router-dom'
import { usePromptEvaluationsBySprint } from '../../../db/hooks/usePrompts'
import { formatScore } from '../../../utils/formatting'
import type { ScenarioId } from '../../../types'

interface PromptEvaluationsTabProps {
  scenarioId: ScenarioId
  sprintNumber: number
}

function acceptedLabel(value: boolean | null): string {
  if (value === true) return 'Aceptada'
  if (value === false) return 'Rechazada'
  return '-'
}

export function PromptEvaluationsTab({ scenarioId, sprintNumber }: PromptEvaluationsTabProps) {
  const evaluations = usePromptEvaluationsBySprint(scenarioId, sprintNumber)

  if (evaluations === undefined) {
    return <div className="p-5 text-sm text-slate-500">Cargando evaluaciones de prompts...</div>
  }

  const evaluatedCount = evaluations.filter(
    (item) => item.quality != null || item.wasAccepted != null
  ).length

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4 flex flex-wrap gap-4">
        <Stat label="Prompts vinculados" value={String(evaluations.length)} />
        <Stat label="Evaluaciones completas" value={String(evaluatedCount)} />
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4">
          <p className="text-sm text-slate-400">
            No hay evaluaciones de prompts asociadas al escenario {scenarioId} en el sprint {sprintNumber}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2e3650]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#252b3b] border-b border-[#2e3650]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Prompt
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Calidad
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Resultado
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr key={`${item.promptId}-${item.scenarioId}`} className="border-b border-[#2e3650]">
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
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {item.notes?.trim() ? item.notes : '-'}
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
    <div className="min-w-40">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold font-mono text-slate-100">{value}</p>
    </div>
  )
}
