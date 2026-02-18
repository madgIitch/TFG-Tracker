import { Select } from '../../ui/Select'
import { Input, NumericInput } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { SprintTimer } from '../SprintTimer'
import type { SprintRecord, SprintStatus } from '../../../types'
import { SPRINT_NAMES } from '../../../constants/sprints'

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
  const initialTimerSeconds = data.tts != null ? Math.round(data.tts * 3600) : 0

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
        <NumericInput
          label="TTS — Tiempo de trabajo efectivo (horas)"
          value={data.tts}
          onChange={(v) => onChange('tts', v)}
          step={0.1}
          min={0}
          placeholder="ej. 3.5"
          hint="Suma de tiempo de trabajo efectivo (sin interrupciones)"
        />

        <SprintTimer
          initialSeconds={initialTimerSeconds}
          onTimeChange={(h) => onChange('tts', h > 0 ? Number(h.toFixed(2)) : null)}
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
