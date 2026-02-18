import { NumericInput } from '../../ui/Input'
import type { SprintRecord } from '../../../types'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

export function DerivedMetricsTab({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Iteraciones y tiempo
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Iteraciones = commits (read-only, derivado) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Iteraciones (= commits)
            </label>
            <p className="bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-sm font-mono text-slate-300">
              {data.commits ?? '—'}
            </p>
            <p className="text-xs text-slate-500">Derivado del campo Commits</p>
          </div>

          <NumericInput
            label="Tiempo de verificación (horas)"
            value={data.verificationTime}
            onChange={(v) => onChange('verificationTime', v)}
            step={0.1}
            min={0}
            placeholder="ej. 1.5"
            hint="Tiempo dedicado a ejecutar tests y depurar fallos"
          />
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Intervención humana
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumericInput
            label="Ediciones manuales"
            value={data.manualEdits}
            onChange={(v) => onChange('manualEdits', v)}
            min={0}
            placeholder="0"
            hint="Líneas/bloques editados a mano"
          />
          <NumericInput
            label="Prompts correctivos"
            value={data.correctivePrompts}
            onChange={(v) => onChange('correctivePrompts', v)}
            min={0}
            placeholder="0"
            hint="Prompts enviados para corregir propuestas incorrectas"
          />
          <NumericInput
            label="Propuestas rechazadas"
            value={data.rejectedProposals}
            onChange={(v) => onChange('rejectedProposals', v)}
            min={0}
            placeholder="0"
            hint="Propuestas de la IA descartadas completamente"
          />
        </div>
      </section>
    </div>
  )
}
