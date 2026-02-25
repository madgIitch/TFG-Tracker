import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { SPRINT_NUMBERS, SPRINT_NAMES } from '../../constants/sprints'
import { SCENARIO_MAP } from '../../constants/scenarios'
import { computeAutonomyRatio } from '../../utils/metrics'
import { getSprintTTS } from '../compare/BudgetPanel'
import type { SprintRecord } from '../../types'
import type { ScenarioId } from '../../types'

interface ScenarioChartsProps {
  sprints: SprintRecord[]
  scenarioId: ScenarioId
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1a1f2e',
    border: '1px solid #2e3650',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: '#e2e8f0', fontSize: 12 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

function labelFormatter(label: string, payload: { payload?: { name?: string } }[]) {
  const d = payload?.[0]?.payload
  return d?.name ? `${label} — ${d.name}` : label
}

export function ScenarioCharts({ sprints, scenarioId }: ScenarioChartsProps) {
  const def = SCENARIO_MAP[scenarioId]
  const color = def.accentColor

  // ── Chart 1: TTS per sprint ────────────────────────────────────────────────
  const ttsData = SPRINT_NUMBERS.map((n) => {
    const s = sprints.find((x) => x.sprintNumber === n)
    return { label: `S${n}`, name: SPRINT_NAMES[n], tts: s ? getSprintTTS(s) : null }
  })
  const hasTTS = ttsData.some((d) => d.tts != null)

  // ── Chart 2: Quality scores per sprint ────────────────────────────────────
  const qualityData = SPRINT_NUMBERS.map((n) => {
    const s = sprints.find((x) => x.sprintNumber === n)
    return {
      label: `S${n}`,
      name: SPRINT_NAMES[n],
      uiux: s?.uiUxQuality ?? null,
      coherencia: s?.architecturalCoherence ?? null,
      consistencia: s?.styleConsistency ?? null,
    }
  })
  const hasQuality = qualityData.some(
    (d) => d.uiux != null || d.coherencia != null || d.consistencia != null
  )

  // ── Chart 3: Autonomy ratio per sprint ───────────────────────────────────
  const autonomyData = SPRINT_NUMBERS.map((n) => {
    const s = sprints.find((x) => x.sprintNumber === n)
    return {
      label: `S${n}`,
      name: SPRINT_NAMES[n],
      ratio: s ? computeAutonomyRatio(s.autonomousActions, s.controlCheckpoints) : null,
    }
  })
  const hasAutonomy = autonomyData.some((d) => d.ratio != null)

  return (
    <div className="flex flex-col gap-4">
      {/* ── TTS evolution ── */}
      <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-200">Evolución del TTS por sprint</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Tiempo de tarea (horas) sprint a sprint · menor = más eficiente
          </p>
        </div>
        {!hasTTS ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-600">
            Sin datos aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ttsData} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
                width={34}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={((v: number | null) => [v != null ? `${v.toFixed(1)}h` : '—', 'TTS']) as never}
                labelFormatter={labelFormatter as never}
              />
              <Line
                type="monotone"
                dataKey="tts"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                name="TTS"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Quality evolution ── */}
      <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-200">Evolución de calidad por sprint</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Scores 1–5 de UI/UX, coherencia arquitectónica y consistencia de estilos
          </p>
        </div>
        {!hasQuality ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-600">
            Sin datos aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={qualityData} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fill: '#475569', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={((v: number | null, name: string) => [
                  v != null ? `${v.toFixed(1)} / 5` : '—',
                  name,
                ]) as never}
                labelFormatter={labelFormatter as never}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="uiux"
                name="UI/UX"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="coherencia"
                name="Coherencia"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="consistencia"
                name="Consistencia"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ec4899', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Autonomy ratio ── */}
      <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-200">Ratio de autonomía por sprint</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Acciones autónomas / (autónomas + checkpoints) · 0% = control total, 100% = autonomía total
          </p>
        </div>
        {!hasAutonomy ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-600">
            Sin datos aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={autonomyData} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <defs>
                <linearGradient id={`autoGrad-${scenarioId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fill: '#475569', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                width={34}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={((v: number | null) => [
                  v != null ? `${(v * 100).toFixed(1)}%` : '—',
                  'Ratio autonomía',
                ]) as never}
                labelFormatter={labelFormatter as never}
              />
              <Area
                type="monotone"
                dataKey="ratio"
                stroke={color}
                strokeWidth={2}
                fill={`url(#autoGrad-${scenarioId})`}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                name="Ratio autonomía"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
