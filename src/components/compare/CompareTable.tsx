import type { AggregatedScenarioMetrics } from '../../utils/aggregation'
import { formatPercent, formatScore, formatHours, formatNumber } from '../../utils/formatting'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'

interface CompareTableProps {
  metrics: AggregatedScenarioMetrics[]
}

type GetValue = (m: AggregatedScenarioMetrics) => number | null
type FormatFn = (v: number | null) => string
type HigherIsBetter = boolean

interface MetricRow {
  label: string
  getValue: GetValue
  format: FormatFn
  higherIsBetter: HigherIsBetter
}

const ROWS: { section: string; rows: MetricRow[] }[] = [
  {
    section: 'Progreso',
    rows: [
      {
        label: 'Sprints completados',
        getValue: (m) => m.completedSprints,
        format: (v) => v != null ? `${v} / 17` : '—',
        higherIsBetter: true,
      },
    ],
  },
  {
    section: 'D5 — Eficiencia total',
    rows: [
      {
        label: 'TTS total (h)',
        getValue: (m) => m.totalTTS,
        format: formatHours,
        higherIsBetter: false,
      },
      {
        label: 'Commits totales',
        getValue: (m) => m.totalCommits,
        format: formatNumber,
        higherIsBetter: false,
      },
      {
        label: 'Tiempo verificación (h)',
        getValue: (m) => m.totalVerificationTime,
        format: formatHours,
        higherIsBetter: false,
      },
    ],
  },
  {
    section: 'D4 — Éxito operacional',
    rows: [
      {
        label: 'Tasa de builds exitosos',
        getValue: (m) => m.buildSuccessRate,
        format: formatPercent,
        higherIsBetter: true,
      },
      {
        label: 'Tasa de tests pass',
        getValue: (m) => m.testPassRate,
        format: formatPercent,
        higherIsBetter: true,
      },
      {
        label: 'Fallos de entorno',
        getValue: (m) => m.totalEnvFailures,
        format: formatNumber,
        higherIsBetter: false,
      },
    ],
  },
  {
    section: 'D6 — Calidad mantenible',
    rows: [
      {
        label: 'TS warnings (total)',
        getValue: (m) => m.totalTsWarnings,
        format: formatNumber,
        higherIsBetter: false,
      },
      {
        label: 'Linter warnings (total)',
        getValue: (m) => m.totalLinterWarnings,
        format: formatNumber,
        higherIsBetter: false,
      },
      {
        label: 'Consistencia estilos (avg)',
        getValue: (m) => m.avgStyleConsistency,
        format: formatScore,
        higherIsBetter: true,
      },
      {
        label: 'Calidad UI/UX (avg)',
        getValue: (m) => m.avgUiUxQuality,
        format: formatScore,
        higherIsBetter: true,
      },
    ],
  },
  {
    section: 'D1 — Contexto efectivo',
    rows: [
      {
        label: 'D1a — Ratio acceso (avg)',
        getValue: (m) => m.avgContextRatio,
        format: formatPercent,
        higherIsBetter: null as unknown as boolean,
      },
      {
        label: 'D1b — Coherencia contextual (avg)',
        getValue: (m) => m.avgContextCoherence,
        format: formatScore,
        higherIsBetter: true,
      },
    ],
  },
  {
    section: 'D2 — Autonomía',
    rows: [
      {
        label: 'Ratio autonomía (avg)',
        getValue: (m) => m.avgAutonomyRatio,
        format: formatPercent,
        higherIsBetter: null as unknown as boolean,
      },
      {
        label: 'Acciones autónomas (total)',
        getValue: (m) => m.totalAutonomousActions,
        format: formatNumber,
        higherIsBetter: null as unknown as boolean,
      },
      {
        label: 'Puntos de control (total)',
        getValue: (m) => m.totalControlCheckpoints,
        format: formatNumber,
        higherIsBetter: null as unknown as boolean,
      },
    ],
  },
  {
    section: 'D3 — Edición multiarchivo',
    rows: [
      {
        label: 'Coherencia arquitectónica (avg)',
        getValue: (m) => m.avgArchitecturalCoherence,
        format: formatScore,
        higherIsBetter: true,
      },
      {
        label: 'Ficheros modificados (total)',
        getValue: (m) => m.totalFilesModified,
        format: formatNumber,
        higherIsBetter: null as unknown as boolean,
      },
    ],
  },
  {
    section: 'Intervención humana',
    rows: [
      {
        label: 'Ediciones manuales',
        getValue: (m) => m.totalManualEdits,
        format: formatNumber,
        higherIsBetter: false,
      },
      {
        label: 'Prompts correctivos',
        getValue: (m) => m.totalCorrectivePrompts,
        format: formatNumber,
        higherIsBetter: false,
      },
      {
        label: 'Propuestas rechazadas',
        getValue: (m) => m.totalRejectedProposals,
        format: formatNumber,
        higherIsBetter: false,
      },
    ],
  },
  {
    section: 'Incidencias',
    rows: [
      {
        label: 'Total incidencias',
        getValue: (m) => m.totalIncidences,
        format: formatNumber,
        higherIsBetter: false,
      },
    ],
  },
]

function getBestWorst(
  metrics: AggregatedScenarioMetrics[],
  getValue: GetValue,
  higherIsBetter: boolean | null
): { bestId: string | null; worstId: string | null } {
  if (higherIsBetter === null) return { bestId: null, worstId: null }
  const valid = metrics.filter((m) => getValue(m) != null)
  if (valid.length < 2) return { bestId: null, worstId: null }
  const sorted = [...valid].sort((a, b) => {
    const av = getValue(a)!
    const bv = getValue(b)!
    return higherIsBetter ? bv - av : av - bv
  })
  return { bestId: sorted[0].scenarioId, worstId: sorted[sorted.length - 1].scenarioId }
}

export function CompareTable({ metrics }: CompareTableProps) {
  const metricsMap = new Map(metrics.map((m) => [m.scenarioId, m]))

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2e3650]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#252b3b] border-b border-[#2e3650]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-56">
              Métrica
            </th>
            {SCENARIO_DEFINITIONS.map((def) => (
              <th key={def.id} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                <span style={{ color: def.accentColor }}>
                  {def.id} — {def.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ section, rows }) => (
            <>
              <tr key={section} className="bg-[#0f1117] border-b border-[#2e3650]">
                <td
                  colSpan={5}
                  className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest"
                >
                  {section}
                </td>
              </tr>
              {rows.map((row) => {
                const { bestId, worstId } = getBestWorst(metrics, row.getValue, row.higherIsBetter)
                return (
                  <tr
                    key={row.label}
                    className="border-b border-[#2e3650] hover:bg-[#252b3b] transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-400">{row.label}</td>
                    {SCENARIO_DEFINITIONS.map((def) => {
                      const m = metricsMap.get(def.id)
                      const value = m ? row.getValue(m) : null
                      const isBest = bestId === def.id
                      const isWorst = worstId === def.id
                      return (
                        <td
                          key={def.id}
                          className={`px-4 py-3 text-center font-mono text-sm font-medium transition-colors
                            ${isBest ? 'text-green-400 bg-green-900/10' : ''}
                            ${isWorst ? 'text-red-400 bg-red-900/10' : ''}
                            ${!isBest && !isWorst ? 'text-slate-200' : ''}`}
                        >
                          {row.format(value)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
