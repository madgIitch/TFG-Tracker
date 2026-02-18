import { useState } from 'react'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { upsertPrompt } from '../../db/hooks/usePrompts'
import type { PromptRecord, ScenarioId, PromptCategory } from '../../types'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'

const CATEGORY_OPTIONS = [
  { value: 'feature',    label: 'Feature — Pedir implementar una funcionalidad' },
  { value: 'corrective', label: 'Corrective — Corregir una respuesta incorrecta' },
  { value: 'debug',      label: 'Debug — Pedir ayuda con un bug' },
  { value: 'refactor',   label: 'Refactor — Pedir refactorización de código' },
  { value: 'context',    label: 'Context — Proporcionar contexto a la IA' },
]

const ALL_SCENARIOS: ScenarioId[] = ['A', 'B', 'C', 'D']

function emptyForm(): Omit<PromptRecord, 'createdAt' | 'updatedAt'> {
  return {
    title: '',
    content: '',
    category: 'feature',
    targetScenarios: ['A', 'B', 'C', 'D'],
    notes: '',
  }
}

interface PromptFormProps {
  initial?: PromptRecord
  onSaved: (id: number) => void
  onCancel: () => void
}

export function PromptForm({ initial, onSaved, onCancel }: PromptFormProps) {
  const [form, setForm] = useState<Omit<PromptRecord, 'createdAt' | 'updatedAt'>>(
    initial
      ? { id: initial.id, title: initial.title, content: initial.content,
          category: initial.category, targetScenarios: initial.targetScenarios,
          notes: initial.notes }
      : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleScenario(id: ScenarioId) {
    setForm((f) => {
      const has = f.targetScenarios.includes(id)
      const next = has
        ? f.targetScenarios.filter((s) => s !== id)
        : [...f.targetScenarios, id]
      // Ordenar siempre A→D
      return { ...f, targetScenarios: ALL_SCENARIOS.filter((s) => next.includes(s)) }
    })
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('El título es obligatorio.'); return }
    if (!form.content.trim()) { setError('El contenido del prompt es obligatorio.'); return }
    if (form.targetScenarios.length === 0) { setError('Selecciona al menos un escenario.'); return }
    setSaving(true)
    setError(null)
    try {
      const id = await upsertPrompt({
        ...form,
        createdAt: initial?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      onSaved(id)
    } catch (e) {
      setError('Error al guardar: ' + String(e))
      setSaving(false)
    }
  }

  const BADGE_BG: Record<string, string> = {
    blue:   'bg-blue-900/50 border-blue-700/50 text-blue-300',
    green:  'bg-green-900/50 border-green-700/50 text-green-300',
    purple: 'bg-purple-900/50 border-purple-700/50 text-purple-300',
    orange: 'bg-orange-900/50 border-orange-700/50 text-orange-300',
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Título"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Nombre descriptivo del prompt…"
      />

      <Textarea
        label="Contenido del prompt"
        rows={6}
        value={form.content}
        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        placeholder="Escribe aquí el texto exacto del prompt…"
        className="font-mono text-xs"
      />

      <Select
        label="Categoría"
        value={form.category}
        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PromptCategory }))}
        options={CATEGORY_OPTIONS}
      />

      {/* Escenarios objetivo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Escenarios objetivo
        </label>
        <div className="flex gap-2">
          {SCENARIO_DEFINITIONS.map((def) => {
            const selected = form.targetScenarios.includes(def.id)
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => toggleScenario(def.id)}
                className={`flex-1 py-2 rounded-md border text-sm font-bold transition-colors
                  ${selected
                    ? BADGE_BG[def.colorClass]
                    : 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-[#3d4b6e]'
                  }`}
                title={def.label}
              >
                {def.id}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-500">
          Selecciona los escenarios donde usarás / usaste este prompt.
        </p>
      </div>

      <Textarea
        label="Notas generales (opcional)"
        rows={2}
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Contexto, variantes probadas, observaciones…"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : initial ? 'Actualizar prompt' : 'Crear prompt'}
        </Button>
      </div>
    </div>
  )
}
