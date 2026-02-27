import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { PromptForm } from '../components/prompts/PromptForm'
import { EvaluationPanel } from '../components/prompts/EvaluationPanel'
import { ScenarioBadges } from '../components/prompts/ScenarioBadges'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { usePrompt, deletePrompt } from '../db/hooks/usePrompts'

const CATEGORY_LABELS: Record<string, string> = {
  feature:             'Feature',
  corrective:          'Corrective',
  debug:               'Debug',
  refactor:            'Refactor',
  context:             'Context',
  'context+feature':   'Context + Feature',
  'context+debug':     'Context + Debug',
  'corrective+feature': 'Corrective + Feature',
  'debug+refactor':    'Debug + Refactor',
  'context+refactor':  'Context + Refactor',
}

export default function PromptDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const promptId = Number(params.promptId)
  const prompt = usePrompt(promptId)
  const [editing, setEditing] = useState(false)

  if (!Number.isFinite(promptId) || promptId <= 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-400">ID de prompt invalido.</p>
        <Link to="/prompts" className="text-sm text-blue-400 hover:text-blue-300">
          Volver a prompts
        </Link>
      </div>
    )
  }

  if (prompt === undefined) return <LoadingScreen />

  if (prompt === null) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">No se encontro el prompt solicitado.</p>
        <Link to="/prompts" className="text-sm text-blue-400 hover:text-blue-300">
          Volver a prompts
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Prompts', to: '/prompts' },
          { label: prompt.title || `Prompt ${promptId}` },
        ]}
      >
        {!editing ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (!window.confirm('Eliminar este prompt y sus evaluaciones?')) return
                await deletePrompt(promptId)
                navigate('/prompts')
              }}
            >
              Eliminar
            </Button>
          </>
        ) : null}
      </TopBar>

      <div className="p-6 flex flex-col gap-5">
        {editing ? (
          <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4">
            <PromptForm
              initial={prompt}
              onSaved={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-100">{prompt.title}</h2>
              <span className="text-xs rounded px-2 py-1 bg-[#252b3b] text-slate-300">
                {CATEGORY_LABELS[prompt.category] ?? prompt.category}
              </span>
              <ScenarioBadges scenarioIds={prompt.targetScenarios} />
            </div>
            <div className="bg-[#111522] border border-[#2e3650] rounded-md p-3">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                {prompt.content}
              </pre>
            </div>
            {prompt.notes && (
              <p className="text-sm text-slate-400">
                <span className="text-slate-500">Notas:</span> {prompt.notes}
              </p>
            )}
          </div>
        )}

        <EvaluationPanel promptId={promptId} targetScenarios={prompt.targetScenarios} />
      </div>
    </div>
  )
}
