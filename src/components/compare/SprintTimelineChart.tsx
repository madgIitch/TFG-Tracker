import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { SPRINT_NUMBERS, SPRINT_NAMES } from '../../constants/sprints'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'
import type { SprintRecord } from '../../types'
import { getSprintTTS, BUDGET_PER_SCENARIO } from './BudgetPanel'

const AVG_BUDGET_PER_SPRINT = BUDGET_PER_SCENARIO / SPRINT_NUMBERS.length // ≈ 3.38h

type ChartView = 'per-sprint' | 'cumulative' | 'delta' | 'burndown'

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

interface SprintTimelineChartProps {
  allSprints: SprintRecord[]
}

export function SprintTimelineChart({ allSprints }: SprintTimelineChartProps) {
  const [view, setView] = useState<ChartView>('per-sprint')

  // Build TTS lookup: scenarioId → sprintNumber → tts
  const lookup: Record<string, Record<number, number | null>> = {}
  for (const def of SCENARIO_DEFINITIONS) {
    lookup[def.id] = {}
    for (const n of SPRINT_NUMBERS) {
      const s = allSprints.find((x) => x.scenarioId === def.id && x.sprintNumber === n)
      lookup[def.id][n] = s ? getSprintTTS(s) : null
    }
  }

  // Per-sprint data
  const perSprintData = SPRINT_NUMBERS.map((n) => ({
    sprint: n,
    label: `S${n}`,
    name: SPRINT_NAMES[n],
    A: lookup['A'][n],
    B: lookup['B'][n],
    C: lookup['C'][n],
    D: lookup['D'][n],
  }))

  // Cumulative data — only extend when sprint has data
  const cum = { A: 0, B: 0, C: 0, D: 0 } as Record<string, number>
  const hasData = { A: false, B: false, C: false, D: false } as Record<string, boolean>
  const cumulativeData = SPRINT_NUMBERS.map((n) => {
    const point: Record<string, number | string | null> = {
      sprint: n,
      label: `S${n}`,
      name: SPRINT_NAMES[n],
    }
    for (const def of SCENARIO_DEFINITIONS) {
      const v = lookup[def.id][n]
      if (v != null) {
        cum[def.id] += v
        hasData[def.id] = true
      }
      point[def.id] = hasData[def.id] ? cum[def.id] : null
    }
    return point
  })

  // Burndown — remaining budget per sprint (57.5 - cumulativeTTS)
  const burndownData = SPRINT_NUMBERS.map((n, i) => {
    const point: Record<string, number | string | null> = {
      sprint: n,
      label: `S${n}`,
      name: SPRINT_NAMES[n],
      ideal: +(BUDGET_PER_SCENARIO - AVG_BUDGET_PER_SPRINT * (i + 1)).toFixed(2),
    }
    for (const def of SCENARIO_DEFINITIONS) {
      const cumVal = cumulativeData[i][def.id] as number | null
      point[def.id] = cumVal != null ? +(BUDGET_PER_SCENARIO - cumVal).toFixed(2) : null
    }
    return point
  })

  // Delta vs A — only when both A and the other scenario have a value
  const deltaData = SPRINT_NUMBERS.map((n) => {
    const base = lookup['A'][n]
    return {
      sprint: n,
      label: `S${n}`,
      name: SPRINT_NAMES[n],
      B: base != null && lookup['B'][n] != null ? +(lookup['B'][n]! - base).toFixed(2) : null,
      C: base != null && lookup['C'][n] != null ? +(lookup['C'][n]! - base).toFixed(2) : null,
      D: base != null && lookup['D'][n] != null ? +(lookup['D'][n]! - base).toFixed(2) : null,
    }
  })

  const scenarioDefs = SCENARIO_DEFINITIONS

  function formatHours(v: number) {
    return `${v.toFixed(1)}h`
  }

  return (
    <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-xl p-5 flex flex-col gap-4">
      {/* Header + toggle */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Tiempo por sprint</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            TTS (horas de trabajo efectivo) por sprint y escenario
          </p>
        </div>
        <div className="flex items-center bg-[#0f1117] border border-[#2e3650] rounded-lg p-1 gap-1">
          {(
            [
              { id: 'per-sprint', label: 'Por sprint' },
              { id: 'cumulative', label: 'Acumulado' },
              { id: 'delta', label: 'Δ vs A' },
              { id: 'burndown', label: 'Burndown' },
            ] as { id: ChartView; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setView(opt.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                view === opt.id
                  ? 'bg-[#252b3b] text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Per-sprint line chart ── */}
      {view === 'per-sprint' && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={perSprintData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#2e3650' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatHours}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={((value: number | null, name: string) =>
                value != null
                  ? [`${value.toFixed(1)}h`, `Escenario ${name}`]
                  : ['Sin datos', `Escenario ${name}`]
              ) as never}
              labelFormatter={(label, payload) => {
                const d = payload?.[0]?.payload
                return d ? `${label} — ${d.name}` : label
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(v) => `Escenario ${v}`}
            />
            <ReferenceLine
              y={AVG_BUDGET_PER_SPRINT}
              stroke="#475569"
              strokeDasharray="4 3"
              label={{
                value: `Presup. medio (${AVG_BUDGET_PER_SPRINT.toFixed(1)}h)`,
                fill: '#475569',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            {scenarioDefs.map((def) => (
              <Line
                key={def.id}
                type="monotone"
                dataKey={def.id}
                stroke={def.accentColor}
                strokeWidth={2}
                dot={{ r: 3, fill: def.accentColor, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                name={def.id}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* ── Cumulative line chart ── */}
      {view === 'cumulative' && (
        <>
          <p className="text-xs text-slate-500 -mt-1">
            TTS acumulado por escenario. La línea roja marca el límite de {BUDGET_PER_SCENARIO}h.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cumulativeData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#2e3650' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatHours}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={((value: number | null, name: string) =>
                  value != null
                    ? [`${value.toFixed(1)}h`, `Escenario ${name}`]
                    : ['Sin datos', `Escenario ${name}`]
                ) as never}
                labelFormatter={(label, payload) => {
                  const d = payload?.[0]?.payload
                  return d ? `${label} — ${d.name}` : label
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => `Escenario ${v}`}
              />
              <ReferenceLine
                y={BUDGET_PER_SCENARIO}
                stroke="#ef4444"
                strokeDasharray="4 3"
                label={{
                  value: `Límite ${BUDGET_PER_SCENARIO}h`,
                  fill: '#ef4444',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              {scenarioDefs.map((def) => (
                <Line
                  key={def.id}
                  type="monotone"
                  dataKey={def.id}
                  stroke={def.accentColor}
                  strokeWidth={2}
                  dot={{ r: 3, fill: def.accentColor, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  name={def.id}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* ── Delta vs A bar chart ── */}
      {view === 'delta' && (
        <>
          <p className="text-xs text-slate-500 -mt-1">
            Diferencia de horas respecto al baseline (A). <span className="text-green-400">Negativo = más rápido que A</span>,{' '}
            <span className="text-red-400">positivo = más lento</span>. Solo sprints con datos en A y en el escenario comparado.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deltaData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#2e3650' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}h`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={((value: number | null, name: string) => {
                  if (value == null) return ['Sin datos', `Escenario ${name}`]
                  const sign = value >= 0 ? '+' : ''
                  return [`${sign}${value.toFixed(1)}h`, `Escenario ${name}`]
                }) as never}
                labelFormatter={(label, payload) => {
                  const d = payload?.[0]?.payload
                  return d ? `${label} — ${d.name}` : label
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => `Escenario ${v}`}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              {(['B', 'C', 'D'] as const).map((id) => {
                const def = scenarioDefs.find((d) => d.id === id)!
                return (
                  <Bar
                    key={id}
                    dataKey={id}
                    fill={def.accentColor}
                    name={id}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
      {/* ── Burndown chart ── */}
      {view === 'burndown' && (
        <>
          <p className="text-xs text-slate-500 -mt-1">
            Horas restantes de presupuesto por escenario. La línea punteada gris es el ritmo ideal.{' '}
            <span className="text-green-400">Por encima de la ideal = más margen del esperado</span>,{' '}
            <span className="text-red-400">por debajo = ritmo más alto de lo planificado</span>.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={burndownData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#2e3650' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatHours}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={((value: number | null, name: string) => {
                  if (name === 'Ideal') return [value != null ? `${value.toFixed(1)}h` : '—', 'Ideal']
                  return value != null
                    ? [`${value.toFixed(1)}h restantes`, `Escenario ${name}`]
                    : ['Sin datos', `Escenario ${name}`]
                }) as never}
                labelFormatter={(label, payload) => {
                  const d = payload?.[0]?.payload
                  return d ? `${label} — ${d.name}` : label
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => (v === 'Ideal' ? 'Ideal' : `Escenario ${v}`)}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" />
              <Line
                type="monotone"
                dataKey="ideal"
                name="Ideal"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
              />
              {scenarioDefs.map((def) => (
                <Line
                  key={def.id}
                  type="monotone"
                  dataKey={def.id}
                  stroke={def.accentColor}
                  strokeWidth={2}
                  dot={{ r: 3, fill: def.accentColor, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  name={def.id}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
