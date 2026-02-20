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
            <span className="text-sm text-slate-300">Proporción del repo accesible</span>
            <span className="text-lg font-mono font-bold text-blue-400">{formatPercent(ratio)}</span>
          </div>
          <div className="h-2 bg-[#2e3650] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {data.filesReadByAI} ficheros accedidos de {data.filesTotalRepo} totales
          </p>
        </div>
      )}
    </div>
  )
}
