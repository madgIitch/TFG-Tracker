import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts'
import type { AggregatedScenarioMetrics } from '../../utils/aggregation'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'

interface CompareChartsProps {
  metrics: AggregatedScenarioMetrics[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function vals(
  metrics: AggregatedScenarioMetrics[],
  fn: (m: AggregatedScenarioMetrics) => number | null,
): (number | null)[] {
  return SCENARIO_DEFINITIONS.map((def) => {
    const m = metrics.find((x) => x.scenarioId === def.id)
    return m ? fn(m) : null
  })
}

function toBarData(
  values: (number | null)[],
): { name: string; value: number | null; color: string; label: string }[] {
  return SCENARIO_DEFINITIONS.map((def, i) => ({
    name: def.id,
    value: values[i],
    color: def.accentColor,
    label: def.label,
  }))
}

// Identify best/worst indexes for a list of values
function bestWorst(
  values: (number | null)[],
  higherIsBetter: boolean,
): { bestIdx: number | null; worstIdx: number | null } {
  const indexed = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null)
  if (indexed.length < 2) return { bestIdx: null, worstIdx: null }
  const sorted = [...indexed].sort((a, b) => higherIsBetter ? b.v - a.v : a.v - b.v)
  return { bestIdx: sorted[0].i, worstIdx: sorted[sorted.length - 1].i }
}

// ─── Themed tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label: _,
  formatValue,
}: {
  active?: boolean
  payload?: { value: number | null; payload: { label: string; color: string } }[]
  label?: string
  formatValue: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const { value, payload: { label, color } } = payload[0]
  return (
    <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-md px-3 py-2 text-xs shadow-xl">
      <p style={{ color }} className="font-bold mb-0.5">{label}</p>
      <p className="text-slate-200 font-mono">
        {value != null ? formatValue(value) : '—'}
      </p>
    </div>
  )
}

// ─── Single bar chart card ────────────────────────────────────────────────────

interface BarCardProps {
  title: string
  subtitle?: string
  values: (number | null)[]
  formatValue: (v: number) => string
  higherIsBetter?: boolean | null
  yDomain?: [number, number]
  yTickFormatter?: (v: number) => string
}

