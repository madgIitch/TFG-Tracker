import {
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { SPRINT_NAMES } from '../../constants/sprints'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'
import { getSprintTTS } from './BudgetPanel'
import type { SprintRecord } from '../../types'

function avgQuality(s: SprintRecord): number | null {
  const vals = [s.uiUxQuality, s.architecturalCoherence, s.styleConsistency].filter(
    (v): v is number => v != null
  )
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

interface ScatterQualityChartProps {
  allSprints: SprintRecord[]
}

interface TooltipPayload {
  name: string
  value: number
  payload: { tts: number; quality: number; sprint: number; scenarioLabel: string }
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-md px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">
        S{d.sprint} — {SPRINT_NAMES[d.sprint]}
      </p>
      <p className="text-slate-400">{d.scenarioLabel}</p>
      <p className="text-slate-200 font-mono mt-1">TTS: {d.tts.toFixed(1)}h</p>
      <p className="text-slate-200 font-mono">Calidad: {d.quality.toFixed(2)} / 5</p>
    </div>
  )
}

export function ScatterQualityChart({ allSprints }: ScatterQualityChartProps) {
  const series = SCENARIO_DEFINITIONS.map((def) => {
    const sprints = allSprints.filter((s) => s.scenarioId === def.id)
    const data = sprints
      .map((s) => {
        const tts = getSprintTTS(s)
        const quality = avgQuality(s)
        if (tts == null || quality == null) return null
        return {
          tts,
          quality,
          sprint: s.sprintNumber,
          scenarioLabel: `${def.id} — ${def.label}`,
        }
      })
      .filter((d): d is NonNullable<typeof d> => d != null)
    return { def, data }
  })

  const hasData = series.some((s) => s.data.length > 0)

  return (
    <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
      <div>
        <p className="text-xs font-semibold text-slate-200">TTS vs Calidad por sprint</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Cada punto = un sprint. X = tiempo invertido (h), Y = calidad media (UI/UX + coherencia + consistencia).
          {' '}<span className="text-slate-400">Zona ideal: abajo-derecha (rápido y con calidad alta).</span>
        </p>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-600">
          Sin datos aún
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 8, right: 24, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
            <XAxis
              dataKey="tts"
              type="number"
              name="TTS"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
              label={{
                value: 'TTS (h)',
                position: 'insideBottom',
                offset: -12,
                fill: '#475569',
                fontSize: 10,
              }}
            />
            <YAxis
              dataKey="quality"
              type="number"
              name="Calidad"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
              label={{
                value: 'Calidad (1–5)',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fill: '#475569',
                fontSize: 10,
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, color: '#94a3b8', paddingTop: 8 }}
            />
            {series.map(({ def, data }) => (
              <Scatter
                key={def.id}
                name={`${def.id} — ${def.label}`}
                data={data}
                fill={def.accentColor}
                fillOpacity={0.75}
                r={5}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
