import { Select } from '../../ui/Select'
import { Input, NumericInput } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { SprintTimer } from '../SprintTimer'
import type { SprintRecord, SprintStatus } from '../../../types'
import { SPRINT_NAMES, SPRINT_SUMMARIES } from '../../../constants/sprints'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed', label: 'Completado' },
]

interface GeneralTabProps {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

export function GeneralTab({ data, onChange }: GeneralTabProps) {
  const timerKey = `${data.scenarioId}-${data.sprintNumber}`

  const initialFeatureSeconds = data.ttsFeature != null ? Math.round(data.ttsFeature * 3600) : 0
  const initialFixSeconds     = data.ttsFix     != null ? Math.round(data.ttsFix     * 3600) : 0

  const totalTTS = (data.ttsFeature ?? 0) + (data.ttsFix ?? 0)

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado */}
        <Select
          label="Estado"
          value={data.status}
          onChange={(e) => onChange('status', e.target.value as SprintStatus)}
          options={STATUS_OPTIONS}
        />

        {/* Funcionalidad objetivo (read-only) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Funcionalidad objetivo
          </label>
          <p className="bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-sm text-slate-300">
            {SPRINT_NAMES[data.sprintNumber] ?? `Sprint ${data.sprintNumber}`}
          </p>
        </div>
      </div>

      {/* Resumen del sprint */}
      {SPRINT_SUMMARIES[data.sprintNumber] && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Resumen — qué hay que hacer
          </label>
          <p className="bg-[#1a1f2e] border border-[#2e3650] rounded-md px-3 py-2.5 text-sm text-slate-300 leading-relaxed">
            {SPRINT_SUMMARIES[data.sprintNumber]}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha inicio */}
        <Input
          label="Fecha inicio"
          type="date"
          value={data.dateStart ?? ''}
          onChange={(e) => onChange('dateStart', e.target.value || null)}
        />

        {/* Fecha fin */}
        <Input
          label="Fecha fin"
          type="date"
          value={data.dateEnd ?? ''}
          onChange={(e) => onChange('dateEnd', e.target.value || null)}
        />
      </div>

      {/* TTS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            TTS — Tiempo de trabajo efectivo
          </span>
          <span className="text-xs font-mono text-slate-300 bg-[#1a1f2e] border border-[#2e3650] px-2 py-1 rounded">
            Total: {totalTTS > 0 ? `${totalTTS.toFixed(2)}h` : '—'}
          </span>
        </div>

        {/* Inputs manuales de desglose */}
        <div className="grid grid-cols-2 gap-3">
          <NumericInput
            label="✦ Feature (h)"
            value={data.ttsFeature}
            onChange={(v) => onChange('ttsFeature', v)}
            step={0.1}
            min={0}
            placeholder="0.0"
          />
          <NumericInput
            label="⚠ Corrección (h)"
            value={data.ttsFix}
            onChange={(v) => onChange('ttsFix', v)}
            step={0.1}
            min={0}
            placeholder="0.0"
          />
        </div>

        {/* Cronómetro único con selector de modo */}
        <SprintTimer
          timerKey={timerKey}
          initialFeatureSeconds={initialFeatureSeconds}
          initialFixSeconds={initialFixSeconds}
          onApply={(fh, xh) => {
            onChange('ttsFeature', fh)
            onChange('ttsFix', xh)
          }}
        />
      </div>

      {/* Descripción */}
      <Textarea
        label="Descripción / notas generales del sprint"
        rows={3}
        value={data.description}
        onChange={(e) => onChange('description', e.target.value)}
        placeholder="Resumen de lo que se implementó, incidencias generales…"
      />
    </div>
  )
}
