import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerContext } from '../../context/TimerContext'
import type { TimerMode } from '../../context/TimerContext'
import { formatElapsed } from '../../hooks/useSprintTimer'
import { SCENARIO_MAP } from '../../constants/scenarios'
import { SPRINT_NAMES } from '../../constants/sprints'
import type { ScenarioId } from '../../types'

interface ParsedKey {
  scenarioId: ScenarioId
  sprintNumber: number
}

function parseKey(key: string): ParsedKey | null {
  const parts = key.split('-')
  const scenarioId = parts[0]
  const sprintNumber = parseInt(parts[1], 10)
  if (!scenarioId || isNaN(sprintNumber)) return null
  // Ignore legacy suffixed keys
  if (parts[2] === 'feature' || parts[2] === 'fix') return null
  return { scenarioId: scenarioId as ScenarioId, sprintNumber }
}

const MODES: { value: TimerMode; label: string; activeStyle: string; idleStyle: string; color: string }[] = [
  {
    value: 'feature',
    label: '✦ Feature',
    activeStyle: 'bg-blue-900/50 border border-blue-600 text-blue-300',
    idleStyle: 'bg-slate-800 border border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-700',
    color: '#60a5fa',
  },
  {
    value: 'fix',
    label: '⚠ Corrección',
    activeStyle: 'bg-orange-900/50 border border-orange-600 text-orange-300',
    idleStyle: 'bg-slate-800 border border-slate-700 text-slate-500 hover:text-orange-400 hover:border-orange-700',
    color: '#fb923c',
  },
]

export function TimerWidget() {
  const { runningKeys, pauseTimer, getElapsed, getSegment, setSegmentMode } = useTimerContext()
  const navigate = useNavigate()
  const [, setTick] = useState(0)

  useEffect(() => {
    if (runningKeys.length === 0) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [runningKeys.length])

  const validRunningKeys = runningKeys.filter((k) => parseKey(k) !== null)

  if (validRunningKeys.length === 0) return null

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-[#2e3650]">
      {validRunningKeys.map((key) => {
        const parsed = parseKey(key)
        if (!parsed) return null
        const { scenarioId, sprintNumber } = parsed
        const def = SCENARIO_MAP[scenarioId]
        const sprintName = SPRINT_NAMES[sprintNumber] ?? `Sprint ${sprintNumber}`
        const elapsed = getElapsed(key)
        const seg = getSegment(key)
        const currentMode = seg?.currentMode ?? null
        const activeModeDef = MODES.find((m) => m.value === currentMode)
        const timerColor = activeModeDef?.color ?? def.accentColor

        return (
          <div
            key={key}
            className="flex flex-col gap-2 p-2.5 rounded-lg border"
            style={{ borderColor: `${def.accentColor}44`, backgroundColor: '#0f1117' }}
          >
            {/* Header */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: def.accentColor }}
              />
              <span className="text-[10px] font-semibold truncate" style={{ color: def.accentColor }}>
                Esc. {scenarioId} — {sprintName}
              </span>
            </div>

            {/* Selector de modo */}
            <div className="flex gap-1">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSegmentMode(key, m.value, getElapsed(key))}
                  className={`flex-1 text-[9px] font-semibold px-1 py-1 rounded transition-colors ${currentMode === m.value ? m.activeStyle : m.idleStyle}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Timer display */}
            <p className="text-xl font-mono font-bold tracking-widest text-center" style={{ color: timerColor }}>
              {formatElapsed(elapsed)}
            </p>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => pauseTimer(key)}
                className="flex-1 text-[10px] px-1.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              >
                ⏸ Pausar
              </button>
              <button
                onClick={() => navigate(`/scenario/${scenarioId}/sprint/${sprintNumber}`)}
                className="flex-1 text-[10px] px-1.5 py-1 rounded hover:opacity-80 text-white transition-opacity"
                style={{ backgroundColor: `${def.accentColor}99` }}
              >
                → Ir al sprint
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
