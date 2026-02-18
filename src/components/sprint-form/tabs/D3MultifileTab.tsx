import { RangeSlider } from '../../ui/RangeSlider'
import type { SprintRecord } from '../../../types'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

const COHERENCE_LABELS: Record<number, string> = {
  1: 'Incoherente — Viola patrones y arquitectura del proyecto',
  2: 'Bajo — Algunos problemas de naming o imports',
  3: 'Aceptable — Cumple en general pero con desviaciones menores',
  4: 'Bueno — Respeta patrones, imports y naming del proyecto',
  5: 'Excelente — Coherencia total con la arquitectura del baseline',
}

export function D3MultifileTab({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="p-3 bg-purple-900/20 border border-purple-800/40 rounded-md text-xs text-purple-300">
        <strong>D3 — Edición multiarchivo y coherencia:</strong> Capacidad de modificar varios ficheros
        manteniendo coherencia arquitectónica. Se valora si la herramienta respeta patrones, imports y naming del proyecto.
      </div>

      <RangeSlider
        label="Coherencia arquitectónica (1–5)"
        value={data.architecturalCoherence}
        onChange={(v) => onChange('architecturalCoherence', v)}
        lowLabel="Incoherente"
        highLabel="Excelente"
        hint="Valora si el código generado respeta la estructura, imports y convenciones del proyecto"
      />

      {data.architecturalCoherence != null && (
        <div className="p-3 bg-[#252b3b] border border-[#2e3650] rounded-md">
          <p className="text-xs text-slate-300">
            <span className="font-mono text-purple-400 font-bold">
              {data.architecturalCoherence} / 5
            </span>
            {' — '}
            {COHERENCE_LABELS[data.architecturalCoherence]}
          </p>
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1 border-t border-[#2e3650] pt-4">
        <p className="font-medium text-slate-400 mb-2">Indicadores a evaluar:</p>
        <p>• ¿Respeta la estructura de carpetas del proyecto?</p>
        <p>• ¿Usa los patrones de imports existentes (alias, rutas relativas)?</p>
        <p>• ¿Sigue las convenciones de naming (camelCase, PascalCase, snake_case)?</p>
        <p>• ¿Los tipos TypeScript son coherentes con los del proyecto?</p>
        <p>• ¿La arquitectura de componentes/servicios es consistente?</p>
      </div>
    </div>
  )
}
