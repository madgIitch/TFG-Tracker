import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { SPRINT_NUMBERS, SPRINT_NAMES } from '../../constants/sprints'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'
import { computeAutonomyRatio } from '../../utils/metrics'
import { getSprintTTS } from './BudgetPanel'
import type { SprintRecord } from '../../types'

interface ScenarioEvolutionChartsProps {
  allSprints: SprintRecord[]
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

type DataPoint = Record<string, string | number | null>

function buildPerSprintData(
  lookup: Record<string, SprintRecord[]>,
  getValue: (s: SprintRecord) => number | null
): DataPoint[] {
  return SPRINT_NUMBERS.map((n) => {
    const point: DataPoint = { label: `S${n}`, name: SPRINT_NAMES[n] }
    for (const def of SCENARIO_DEFINITIONS) {
      const s = lookup[def.id].find((x) => x.sprintNumber === n)
      point[def.id] = s ? getValue(s) : null
    }
    return point
  })
}

function hasAnyData(data: DataPoint[]): boolean {
  return data.some((d) => SCENARIO_DEFINITIONS.some((def) => d[def.id] != null))
}

function labelFmt(label: string, payload: { payload?: { name?: string } }[]) {
  const d = payload?.[0]?.payload
  return d?.name ? `${label} — ${d.name}` : label
}

// ─── Shared line chart card ────────────────────────────────────────────────

interface LineCardProps {
  title: string
  subtitle: string
  data: DataPoint[]
  formatValue: (v: number) => string
  yDomain?: [number, number]
  yTicks?: number[]
  yTickFormatter?: (v: number) => string
}

function LineCard({ title, subtitle, data, formatValue, yDomain, yTicks, yTickFormatter }: LineCardProps) {
  const hasData = hasAnyData(data)
  return (
    <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
      <div>
        <p className="text-xs font-semibold text-slate-200">{title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {!hasData ? (
        <div className="h-52 flex items-center justify-center text-xs text-slate-600">Sin datos aún</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
              tick={{ fill: '#475569', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={yTickFormatter}
              width={34}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={((v: number | null, name: string) => [
                v != null ? formatValue(v) : '—',
                `Escenario ${name}`,
              ]) as never}
              labelFormatter={labelFmt as never}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(v) => `Escenario ${v}`} />
            {SCENARIO_DEFINITIONS.map((def) => (
              <Line
                key={def.id}
                type="monotone"
                dataKey={def.id}
                name={def.id}
                stroke={def.accentColor}
                strokeWidth={2}
                dot={{ r: 3, fill: def.accentColor, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ScenarioEvolutionCharts({ allSprints }: ScenarioEvolutionChartsProps) {
  const lookup = Object.fromEntries(
    SCENARIO_DEFINITIONS.map((def) => [def.id, allSprints.filter((s) => s.scenarioId === def.id)])
  ) as Record<string, SprintRecord[]>

  // Chart 1 — TTS
  const ttsData = buildPerSprintData(lookup, (s) => getSprintTTS(s))

  // Charts 2, 3, 4 — quality metrics (one chart per metric, mirroring ScenarioCharts)
  const uiuxData = buildPerSprintData(lookup, (s) => s.uiUxQuality ?? null)
  const coherenciaData = buildPerSprintData(lookup, (s) => s.architecturalCoherence ?? null)
  const consistenciaData = buildPerSprintData(lookup, (s) => s.styleConsistency ?? null)

  // Chart 5 — autonomy ratio
  const autonomyData = buildPerSprintData(lookup, (s) =>
    computeAutonomyRatio(s.autonomousActions, s.controlCheckpoints)
  )

  const hasAutonomy = hasAnyData(autonomyData)

  const qualityDomain: [number, number] = [1, 5]
  const qualityTicks = [1, 2, 3, 4, 5]
  const scoreFormatter = (v: number) => `${v.toFixed(1)} / 5`

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. TTS ── */}
      <LineCard
        title="Evolución del TTS por sprint"
        subtitle="Tiempo de tarea (horas) sprint a sprint · menor = más eficiente"
        data={ttsData}
        formatValue={(v) => `${v.toFixed(1)}h`}
        yTickFormatter={(v) => `${v}h`}
      />

      {/* ── 2–4. Calidad: tres gráficas independientes en grid ── */}
      <div>
        <p className="text-[10px] text-slate-500 mb-2 pl-1">
          Calidad (1–5) — cada métrica en su propia gráfica, con los 4 escenarios superpuestos
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LineCard
            title="UI/UX Quality"
            subtitle="Score 1–5 · mayor = mejor"
            data={uiuxData}
            formatValue={scoreFormatter}
            yDomain={qualityDomain}
            yTicks={qualityTicks}
          />
          <LineCard
            title="Coherencia arquitectónica"
            subtitle="Score 1–5 · mayor = mejor"
            data={coherenciaData}
            formatValue={scoreFormatter}
            yDomain={qualityDomain}
            yTicks={qualityTicks}
          />
          <LineCard
            title="Consistencia de estilos"
            subtitle="Score 1–5 · mayor = mejor"
            data={consistenciaData}
            formatValue={scoreFormatter}
            yDomain={qualityDomain}
            yTicks={qualityTicks}
          />
        </div>
      </div>

      {/* ── 5. Autonomy ratio ── */}
      <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-200">Ratio de autonomía por sprint</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Acciones autónomas / (autónomas + checkpoints) · 0% = control total, 100% = autonomía total
          </p>
        </div>
        {!hasAutonomy ? (
          <div className="h-52 flex items-center justify-center text-xs text-slate-600">Sin datos aún</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={autonomyData} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <defs>
                {SCENARIO_DEFINITIONS.map((def) => (
                  <linearGradient key={def.id} id={`autoGradEvol-${def.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={def.accentColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={def.accentColor} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
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
                formatter={((v: number | null, name: string) => [
                  v != null ? `${(v * 100).toFixed(1)}%` : '—',
                  `Escenario ${name}`,
                ]) as never}
                labelFormatter={labelFmt as never}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(v) => `Escenario ${v}`} />
              {SCENARIO_DEFINITIONS.map((def) => (
                <Area
                  key={def.id}
                  type="monotone"
                  dataKey={def.id}
                  name={def.id}
                  stroke={def.accentColor}
                  strokeWidth={2}
                  fill={`url(#autoGradEvol-${def.id})`}
                  dot={{ r: 3, fill: def.accentColor, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
