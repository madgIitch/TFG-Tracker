import { NumericInput } from '../../ui/Input'
import type { SprintRecord } from '../../../types'
import { computeBuildSuccessRate } from '../../../utils/metrics'
import { formatPercent } from '../../../utils/formatting'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

export function D4OperationalTab({ data, onChange }: Props) {
  const buildRate = computeBuildSuccessRate(data.buildsOk, data.buildsTotal)

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="p-3 bg-orange-900/20 border border-orange-800/40 rounded-md text-xs text-orange-300">
        <strong>D4 — Éxito operacional:</strong> Tasa de builds exitosos y fallos de entorno.
        Se mide con expo start, tsc --noEmit y los resultados de Jest.
      </div>

      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Builds
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumericInput
            label="Builds exitosos"
            value={data.buildsOk}
            onChange={(v) => onChange('buildsOk', v)}
            min={0}
            placeholder="0"
            hint="expo start / tsc --noEmit sin errores"
          />
          <NumericInput
            label="Builds totales"
            value={data.buildsTotal}
            onChange={(v) => onChange('buildsTotal', v)}
            min={0}
            placeholder="0"
          />
        </div>

        {buildRate != null && (
          <div className="mt-3 p-4 bg-[#252b3b] rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Tasa de builds exitosos</span>
              <span className="text-lg font-mono font-bold text-orange-400">{formatPercent(buildRate)}</span>
            </div>
            <div className="h-2 bg-[#2e3650] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${buildRate * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Fallos de entorno
        </h4>
        <NumericInput
          label="Fallos de entorno"
          value={data.envFailures}
          onChange={(v) => onChange('envFailures', v)}
          min={0}
          placeholder="0"
          hint="Errores no atribuibles al código: dependencias rotas, configs, permisos, etc."
        />
      </section>
    </div>
  )
}
