import { useState } from 'react'
import type { SprintRecord, RetrievalMechanism } from '../../../types'
import { CounterInput, NumericInput } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { formatPercent } from '../../../utils/formatting'
import { computeContextRatio, computeAutonomyRatio, computeBuildSuccessRate } from '../../../utils/metrics'

const BASE_REPO_PATH_KEY = 'tfg-git-repo-path'
const DEFAULT_BASE_PATH  = 'C:\\Users\\peorr\\Desktop\\HomiTFG'

function getScenarioRepoPath(scenarioId: string): string {
  const base = localStorage.getItem(BASE_REPO_PATH_KEY) ?? DEFAULT_BASE_PATH
  return `${base}\\Escenario-${scenarioId}`
}

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

const RETRIEVAL_OPTIONS = [
  { value: 'indexado',       label: 'Indexado' },
  { value: 'RAG',            label: 'RAG' },
  { value: 'manual',         label: 'Manual' },
  { value: 'context window', label: 'Context window' },
  { value: 'mixto',          label: 'Mixto' },
]

const RETRIEVAL_HINTS: Record<string, string> = {
  indexado:         'La IA usa un índice precomputado (embeddings, BM25) para localizar fragmentos relevantes sin leer el repositorio completo.',
  RAG:              'Retrieval-Augmented Generation: recupera chunks del repo en tiempo real y los inyecta en el contexto antes de generar.',
  manual:           'El desarrollador selecciona y pega manualmente los ficheros o fragmentos relevantes en el prompt.',
  'context window': 'El repositorio completo (o grandes porciones) se incluye directamente en la ventana de contexto de la IA.',
  mixto:            'Combinación de varios mecanismos en el mismo sprint (p. ej. context window + selección manual).',
}

const COHERENCE_LABELS: Record<number, string> = {
  1: 'Incoherente', 2: 'Bajo', 3: 'Aceptable', 4: 'Bueno', 5: 'Excelente',
}
const CONSISTENCY_LABELS: Record<number, string> = {
  1: 'Muy inconsistente', 2: 'Inconsistente', 3: 'Aceptable', 4: 'Consistente', 5: 'Muy consistente',
}
const UIUX_LABELS: Record<number, string> = {
  1: 'Muy deficiente — Layout inutilizable', 2: 'Deficiente — Problemas visibles', 3: 'Aceptable — Funcional', 4: 'Buena — Coherente y usable', 5: 'Excelente — UI pulida',
}

function DimCard({ badge, badgeColor, title, description, children }: {
  badge: string
  badgeColor: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-[#131720] border border-[#2e3650] rounded-lg">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${badgeColor}`}>
            {badge}
          </span>
          <span className="text-xs text-slate-300 font-medium">{title}</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">{description}</p>
      </div>
      {children}
    </div>
  )
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#2e3650] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className={`text-xs font-mono font-semibold ${color.replace('bg-', 'text-')}`}>
        {formatPercent(value)}
      </span>
    </div>
  )
}

function ScaleButtons({ value, onChange, labels }: {
  value: number | null
  onChange: (v: number | null) => void
  labels: Record<number, string>
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? null : n)}
            title={labels[n]}
            className={`flex-1 h-8 rounded text-sm font-mono font-medium transition-colors
              ${value === n
                ? 'bg-blue-600 text-white'
                : 'bg-[#252b3b] text-slate-400 hover:bg-[#2e3650] border border-[#2e3650]'
              }`}
          >
            {n}
          </button>
        ))}
      </div>
      {value != null && (
        <p className="text-xs text-slate-400 text-center">{labels[value]}</p>
      )}
    </div>
  )
}

