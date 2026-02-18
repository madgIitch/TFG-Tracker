import type { ScenarioId, AcceptanceChecklist, AcceptanceKey } from '../../types'
import { SPRINT_NAMES, SPRINT_NUMBERS } from '../../constants/sprints'
import { upsertScenario } from '../../db/hooks/useScenarios'
import type { ScenarioRecord } from '../../types'

interface AcceptanceChecklistProps {
  scenarioRecord: ScenarioRecord
}

const ACCEPTANCE_SPRINT_KEYS: { key: AcceptanceKey; label: string }[] = [
  ...SPRINT_NUMBERS.map((n) => ({
    key: `sprint${n}` as AcceptanceKey,
    label: `Sprint ${n}: ${SPRINT_NAMES[n]}`,
  })),
  { key: 'functionalParity', label: 'Paridad funcional con el Baseline' },
]

export function AcceptanceChecklistComponent({ scenarioRecord }: AcceptanceChecklistProps) {
  const checklist = scenarioRecord.acceptanceChecklist

  async function toggle(key: AcceptanceKey) {
    const updated: ScenarioRecord = {
      ...scenarioRecord,
      acceptanceChecklist: {
        ...checklist,
        [key]: !checklist[key],
      },
    }
    await upsertScenario(updated)
  }

  const checked = Object.values(checklist).filter(Boolean).length
  const total = ACCEPTANCE_SPRINT_KEYS.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Checklist de aceptación</h3>
        <span className="text-xs font-mono bg-[#252b3b] text-slate-300 px-2 py-0.5 rounded">
          {checked} / {total}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ACCEPTANCE_SPRINT_KEYS.map(({ key, label }) => (
          <label
            key={key}
            className={`flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors
              ${checklist[key] ? 'bg-green-900/20 border border-green-800/40' : 'bg-[#252b3b] border border-[#2e3650] hover:border-[#3d4b6e]'}`}
          >
            <input
              type="checkbox"
              checked={checklist[key] ?? false}
              onChange={() => toggle(key)}
              className="mt-0.5 accent-green-500 shrink-0"
            />
            <span className={`text-xs ${checklist[key] ? 'text-green-300' : 'text-slate-300'}`}>
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
