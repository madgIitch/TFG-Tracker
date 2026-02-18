import { Input, NumericInput } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import type { Incidence, IncidenceType } from '../../../types'
import { formatMinutes } from '../../../utils/formatting'

const INCIDENCE_TYPE_OPTIONS = [
  { value: 'lógica', label: 'Lógica — Error en la lógica del código' },
  { value: 'tipado', label: 'Tipado — Error de tipos TypeScript' },
  { value: 'integración', label: 'Integración — Problema con APIs o servicios' },
  { value: 'alucinación', label: 'Alucinación — La IA inventó código/APIs inexistentes' },
  { value: 'entorno', label: 'Entorno — Dependencias, configs, permisos' },
]

interface IncidencesTabProps {
  incidences: Incidence[]
  onAdd: () => void
  onUpdate: (id: string, partial: Partial<Incidence>) => void
  onRemove: (id: string) => void
}

export function IncidencesTab({ incidences, onAdd, onUpdate, onRemove }: IncidencesTabProps) {
  const totalTime = incidences.reduce((a, i) => a + (i.resolutionTime ?? 0), 0)

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Incidencias</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {incidences.length} incidencia{incidences.length !== 1 ? 's' : ''}{' '}
            {totalTime > 0 ? `· ${formatMinutes(totalTime)} de resolución` : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onAdd}>
          + Añadir incidencia
        </Button>
      </div>

      {incidences.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">
          No hay incidencias registradas para este sprint.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {incidences.map((inc, idx) => (
          <div
            key={inc.id}
            className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-mono text-slate-500 mt-0.5">#{idx + 1}</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRemove(inc.id)}
                className="shrink-0"
              >
                ✕
              </Button>
            </div>

            <Input
              label="Descripción"
              value={inc.description}
              onChange={(e) => onUpdate(inc.id, { description: e.target.value })}
              placeholder="Descripción de la incidencia…"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Tipo"
                value={inc.type}
                onChange={(e) => onUpdate(inc.id, { type: e.target.value as IncidenceType })}
                options={INCIDENCE_TYPE_OPTIONS}
              />
              <NumericInput
                label="Tiempo de resolución (minutos)"
                value={inc.resolutionTime}
                onChange={(v) => onUpdate(inc.id, { resolutionTime: v })}
                min={0}
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