export function DimensionsTab({ data, onChange }: Props) {
  const [repoFilesLoading, setRepoFilesLoading] = useState(false)
  const [repoFilesError,   setRepoFilesError]   = useState<string | null>(null)

  async function handleFetchRepoFiles() {
    setRepoFilesLoading(true)
    setRepoFilesError(null)
    try {
      const res  = await fetch('/api/repo-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: getScenarioRepoPath(data.scenarioId) }),
      })
      const json = await res.json() as { count?: number; error?: string }
      if (!res.ok || json.error) { setRepoFilesError(json.error ?? 'Error'); return }
      onChange('filesTotalRepo', json.count ?? null)
    } catch (e) {
      setRepoFilesError(String(e))
    } finally {
      setRepoFilesLoading(false)
    }
  }

  const contextRatio  = computeContextRatio(data.filesReadByAI, data.filesTotalRepo)
  const autonomyRatio = computeAutonomyRatio(data.autonomousActions, data.controlCheckpoints)
  const buildsTotal   =
    data.buildsOk != null || data.buildsFailed != null
      ? (data.buildsOk ?? 0) + (data.buildsFailed ?? 0)
      : null
  const buildRate = computeBuildSuccessRate(data.buildsOk, buildsTotal)

  function handleBuildsOkChange(v: number | null) {
    onChange('buildsOk', v)
    const total = (v ?? 0) + (data.buildsFailed ?? 0)
    onChange('buildsTotal', v != null || data.buildsFailed != null ? total : null)
  }
  function handleBuildsFailedChange(v: number | null) {
    onChange('buildsFailed', v)
    const total = (data.buildsOk ?? 0) + (v ?? 0)
    onChange('buildsTotal', data.buildsOk != null || v != null ? total : null)
  }

  // Derivadas
  const autoCorrective     = data.autoCorrectivePrompts ?? 0
  const autoRejected       = data.autoRejectedProposals ?? 0
  const autoHumanRevisions = data.autoHumanRevisions ?? 0
  const manualCorrective     = Math.max((data.correctivePrompts ?? 0) - autoCorrective, 0)
  const manualRejected       = Math.max((data.rejectedProposals ?? 0) - autoRejected, 0)
  const manualHumanRevisions = Math.max((data.humanRevisions ?? 0) - autoHumanRevisions, 0)

  function handleCorrectiveChange(v: number | null) {
    const next = v == null ? (autoCorrective > 0 ? autoCorrective : null) : Math.max(v, autoCorrective)
    onChange('correctivePrompts', next)
  }
  function handleRejectedChange(v: number | null) {
    const next = v == null ? (autoRejected > 0 ? autoRejected : null) : Math.max(v, autoRejected)
    onChange('rejectedProposals', next)
  }
  function handleHumanRevisionsChange(v: number | null) {
    const next = v == null ? (autoHumanRevisions > 0 ? autoHumanRevisions : null) : Math.max(v, autoHumanRevisions)
    onChange('humanRevisions', next)
  }

  return (
    <div className="p-4 grid grid-cols-2 gap-4">

      {/* D1 — Contexto */}
      <DimCard
        badge="D1" badgeColor="text-blue-400 border-blue-800/60 bg-blue-900/10"
        title="Contexto efectivo"
        description="Qué porcentaje del repositorio accede realmente la IA. Ratio = ficheros leídos / total del repo."
      >
        <div className="grid grid-cols-2 gap-3">
          <CounterInput
            label="Ficheros leídos por IA"
            value={data.filesReadByAI}
            onChange={(v) => onChange('filesReadByAI', v)}
            hint="Ficheros que la IA abrió o consultó durante el sprint"
          />
          <div className="flex flex-col gap-1">
            <CounterInput
              label="Total ficheros repo"
              value={data.filesTotalRepo}
              onChange={(v) => onChange('filesTotalRepo', v)}
              hint={repoFilesError ? `✗ ${repoFilesError}` : `src/ + supabase/ de Escenario-${data.scenarioId}`}
            />
            <button
              type="button"
              onClick={handleFetchRepoFiles}
              disabled={repoFilesLoading}
              className="w-full py-1 rounded text-[10px] font-semibold bg-[#1a1f2e] border border-[#2e3650] text-slate-400 hover:border-blue-700 hover:text-blue-400 disabled:opacity-40 transition-colors"
            >
              {repoFilesLoading ? 'Contando…' : '⚡ Contar ficheros'}
            </button>
          </div>
        </div>
        <Select
          label="Mecanismo de retrieval"
          value={data.retrievalMechanism ?? ''}
          onChange={(e) => onChange('retrievalMechanism', (e.target.value || null) as RetrievalMechanism | null)}
          options={RETRIEVAL_OPTIONS}
          placeholder="— Seleccionar —"
          hint={data.retrievalMechanism ? RETRIEVAL_HINTS[data.retrievalMechanism] : undefined}
        />
        {contextRatio != null && <MiniBar value={contextRatio} color="bg-blue-500" />}
      </DimCard>

      {/* D2 — Autonomía */}
      <DimCard
        badge="D2" badgeColor="text-green-400 border-green-800/60 bg-green-900/10"
        title="Autonomía vs. control"
        description="Grado de agencia del modelo. Ratio = autónomas / (autónomas + controladas)."
      >
        <div className="grid grid-cols-2 gap-3">
          <CounterInput
            label="Acciones autónomas"
            value={data.autonomousActions}
            onChange={(v) => onChange('autonomousActions', v)}
            hint="Ejecuciones, ediciones o planes aplicados sin aprobación previa"
          />
          <CounterInput
            label="Puntos de control"
            value={data.controlCheckpoints}
            onChange={(v) => onChange('controlCheckpoints', v)}
            hint="Veces que revisaste y aprobaste antes de aplicar un cambio"
          />
        </div>
        {autonomyRatio != null && (
          <div className="flex flex-col gap-1">
            <MiniBar value={autonomyRatio} color="bg-green-500" />
            <p className="text-xs text-slate-500 text-right">
              {(data.autonomousActions ?? 0) + (data.controlCheckpoints ?? 0)} acciones totales
            </p>
          </div>
        )}
      </DimCard>

      {/* D3 — Multiarchivo */}
      <DimCard
        badge="D3" badgeColor="text-purple-400 border-purple-800/60 bg-purple-900/10"
        title="Edición multiarchivo"
        description="Si el código generado respeta estructura, imports, naming y patrones del proyecto al editar varios ficheros."
      >
        <ScaleButtons
          value={data.architecturalCoherence}
          onChange={(v) => onChange('architecturalCoherence', v)}
          labels={COHERENCE_LABELS}
        />
      </DimCard>

      {/* D6 — Calidad */}
      <DimCard
        badge="D6" badgeColor="text-slate-300 border-slate-600/60 bg-slate-700/20"
        title="Calidad mantenible"
        description="Advertencias de análisis estático al cierre del sprint y uniformidad de estilo del código generado."
      >
        <div className="grid grid-cols-2 gap-3">
          <CounterInput
            label="TS warnings / errors"
            value={data.tsWarnings}
            onChange={(v) => onChange('tsWarnings', v)}
            hint="tsc --noEmit 2>&1 | grep -c 'error TS'"
          />
          <CounterInput
            label="Linter warnings"
            value={data.linterWarnings}
            onChange={(v) => onChange('linterWarnings', v)}
            hint="eslint src/ --format json | jq '[.[].messages|length]|add'"
          />
        </div>
        <p className="text-[11px] text-slate-500">Naming, estructura de archivos y patrones de código uniformes</p>
        <ScaleButtons
          value={data.styleConsistency}
          onChange={(v) => onChange('styleConsistency', v)}
          labels={CONSISTENCY_LABELS}
        />
        <p className="text-[11px] text-slate-500 mt-1">Calidad UI/UX — resultado visual y usabilidad del sprint</p>
        <ScaleButtons
          value={data.uiUxQuality}
          onChange={(v) => onChange('uiUxQuality', v)}
          labels={UIUX_LABELS}
        />
      </DimCard>

      {/* IH — Intervención humana (ancho completo) */}
      <div className="col-span-2">
        <DimCard
          badge="IH" badgeColor="text-rose-400 border-rose-800/60 bg-rose-900/10"
          title="Intervención humana"
          description="Cuánto tuvo que intervenir el desarrollador para corregir, rechazar o reescribir propuestas de la IA."
        >
          <div className="grid grid-cols-4 gap-3">
            <CounterInput
              label="Ediciones manuales"
              value={data.manualEdits}
              onChange={(v) => onChange('manualEdits', v)}
              hint="Líneas/bloques editados a mano"
            />
            <CounterInput
              label="Diffs revisados"
              value={data.humanRevisions}
              onChange={handleHumanRevisionsChange}
              hint={`Auto (prompts): ${autoHumanRevisions} · Extra: ${manualHumanRevisions}`}
            />
            <CounterInput
              label="Prompts correctivos"
              value={data.correctivePrompts}
              onChange={handleCorrectiveChange}
              hint={`Auto: ${autoCorrective} · Extra: ${manualCorrective}`}
            />
            <CounterInput
              label="Propuestas rechazadas"
              value={data.rejectedProposals}
              onChange={handleRejectedChange}
              hint={`Auto: ${autoRejected} · Extra: ${manualRejected}`}
            />
          </div>
        </DimCard>
      </div>

      {/* Derivadas — Iteraciones */}
      <DimCard
        badge="IT" badgeColor="text-yellow-400 border-yellow-800/60 bg-yellow-900/10"
        title="Iteraciones y tiempo"
        description="Commits del sprint (iteraciones) y tiempo dedicado a verificar y depurar la salida de la IA."
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Iteraciones (= commits)</span>
          <p className="bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-sm font-mono text-slate-300">
            {data.commits ?? '—'}
          </p>
          <p className="text-xs text-slate-500">Derivado del campo Commits en General</p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tiempo de verificación (h)</span>
          <p className="bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-sm font-mono text-slate-300">
            {data.ttsFix != null ? `${data.ttsFix.toFixed(2)}h` : '—'}
          </p>
          <p className="text-xs text-slate-500">Derivado del tiempo ⚠ Corrección del cronómetro</p>
        </div>
      </DimCard>

      {/* D4 — Operacional */}
      <DimCard
        badge="D4" badgeColor="text-orange-400 border-orange-800/60 bg-orange-900/10"
        title="Éxito operacional"
        description="Tasa de compilaciones exitosas (expo start / tsc --noEmit) y errores de entorno no atribuibles al código."
      >
        <div className="grid grid-cols-1 gap-3">
          <CounterInput
            label="Builds exitosos"
            value={data.buildsOk}
            onChange={handleBuildsOkChange}
            hint="expo start / tsc --noEmit sin errores"
          />
          <CounterInput
            label="Builds fallidos"
            value={data.buildsFailed}
            onChange={handleBuildsFailedChange}
            hint="Intentos que terminaron con error de compilación"
          />
          <CounterInput
            label="Fallos de entorno"
            value={data.envFailures}
            onChange={(v) => onChange('envFailures', v)}
            hint="Dependencias rotas, configs incorrectas, permisos, etc."
          />
        </div>
        {buildRate != null && (
          <div className="flex items-center gap-3">
            <MiniBar value={buildRate} color="bg-orange-500" />
            {buildsTotal != null && (
              <span className="text-xs text-slate-500 shrink-0">{buildsTotal} builds totales</span>
            )}
          </div>
        )}
      </DimCard>

    </div>
  )
}
