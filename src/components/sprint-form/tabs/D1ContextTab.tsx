import { CounterInput } from '../../ui/Input'
import { Select } from '../../ui/Select'
import type { SprintRecord, RetrievalMechanism } from '../../../types'
import { computeContextRatio } from '../../../utils/metrics'
import { formatPercent } from '../../../utils/formatting'

const RETRIEVAL_OPTIONS = [
  { value: 'indexado', label: 'Indexado (índice automático del IDE/IA)' },
  { value: 'RAG', label: 'RAG (Retrieval-Augmented Generation)' },
  { value: 'manual', label: 'Manual (adjuntos manuales de ficheros)' },
  { value: 'context window', label: 'Context window (pegado en el prompt)' },
]

const COHERENCE_LABELS: Record<number, string> = {
  1: 'Nula — necesitó todo el contexto explícito',
  2: 'Baja — guía frecuente necesaria',
  3: 'Parcial — inferencia correcta en algunos casos',
  4: 'Alta — infirió bien en la mayoría de casos',
  5: 'Total — coherente sin contexto explícito',
}

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

export function D1ContextTab({ data, onChange }: Props) {
  const ratio = computeContextRatio(data.filesReadByAI, data.filesTotalRepo)

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="p-3 bg-blue-900/20 border border-blue-800/40 rounded-md text-xs text-blue-300">
        <strong>D1 — Contexto efectivo:</strong> Qué parte del repositorio usa realmente la herramienta.
        Se mide como el ratio de ficheros accedidos por la IA frente al total del repositorio.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CounterInput
          label="Ficheros leídos por la IA"
          value={data.filesReadByAI}
          onChange={(v) => onChange('filesReadByAI', v)}
          hint="Ficheros que la IA consultó durante el sprint"
        />
        <CounterInput
          label="Total de ficheros en el repo"
          value={data.filesTotalRepo}
          onChange={(v) => onChange('filesTotalRepo', v)}
          hint="Total de ficheros del repositorio (git ls-files | wc -l)"
        />
      </div>

      <Select
        label="Mecanismo de retrieval"
        value={data.retrievalMechanism ?? ''}
        onChange={(e) => onChange('retrievalMechanism', (e.target.value || null) as RetrievalMechanism | null)}
        options={RETRIEVAL_OPTIONS}
        placeholder="— Seleccionar mecanismo —"
      />

      {ratio != null && (
        <div className="p-4 bg-[#252b3b] rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">D1a — Proporción del repo accedida</span>
            <span className="text-lg font-mono font-bold text-blue-400">{formatPercent(ratio)}</span>
          </div>
          <div className="h-2 bg-[#2e3650] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {data.filesReadByAI} operaciones de lectura sobre {data.filesTotalRepo} ficheros totales
          </p>
        </div>
      )}

      {/* D1b — Coherencia contextual */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-300">
            D1b — Coherencia contextual percibida
          </span>
          <p className="text-xs text-slate-500">
            ¿La IA demostró entender el contexto del proyecto sin que se lo indicaras explícitamente?
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange('contextCoherence', data.contextCoherence === v ? null : v)}
              title={COHERENCE_LABELS[v]}
              className={`flex-1 py-2 rounded-md border text-sm font-bold transition-colors ${
                data.contextCoherence === v
                  ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300'
                  : 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-cyan-700 hover:text-cyan-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {data.contextCoherence != null && (
          <p className="text-xs text-cyan-400/80">{COHERENCE_LABELS[data.contextCoherence]}</p>
        )}
      </div>
    </div>
  )
}
