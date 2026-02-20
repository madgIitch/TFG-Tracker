import { CounterInput } from '../../ui/Input'
import { RangeSlider } from '../../ui/RangeSlider'
import type { SprintRecord } from '../../../types'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

const CONSISTENCY_LABELS: Record<number, string> = {
  1: 'Muy inconsistente — Naming y estructura dispares',
  2: 'Inconsistente — Varias desviaciones notables',
  3: 'Aceptable — Sigue las convenciones en general',
  4: 'Consistente — Estilo uniforme con pocas excepciones',
  5: 'Muy consistente — Naming, estructura y patrones perfectamente uniformes',
}

export function D6QualityTab({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="p-3 bg-slate-700/40 border border-slate-600/40 rounded-md text-xs text-slate-300">
        <strong>D6 — Calidad mantenible:</strong> Warnings de análisis estático (TypeScript + ESLint)
        y consistencia de estilos. Se mide con{' '}
        <code className="bg-slate-800 px-1 rounded">tsc --noEmit</code> y{' '}
        <code className="bg-slate-800 px-1 rounded">eslint src/ --format json</code>.
      </div>

      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Análisis estático al cierre del sprint
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CounterInput
            label="TypeScript warnings / errors"
            value={data.tsWarnings}
            onChange={(v) => onChange('tsWarnings', v)}
            hint="tsc --noEmit 2>&1 | grep -c 'error TS'"
          />
          <CounterInput
            label="Linter warnings"
            value={data.linterWarnings}
            onChange={(v) => onChange('linterWarnings', v)}
            hint="eslint src/ --format json | jq '[.[].messages | length] | add'"
          />
        </div>
      </section>

      <section>
        <RangeSlider
          label="Consistencia de estilos (1–5)"
          value={data.styleConsistency}
          onChange={(v) => onChange('styleConsistency', v)}
          lowLabel="Inconsistente"
          highLabel="Uniforme"
          hint="Naming, estructura de archivos, patrones de código uniformes"
        />
        {data.styleConsistency != null && (
          <p className="text-xs text-slate-400 mt-2 ml-1">
            {CONSISTENCY_LABELS[data.styleConsistency]}
          </p>
        )}
      </section>
    </div>
  )
}
