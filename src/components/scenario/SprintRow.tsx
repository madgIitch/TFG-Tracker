import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../ui/Badge'
import type { SprintRecord, ScenarioId } from '../../types'
import { SPRINT_NAMES } from '../../constants/sprints'
import { formatHours } from '../../utils/formatting'
import { downloadSprintImages } from '../../utils/imageDownload'
import { getSprintTTS } from '../compare/BudgetPanel'

interface SprintRowProps {
  scenarioId: ScenarioId
  sprintNumber: number
  sprint: SprintRecord | undefined
}

export function SprintRow({ scenarioId, sprintNumber, sprint }: SprintRowProps) {
  const navigate = useNavigate()
  const status = sprint?.status ?? 'pending'
  const [downloading, setDownloading] = useState(false)

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    setDownloading(true)
    try {
      await downloadSprintImages(scenarioId, sprintNumber)
    } catch (err) {
      alert('Error al descargar imágenes: ' + String(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <tr
      className={`border-b border-[#2e3650] cursor-pointer transition-colors
        ${status === 'completed' ? 'hover:bg-green-900/10' : 'hover:bg-[#252b3b]'}`}
      onClick={() => navigate(`/scenario/${scenarioId}/sprint/${sprintNumber}`)}
    >
      <td className="px-4 py-3 font-mono text-xs text-slate-400">{sprintNumber}</td>
      <td className="px-4 py-3 text-sm text-slate-200">
        {SPRINT_NAMES[sprintNumber] ?? `Sprint ${sprintNumber}`}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-300">
        {sprint ? formatHours(getSprintTTS(sprint)) : '—'}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-300">
        {sprint?.commits != null ? sprint.commits : '—'}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-300">
        {sprint?.incidences?.length ?? 0}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          {sprint && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Descargar imágenes del sprint"
              className="text-xs text-slate-500 hover:text-blue-300 disabled:opacity-40 transition-colors"
            >
              {downloading ? '…' : '↓ imgs'}
            </button>
          )}
          <span className="text-xs text-blue-400 hover:text-blue-300">Editar →</span>
        </div>
      </td>
    </tr>
  )
}
