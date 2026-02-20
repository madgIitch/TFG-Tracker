import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePromptEvaluationsBySprint, upsertPrompt, upsertEvaluation } from '../../../db/hooks/usePrompts'
import { formatScore } from '../../../utils/formatting'
import type { ScenarioId, PromptCategory } from '../../../types'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Button } from '../../ui/Button'

interface PromptEvaluationsTabProps {
  scenarioId: ScenarioId
  sprintNumber: number
}

const CATEGORIES: { value: PromptCategory; label: string; active: string; idle: string }[] = [
  { value: 'feature',    label: 'Feature',    active: 'bg-blue-900/60 border-blue-500 text-blue-300',   idle: 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-blue-700 hover:text-blue-400' },
  { value: 'corrective', label: 'Corrective', active: 'bg-red-900/60 border-red-500 text-red-300',     idle: 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-red-700 hover:text-red-400' },
  { value: 'debug',      label: 'Debug',      active: 'bg-yellow-900/60 border-yellow-500 text-yellow-300', idle: 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-yellow-700 hover:text-yellow-400' },
  { value: 'refactor',   label: 'Refactor',   active: 'bg-purple-900/60 border-purple-500 text-purple-300', idle: 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-purple-700 hover:text-purple-400' },
  { value: 'context',    label: 'Context',    active: 'bg-green-900/60 border-green-500 text-green-300', idle: 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-green-700 hover:text-green-400' },
]

const CATEGORY_BADGE: Record<PromptCategory, string> = {
  feature:    'text-blue-400',
  corrective: 'text-red-400',
  debug:      'text-yellow-400',
  refactor:   'text-purple-400',
  context:    'text-green-400',
}

function acceptedLabel(value: boolean | null): string {
  if (value === true) return 'Aceptada'
  if (value === false) return 'Rechazada'
  return '-'
}

function QuickAddPrompt({
  scenarioId,
  sprintNumber,
  onDone,
}: {
  scenarioId: ScenarioId
  sprintNumber: number
  onDone: () => void
}) {
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [category, setCategory] = useState<PromptCategory>('feature')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim())   { setError('El título es obligatorio.'); return }
    if (!content.trim()) { setError('El contenido es obligatorio.'); return }
    setSaving(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const promptId = await upsertPrompt({
        title: title.trim(),
        content: content.trim(),
        category,
        targetScenarios: [scenarioId],
        notes: '',
        createdAt: now,
        updatedAt: now,
      })
      await upsertEvaluation({
        promptId,
        scenarioId,
        sprintNumber,
        quality: null,
        wasAccepted: null,
        humanRevisions: null,
        notes: '',
        createdAt: now,
        updatedAt: now,
      })
      onDone()
    } catch (e) {
      setError('Error al guardar: ' + String(e))
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#131720] border border-blue-800/40 rounded-lg">
      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Nuevo prompt</p>
      <Input
        placeholder="Título del prompt…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {/* Selector de categoría */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tipo</span>
        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex-1 py-1.5 rounded-md border text-xs font-semibold transition-colors ${category === cat.value ? cat.active : cat.idle}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        rows={3}
        placeholder="Texto exacto del prompt…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="font-mono text-xs"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={saving}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Crear y vincular'}
        </Button>
      </div>
    </div>
  )
}

export function PromptEvaluationsTab({ scenarioId, sprintNumber }: PromptEvaluationsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const evaluations = usePromptEvaluationsBySprint(scenarioId, sprintNumber)

  if (evaluations === undefined) {
    return <div className="p-5 text-sm text-slate-500">Cargando evaluaciones de prompts...</div>
  }

  const evaluatedCount = evaluations.filter(
    (item) => item.quality != null || item.wasAccepted != null
  ).length
  const totalHumanRevisions = evaluations.reduce((sum, item) => sum + (item.humanRevisions ?? 0), 0)

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Cabecera con stats y botón */}
      <div className="flex items-stretch gap-3">
        <div className="flex-1 bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4 flex flex-wrap gap-4">
          <Stat label="Prompts vinculados"     value={String(evaluations.length)} />
          <Stat label="Evaluaciones completas" value={String(evaluatedCount)} />
          <Stat label="Revisiones humanas"     value={totalHumanRevisions > 0 ? String(totalHumanRevisions) : '—'} />
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="shrink-0 flex items-center gap-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <span className="text-xl leading-none">+</span> Nuevo prompt
          </button>
        )}
      </div>

      {/* Formulario de creación rápida */}
      {showForm && (
        <QuickAddPrompt
          scenarioId={scenarioId}
          sprintNumber={sprintNumber}
          onDone={() => setShowForm(false)}
        />
      )}

      {/* Tabla */}
      {evaluations.length === 0 ? (
        !showForm && (
          <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4">
            <p className="text-sm text-slate-400">
              No hay prompts asociados al escenario {scenarioId} en el sprint {sprintNumber}.
            </p>
          </div>
        )
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2e3650]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#252b3b] border-b border-[#2e3650]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Prompt</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Calidad</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Resultado</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Rev. humanas</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Notas</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr key={`${item.promptId}-${item.scenarioId}`} className="border-b border-[#2e3650] last:border-0">
                  <td className="px-4 py-3 text-slate-200">
                    {item.prompt != null ? (
                      <Link to={`/prompts/${item.promptId}`} className="text-blue-400 hover:text-blue-300">
                        {item.prompt.title}
                      </Link>
                    ) : (
                      <span className="text-slate-500 italic">Prompt #{item.promptId} (eliminado)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.prompt?.category && (
                      <span className={`text-xs font-semibold capitalize ${CATEGORY_BADGE[item.prompt.category as PromptCategory]}`}>
                        {item.prompt.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">{formatScore(item.quality)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">{acceptedLabel(item.wasAccepted)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">
                    {item.humanRevisions != null ? item.humanRevisions : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{item.notes?.trim() ? item.notes : '-'}</td>
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
