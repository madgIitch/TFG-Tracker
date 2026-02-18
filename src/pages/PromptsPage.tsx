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
import type { PromptEvaluation } from '../types'

export default function PromptsPage() {
  const navigate = useNavigate()
  const prompts = useAllPrompts()
  const evaluations = useLiveQuery(() => db.promptEvaluations.toArray(), [])
  const [creating, setCreating] = useState(false)

  const evalMap = useMemo(() => {
    const grouped = new Map<number, PromptEvaluation[]>()
    for (const evaluation of evaluations ?? []) {
      const list = grouped.get(evaluation.promptId) ?? []
      list.push(evaluation)
      grouped.set(evaluation.promptId, list)
    }
    return grouped
  }, [evaluations])

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

        {prompts.length === 0 ? (
          <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-6 text-center">
            <p className="text-slate-400 text-sm">Aun no hay prompts guardados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {prompts.map((prompt) => {
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
