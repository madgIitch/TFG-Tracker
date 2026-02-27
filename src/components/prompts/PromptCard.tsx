import { useNavigate } from 'react-router-dom'
import { ScenarioBadges } from './ScenarioBadges'
import { Button } from '../ui/Button'
import type { PromptRecord, PromptEvaluation } from '../../types'

const CATEGORY_LABELS: Record<string, { label: string; cls: string }> = {
  feature:            { label: 'Feature',              cls: 'bg-blue-900/40 text-blue-300' },
  corrective:         { label: 'Corrective',           cls: 'bg-yellow-900/40 text-yellow-300' },
  debug:              { label: 'Debug',                cls: 'bg-red-900/40 text-red-300' },
  refactor:           { label: 'Refactor',             cls: 'bg-purple-900/40 text-purple-300' },
  context:            { label: 'Context',              cls: 'bg-slate-700 text-slate-300' },
  'context+feature':  { label: 'Context + Feature',   cls: 'bg-cyan-900/40 text-cyan-300' },
  'context+debug':    { label: 'Context + Debug',     cls: 'bg-orange-900/40 text-orange-300' },
  'corrective+feature': { label: 'Corrective + Feature', cls: 'bg-indigo-900/40 text-indigo-300' },
  'debug+refactor':   { label: 'Debug + Refactor',    cls: 'bg-rose-900/40 text-rose-300' },
  'context+refactor': { label: 'Context + Refactor',  cls: 'bg-teal-900/40 text-teal-300' },
}

interface PromptCardProps {
  prompt: PromptRecord
  evaluations: PromptEvaluation[]
  onDelete: (id: number) => void
}

export function PromptCard({ prompt, evaluations, onDelete }: PromptCardProps) {
  const navigate = useNavigate()
  const cat = CATEGORY_LABELS[prompt.category] ?? CATEGORY_LABELS.context
  const evalCount = evaluations.filter(
    (e) => e.quality != null || e.wasAccepted != null
  ).length

  return (
    <div
      className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4 flex flex-col gap-3 cursor-pointer hover:border-[#3d4b6e] transition-colors"
      onClick={() => navigate(`/prompts/${prompt.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{prompt.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cat.cls}`}>
              {cat.label}
            </span>
            <ScenarioBadges scenarioIds={prompt.targetScenarios} size="sm" />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('¿Eliminar este prompt y todas sus evaluaciones?')) {
              onDelete(prompt.id!)
            }
          }}
          className="shrink-0 text-slate-500 hover:text-red-400"
        >
          ✕
        </Button>
      </div>

      {/* Preview del contenido */}
      <p className="text-xs text-slate-500 font-mono line-clamp-2 leading-relaxed">
        {prompt.content || <span className="italic">Sin contenido</span>}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#2e3650]">
        <span className="text-xs text-slate-500">
          {evalCount} / {prompt.targetScenarios.length} evaluado{evalCount !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-blue-400">Ver detalle →</span>
      </div>
    </div>
  )
}
