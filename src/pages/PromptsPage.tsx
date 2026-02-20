import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { PromptCard } from '../components/prompts/PromptCard'
import { PromptForm } from '../components/prompts/PromptForm'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { useAllPrompts, deletePrompt } from '../db/hooks/usePrompts'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { SCENARIO_DEFINITIONS } from '../constants/scenarios'
import type { PromptEvaluation, ScenarioId } from '../types'

export default function PromptsPage() {
  const navigate = useNavigate()
  const prompts = useAllPrompts()
  const evaluations = useLiveQuery(() => db.promptEvaluations.toArray(), [])
  const [creating, setCreating] = useState(false)
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioId[]>([])

  const evalMap = useMemo(() => {
    const grouped = new Map<number, PromptEvaluation[]>()
    for (const evaluation of evaluations ?? []) {
      const list = grouped.get(evaluation.promptId) ?? []
      list.push(evaluation)
      grouped.set(evaluation.promptId, list)
    }
    return grouped
  }, [evaluations])

  const filteredPrompts = useMemo(() => {
    if (!prompts) return []
    if (selectedScenarios.length === 0) return prompts
    return prompts.filter((p) =>
      selectedScenarios.some((s) => p.targetScenarios.includes(s))
    )
  }, [prompts, selectedScenarios])

  function toggleScenario(id: ScenarioId) {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  if (prompts === undefined || evaluations === undefined) return <LoadingScreen />

  return (
    <div className="flex flex-col flex-1">
      <TopBar crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Prompts' }]}>
        <Button variant={creating ? 'secondary' : 'primary'} size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cerrar formulario' : 'Nuevo prompt'}
        </Button>
      </TopBar>

      <div className="p-6 flex flex-col gap-5">
        {creating && (
          <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4">
            <PromptForm
              onSaved={(id) => navigate(`/prompts/${id}`)}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {/* Filtro por escenario */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 uppercase tracking-wide shrink-0">Escenario:</span>
          <div className="flex gap-2 flex-wrap">
            {SCENARIO_DEFINITIONS.map((def) => {
              const active = selectedScenarios.includes(def.id)
              return (
                <button
                  key={def.id}
                  onClick={() => toggleScenario(def.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                  style={
                    active
                      ? { backgroundColor: `${def.accentColor}20`, borderColor: def.accentColor, color: def.accentColor }
                      : { backgroundColor: 'transparent', borderColor: '#2e3650', color: '#64748b' }
                  }
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={
                      active
                        ? { backgroundColor: def.accentColor, color: '#0f1117' }
                        : { backgroundColor: '#2e3650', color: '#94a3b8' }
                    }
                  >
                    {def.id}
                  </span>
                  {def.label}
                </button>
              )
            })}
            {selectedScenarios.length > 0 && (
              <button
                onClick={() => setSelectedScenarios([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-1"
              >
                × Limpiar
              </button>
            )}
          </div>
          {selectedScenarios.length > 0 && (
            <span className="text-xs text-slate-500 ml-auto shrink-0">
              {filteredPrompts.length} de {prompts.length}
            </span>
          )}
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-6 text-center">
            <p className="text-slate-400 text-sm">
              {prompts.length === 0
                ? 'Aun no hay prompts guardados.'
                : 'Ningún prompt coincide con los escenarios seleccionados.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPrompts.map((prompt) => {
              if (prompt.id == null) return null
              return (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  evaluations={evalMap.get(prompt.id) ?? []}
                  onDelete={deletePrompt}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