function BarCard({
  title,
  subtitle,
  values,
  formatValue,
  higherIsBetter,
  yDomain,
  yTickFormatter,
}: BarCardProps) {
  const data = toBarData(values)
  const defined = values.filter((v): v is number => v != null)

  const { bestIdx, worstIdx } =
    higherIsBetter != null && defined.length >= 2
      ? bestWorst(values, higherIsBetter)
      : { bestIdx: null, worstIdx: null }

  return (
    <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
      <div>
        <p className="text-xs font-semibold text-slate-200 leading-tight">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{subtitle}</p>
        )}
      </div>

      {defined.length === 0 ? (
        <div className="h-36 flex items-center justify-center text-xs text-slate-600">
          Sin datos aún
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 18, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: '#475569', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={yTickFormatter}
              width={36}
            />
            <Tooltip
              content={
                <CustomTooltip formatValue={formatValue} />
              }
              cursor={{ fill: '#1e2538' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((entry, i) => {
                const isBest = bestIdx === i
                const isWorst = worstIdx === i
                const fill = isBest ? '#22c55e' : isWorst ? '#ef4444' : entry.color
                return <Cell key={entry.name} fill={fill} fillOpacity={0.85} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Radar chart for a normalized overview ───────────────────────────────────

function OverviewRadar({ metrics }: { metrics: AggregatedScenarioMetrics[] }) {
  // 5 key normalized dimensions (0–1)
  const dimensions = [
    {
      key: 'Contexto',
      getValue: (m: AggregatedScenarioMetrics) => m.avgContextRatio,
      higherIsBetter: true,
    },
    {
      key: 'Autonomía',
      getValue: (m: AggregatedScenarioMetrics) => m.avgAutonomyRatio,
      higherIsBetter: null,
    },
    {
      key: 'Build OK',
      getValue: (m: AggregatedScenarioMetrics) => m.buildSuccessRate,
      higherIsBetter: true,
    },
    {
      key: 'Tests OK',
      getValue: (m: AggregatedScenarioMetrics) => m.testPassRate,
      higherIsBetter: true,
    },
    {
      key: 'Coherencia',
      getValue: (m: AggregatedScenarioMetrics) => m.avgArchitecturalCoherence != null
        ? m.avgArchitecturalCoherence / 5
        : null,
      higherIsBetter: true,
    },
    {
      key: 'Estilo',
      getValue: (m: AggregatedScenarioMetrics) => m.avgStyleConsistency != null
        ? m.avgStyleConsistency / 5
        : null,
      higherIsBetter: true,
    },
    {
      key: 'UI/UX',
      getValue: (m: AggregatedScenarioMetrics) => m.avgUiUxQuality != null
        ? m.avgUiUxQuality / 5
        : null,
      higherIsBetter: true,
    },
  ]

  // Build data: one object per dimension
  const data = dimensions.map(({ key, getValue }) => {
    const entry: Record<string, string | number | null> = { subject: key }
    SCENARIO_DEFINITIONS.forEach((def) => {
      const m = metrics.find((x) => x.scenarioId === def.id)
      entry[def.id] = m ? getValue(m) : null
    })
    return entry
  })

  const anyData = metrics.some((m) =>
    dimensions.some(({ getValue }) => getValue(m) != null)
  )

  return (
    <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
      <div>
        <p className="text-xs font-semibold text-slate-200">Radar — visión global (normalizado 0–1)</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Dimensiones clave normalizadas. Más superficie = mejor perfil general.
        </p>
      </div>

      {!anyData ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-600">
          Sin datos aún
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
            <PolarGrid stroke="#2e3650" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 1]}
              tick={{ fill: '#475569', fontSize: 8 }}
              tickCount={4}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
            {SCENARIO_DEFINITIONS.map((def) => (
              <Radar
                key={def.id}
                name={`${def.id} — ${def.label}`}
                dataKey={def.id}
                stroke={def.accentColor}
                fill={def.accentColor}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ r: 3, fill: def.accentColor }}
              />
            ))}
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, color: '#94a3b8' }}
            />
            <Tooltip
              formatter={(value, name) => [
                typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—',
                name,
              ]}
              contentStyle={{
                background: '#1a1f2e',
                border: '1px solid #2e3650',
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CompareCharts({ metrics }: CompareChartsProps) {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`
  const h = (v: number) => `${v.toFixed(1)}h`
  const n = (v: number) => String(Math.round(v))
  const score = (v: number) => `${v.toFixed(1)} / 5`

  const sections: { heading: string; cards: BarCardProps[] }[] = [
    {
      heading: 'D5 — Eficiencia total',
      cards: [
        {
          title: 'TTS total (h)',
          subtitle: 'Tiempo total de tarea · menor = mejor',
          values: vals(metrics, (m) => m.totalTTS),
          formatValue: h,
          higherIsBetter: false,
          yTickFormatter: (v) => `${v}h`,
        },
        {
          title: 'Tiempo verificación (h)',
          subtitle: 'TTS Fix acumulado · menor = mejor',
          values: vals(metrics, (m) => m.totalVerificationTime),
          formatValue: h,
          higherIsBetter: false,
          yTickFormatter: (v) => `${v}h`,
        },
        {
          title: 'Commits totales',
          subtitle: 'Iteraciones al repositorio',
          values: vals(metrics, (m) => m.totalCommits),
          formatValue: n,
          higherIsBetter: null,
        },
        {
          title: 'Ediciones manuales',
          subtitle: 'Líneas/bloques editados a mano · menor = mejor',
          values: vals(metrics, (m) => m.totalManualEdits),
          formatValue: n,
          higherIsBetter: false,
        },
        {
          title: 'Prompts correctivos',
          subtitle: 'Correcciones enviadas a la IA · menor = mejor',
          values: vals(metrics, (m) => m.totalCorrectivePrompts),
          formatValue: n,
          higherIsBetter: false,
        },
        {
          title: 'Propuestas rechazadas',
          subtitle: 'Diffs descartados · menor = mejor',
          values: vals(metrics, (m) => m.totalRejectedProposals),
          formatValue: n,
          higherIsBetter: false,
        },
      ],
    },
    {
      heading: 'D4 — Éxito operacional',
      cards: [
        {
          title: 'Tasa builds exitosos',
          subtitle: 'Mayor = mejor',
          values: vals(metrics, (m) => m.buildSuccessRate),
          formatValue: pct,
          higherIsBetter: true,
          yDomain: [0, 1],
          yTickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
        },
        {
          title: 'Tasa tests pass',
          subtitle: 'Mayor = mejor',
          values: vals(metrics, (m) => m.testPassRate),
          formatValue: pct,
          higherIsBetter: true,
          yDomain: [0, 1],
          yTickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
        },
        {
          title: 'Fallos de entorno',
          subtitle: 'Menor = mejor',
          values: vals(metrics, (m) => m.totalEnvFailures),
          formatValue: n,
          higherIsBetter: false,
        },
      ],
    },
    {
      heading: 'D6 — Calidad mantenible',
      cards: [
        {
          title: 'Calidad UI/UX (avg)',
          subtitle: '1–5 · mayor = mejor',
          values: vals(metrics, (m) => m.avgUiUxQuality),
          formatValue: score,
          higherIsBetter: true,
          yDomain: [0, 5],
        },
        {
          title: 'Consistencia estilos (avg)',
          subtitle: '1–5 · mayor = mejor',
          values: vals(metrics, (m) => m.avgStyleConsistency),
          formatValue: score,
          higherIsBetter: true,
          yDomain: [0, 5],
        },
        {
          title: 'TS warnings (total)',
          subtitle: 'Menor = mejor',
          values: vals(metrics, (m) => m.totalTsWarnings),
          formatValue: n,
          higherIsBetter: false,
        },
        {
          title: 'Linter warnings (total)',
          subtitle: 'Menor = mejor',
          values: vals(metrics, (m) => m.totalLinterWarnings),
          formatValue: n,
          higherIsBetter: false,
        },
      ],
    },
    {
      heading: 'D1 — Contexto efectivo',
      cards: [
        {
          title: 'Ratio contexto (avg)',
          subtitle: 'filesReadByAI / filesTotalRepo',
          values: vals(metrics, (m) => m.avgContextRatio),
          formatValue: pct,
          higherIsBetter: null,
          yDomain: [0, 1],
          yTickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
        },
      ],
    },
    {
      heading: 'D2 — Autonomía',
      cards: [
        {
          title: 'Ratio autonomía (avg)',
          subtitle: 'Acciones autónomas / total',
          values: vals(metrics, (m) => m.avgAutonomyRatio),
          formatValue: pct,
          higherIsBetter: null,
          yDomain: [0, 1],
          yTickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
        },
        {
          title: 'Acciones autónomas (total)',
          subtitle: 'Sin intervención humana',
          values: vals(metrics, (m) => m.totalAutonomousActions),
          formatValue: n,
          higherIsBetter: null,
        },
        {
          title: 'Puntos de control (total)',
          subtitle: 'Intervenciones del desarrollador',
          values: vals(metrics, (m) => m.totalControlCheckpoints),
          formatValue: n,
          higherIsBetter: null,
        },
      ],
    },
    {
      heading: 'D3 — Edición multiarchivo',
      cards: [
        {
          title: 'Coherencia arquitectónica (avg)',
          subtitle: '1–5 · mayor = mejor',
          values: vals(metrics, (m) => m.avgArchitecturalCoherence),
          formatValue: score,
          higherIsBetter: true,
          yDomain: [0, 5],
        },
        {
          title: 'Ficheros modificados (total)',
          subtitle: 'Ficheros cambiados por git diff',
          values: vals(metrics, (m) => m.totalFilesModified),
          formatValue: n,
          higherIsBetter: null,
        },
      ],
    },
    {
      heading: 'Incidencias',
      cards: [
        {
          title: 'Total incidencias',
          subtitle: 'Menor = mejor',
          values: vals(metrics, (m) => m.totalIncidences),
          formatValue: n,
          higherIsBetter: false,
        },
        {
          title: 'Tiempo resolución medio (min)',
          subtitle: 'Menor = mejor',
          values: vals(metrics, (m) => m.avgResolutionTime),
          formatValue: (v) => `${v.toFixed(0)}m`,
          higherIsBetter: false,
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-10">
      {/* Legend */}
      <div className="flex items-center gap-5 text-[11px] text-slate-400 flex-wrap">
        {SCENARIO_DEFINITIONS.map((def) => (
          <span key={def.id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: def.accentColor }}
            />
            <span style={{ color: def.accentColor }} className="font-bold">{def.id}</span>
            <span className="text-slate-500">— {def.label}</span>
          </span>
        ))}
        <span className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span>mejor</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span>peor</span>
          </span>
        </span>
      </div>

      {/* Radar overview */}
      <section>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-[#2e3650] pb-2">
          Visión global
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OverviewRadar metrics={metrics} />
          <BarCard
            title="Sprints completados"
            subtitle="De 17 planificados por escenario"
            values={vals(metrics, (m) => m.completedSprints)}
            formatValue={(v) => `${Math.round(v)} / 17`}
            higherIsBetter={true}
            yDomain={[0, 17]}
          />
        </div>
      </section>

      {/* Per-dimension bar chart sections */}
      {sections.map(({ heading, cards }) => (
        <section key={heading}>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-[#2e3650] pb-2">
            {heading}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <BarCard key={card.title} {...card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
