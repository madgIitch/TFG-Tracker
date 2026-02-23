import { Textarea } from '../../ui/Textarea'
import { ImagePasteZone } from '../../ui/ImagePasteZone'
import type { SprintRecord } from '../../../types'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

export function ObservationsTab({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="text-xs text-slate-500">
        <p className="mb-1">Espacio libre para anotar:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Observaciones sobre la experiencia con la herramienta</li>
          <li>Comportamientos inesperados o destacables de la IA</li>
          <li>Notas sobre divergencias arquitectónicas respecto al baseline</li>
          <li>Cualquier detalle relevante no recogido en las métricas anteriores</li>
        </ul>
      </div>
      <Textarea
        label="Observaciones libres"
        rows={12}
        value={data.observations}
        onChange={(e) => onChange('observations', e.target.value)}
        placeholder="Escribe aquí tus notas sobre este sprint…"
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Capturas de pantalla
        </span>
        <ImagePasteZone
          entityType="sprint_observation"
          entityKey={`${data.scenarioId}_${data.sprintNumber}`}
        />
      </div>
    </div>
  )
}
