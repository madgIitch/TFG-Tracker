import { CounterInput } from '../../ui/Input'
import type { SprintRecord } from '../../../types'
import { computeAutonomyRatio } from '../../../utils/metrics'
import { formatPercent } from '../../../utils/formatting'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

export function D2AutonomyTab({ data, onChange }: Props) {
  const ratio = computeAutonomyRatio(data.autonomousActions, data.controlCheckpoints)
  const total = (data.autonomousActions ?? 0) + (data.controlCheckpoints ?? 0)

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="p-3 bg-green-900/20 border border-green-800/40 rounded-md text-xs text-green-300">
        <strong>D2 — Autonomía vs. control:</strong> Grado de agencia del modelo y frecuencia de puntos de control.
        Ratio = Acciones autónomas / (Autónomas + Controladas)
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CounterInput
          label="Acciones autónomas"
          value={data.autonomousActions}
          onChange={(v) => onChange('autonomousActions', v)}
          hint="Ejecuciones de terminal, ediciones y planes sin aprobación previa"
        />
        <CounterInput
          label="Puntos de control (review/approval)"
          value={data.controlCheckpoints}
          onChange={(v) => onChange('controlCheckpoints', v)}
          hint="Veces que el desarrollador revisó/aprobó antes de que se aplicara un cambio"
        />
      </div>

      {ratio != null && (
        <div className="p-4 bg-[#252b3b] rounded-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Ratio de autonomía</span>
            <span className="text-lg font-mono font-bold text-green-400">{formatPercent(ratio)}</span>
          </div>
          <div className="relative h-3 bg-[#2e3650] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Control total (0%)</span>
            <span>Total: {total} acciones</span>
            <span>Autonomía total (100%)</span>
          </div>
        </div>
      )}
    </div>
  )
}
