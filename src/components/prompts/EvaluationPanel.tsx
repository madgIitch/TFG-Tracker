import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RangeSlider } from '../ui/RangeSlider'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { usePromptEval, upsertEvaluation, deleteEvaluation } from '../../db/hooks/usePrompts'
import { SCENARIO_MAP } from '../../constants/scenarios'
import { SPRINT_NAMES, SPRINT_NUMBERS } from '../../constants/sprints'
import { formatScore } from '../../utils/formatting'
import type { ScenarioId, PromptEvaluation } from '../../types'

const SPRINT_OPTIONS = [
  { value: '', label: 'Sin sprint asociado' },
  ...SPRINT_NUMBERS.map((n) => ({ value: String(n), label: `Sprint ${n} - ${SPRINT_NAMES[n]}` })),
]

const ACCEPTED_OPTIONS = [
  { value: '', label: 'Sin evaluar' },
  { value: 'true', label: 'Aceptada' },
  { value: 'false', label: 'Rechazada' },
]

const ACCENT: Record<string, string> = {
  blue: 'border-t-blue-500',
  green: 'border-t-green-500',
  purple: 'border-t-purple-500',
  orange: 'border-t-orange-500',
}

const ACCENT_TEXT: Record<string, string> = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
}

interface EvalCardProps {
  promptId: number
  scenarioId: ScenarioId
}

function EvalCard({ promptId, scenarioId }: EvalCardProps) {
  const def = SCENARIO_MAP[scenarioId]
  const existing = usePromptEval(promptId, scenarioId)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<PromptEvaluation>>({})
  const [saving, setSaving] = useState(false)

  function openEdit() {
    setForm(
      existing
        ? {
            quality: existing.quality,
            wasAccepted: existing.wasAccepted,
            sprintNumber: existing.sprintNumber,
            notes: existing.notes,
          }
        : { quality: null, wasAccepted: null, sprintNumber: null, notes: '' }
    )
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    await upsertEvaluation({
      promptId,
      scenarioId,
      quality: form.quality ?? null,
      wasAccepted: form.wasAccepted ?? null,
      sprintNumber: form.sprintNumber ?? null,
      notes: form.notes ?? '',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    if (!window.confirm('Eliminar esta evaluacion?')) return
    await deleteEvaluation(promptId, scenarioId)
    setEditing(false)
  }

  const borderClass = ACCENT[def.colorClass] ?? 'border-t-slate-600'
  const textClass = ACCENT_TEXT[def.colorClass] ?? 'text-slate-400'

  return (
    <div className={`bg-[#1a1f2e] border border-[#2e3650] border-t-2 ${borderClass} rounded-lg p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-base font-bold font-mono ${textClass}`}>{scenarioId}</span>
          <span className="text-xs text-slate-500 ml-2">{def.label}</span>
        </div>
        {existing && !editing && (
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            x
          </Button>
        )}
      </div>

      {!editing && (
        <div className="flex flex-col gap-1.5">
          {existing ? (
            <>
              <Row label="Calidad" value={formatScore(existing.quality)} />
              <Row
                label="Aceptada"
                value={
                  existing.wasAccepted === true
                    ? 'Si'
                    : existing.wasAccepted === false
                      ? 'No'
                      : '-'
                }
              />
              <Row
                label="Sprint"
                value={
                  existing.sprintNumber
                    ? `Sprint ${existing.sprintNumber}`
                    : '-'
                }
              />
              {existing.sprintNumber != null && (
                <Link
                  to={`/scenario/${scenarioId}/sprint/${existing.sprintNumber}`}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Ver sprint asociado
                </Link>
              )}
              {existing.notes && (
                <p className="text-xs text-slate-400 mt-1 italic">{existing.notes}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 italic">Sin evaluar</p>
          )}
          <Button variant="secondary" size="sm" className="mt-1 w-full justify-center" onClick={openEdit}>
            {existing ? 'Editar' : 'Evaluar'}
          </Button>
        </div>
      )}

      {editing && (
        <div className="flex flex-col gap-3">
          <RangeSlider
            label="Calidad de la respuesta (1-5)"
            value={form.quality ?? null}
            onChange={(v) => setForm((f) => ({ ...f, quality: v }))}
            lowLabel="Mala"
            highLabel="Excelente"
          />

          <Select
            label="Fue aceptada?"
            value={form.wasAccepted === true ? 'true' : form.wasAccepted === false ? 'false' : ''}
            onChange={(e) => {
              const v = e.target.value
              setForm((f) => ({
                ...f,
                wasAccepted: v === 'true' ? true : v === 'false' ? false : null,
              }))
            }}
            options={ACCEPTED_OPTIONS}
          />

          <Select
            label="Sprint asociado"
            value={form.sprintNumber != null ? String(form.sprintNumber) : ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sprintNumber: e.target.value ? parseInt(e.target.value, 10) : null,
              }))
            }
            options={SPRINT_OPTIONS}
          />

          <Textarea
            label="Notas"
            rows={2}
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Observaciones sobre la respuesta..."
          />

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Cancelar
            </Button>
            {existing && (
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
                Borrar
              </Button>
            )}
            <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-mono text-slate-200">{value}</span>
    </div>
  )
}

interface EvaluationPanelProps {
  promptId: number
  targetScenarios: ScenarioId[]
}

export function EvaluationPanel({ promptId, targetScenarios }: EvaluationPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-200">
        Evaluaciones por escenario
        <span className="ml-2 text-xs text-slate-500 font-normal">({targetScenarios.join(', ')})</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {targetScenarios.map((scenarioId) => (
          <EvalCard key={scenarioId} promptId={promptId} scenarioId={scenarioId} />
        ))}
      </div>
    </div>
  )
}
