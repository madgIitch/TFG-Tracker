import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'
import type { SprintRecord } from '../../types'

export const BUDGET_PER_SCENARIO = 57.5
export const TOTAL_BUDGET = 230

export function getSprintTTS(s: SprintRecord): number | null {
  if (s.tts != null) return s.tts
  if (s.ttsFeature != null || s.ttsFix != null) {
    return (s.ttsFeature ?? 0) + (s.ttsFix ?? 0)
  }
  return null
}

interface BudgetPanelProps {
  allSprints: SprintRecord[]
}

export function BudgetPanel({ allSprints }: BudgetPanelProps) {
  const scenarioTTS: Record<string, number> = {}
  for (const def of SCENARIO_DEFINITIONS) {
    const sprints = allSprints.filter((s) => s.scenarioId === def.id)
    scenarioTTS[def.id] = sprints.reduce((acc, s) => acc + (getSprintTTS(s) ?? 0), 0)
  }

  const totalUsed = Object.values(scenarioTTS).reduce((a, b) => a + b, 0)
  const totalPct = Math.min(100, (totalUsed / TOTAL_BUDGET) * 100)

  return (
    <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Presupuesto de tiempo</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {BUDGET_PER_SCENARIO}h por escenario · {TOTAL_BUDGET}h total del experimento
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500 mb-0.5">Total consumido</p>
          <p className="text-base font-bold text-slate-100 leading-none">
            {totalUsed.toFixed(1)}h
            <span className="text-xs font-normal text-slate-500 ml-1">/ {TOTAL_BUDGET}h</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Restante: {Math.max(0, TOTAL_BUDGET - totalUsed).toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Per-scenario cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIO_DEFINITIONS.map((def) => {
          const used = scenarioTTS[def.id]
          const remaining = Math.max(0, BUDGET_PER_SCENARIO - used)
          const pct = Math.min(100, (used / BUDGET_PER_SCENARIO) * 100)
          const barColor =
            pct > 90 ? '#ef4444' : pct > 70 ? '#f97316' : def.accentColor

          return (
            <div
              key={def.id}
              className="bg-[#131720] border border-[#2e3650] rounded-lg p-3 flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="text-base font-bold font-mono"
                  style={{ color: def.accentColor }}
                >
                  {def.id}
                </span>
                <span className="text-[11px] text-slate-500 truncate">{def.model}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-200 font-mono font-semibold">
                  {used.toFixed(1)}h
                </span>
                <span className="text-slate-500">/ {BUDGET_PER_SCENARIO}h</span>
              </div>

              <div className="h-1.5 bg-[#2e3650] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">{pct.toFixed(0)}%</span>
                {remaining > 0 ? (
                  <span className="text-slate-400">Restante: {remaining.toFixed(1)}h</span>
                ) : (
                  <span className="text-red-400 font-medium">Presupuesto agotado</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total project bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Total del experimento</span>
          <span>
            {totalUsed.toFixed(1)}h / {TOTAL_BUDGET}h ({totalPct.toFixed(0)}%)
          </span>
        </div>
        <div className="h-2 bg-[#2e3650] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${totalPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
