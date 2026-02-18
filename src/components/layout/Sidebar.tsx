import { NavLink } from 'react-router-dom'
import { useAllSprints } from '../../db/hooks/useSprints'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'
import { getSprintCompletionCount } from '../../utils/metrics'
import type { ScenarioId } from '../../types'

const ACCENT: Record<string, string> = {
  blue:   'text-blue-400',
  green:  'text-green-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
}

const BADGE_BG: Record<string, string> = {
  blue:   'bg-blue-900/50 text-blue-300',
  green:  'bg-green-900/50 text-green-300',
  purple: 'bg-purple-900/50 text-purple-300',
  orange: 'bg-orange-900/50 text-orange-300',
}

export function Sidebar() {
  const allSprints = useAllSprints() ?? []

  function sprintCount(id: ScenarioId) {
    const s = allSprints.filter((sp) => sp.scenarioId === id)
    return `${getSprintCompletionCount(s)}/17`
  }

  const navBase =
    'flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors'
  const navInactive = 'text-slate-400 hover:text-slate-200 hover:bg-[#252b3b]'
  const navActive = 'text-slate-100 bg-[#252b3b]'

  return (
    <nav className="flex flex-col h-full py-4 px-3 gap-1">
      {/* Logo / título */}
      <div className="px-2 pb-4 mb-2 border-b border-[#2e3650]">
        <h1 className="text-base font-bold text-slate-100">TFG Tracker</h1>
        <p className="text-xs text-slate-500 mt-0.5">Experimento IA–IDE</p>
      </div>

      <NavLink
        to="/"
        end
        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
      >
        <span className="flex items-center gap-2">
          <span>📊</span> Dashboard
        </span>
      </NavLink>

      <NavLink
        to="/compare"
        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
      >
        <span className="flex items-center gap-2">
          <span>⚖️</span> Comparativa
        </span>
      </NavLink>

      <div className="mt-4 mb-1 px-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Escenarios
        </span>
      </div>

      {SCENARIO_DEFINITIONS.map((def) => (
        <NavLink
          key={def.id}
          to={`/scenario/${def.id}`}
          className={({ isActive }) =>
            `${navBase} ${isActive ? navActive : navInactive}`
          }
        >
          <span className={`flex items-center gap-2 font-medium ${ACCENT[def.colorClass]}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${BADGE_BG[def.colorClass]}`}
            >
              {def.id}
            </span>
            {def.label}
          </span>
          <span className={`text-xs font-mono ${BADGE_BG[def.colorClass]} px-1.5 py-0.5 rounded`}>
            {sprintCount(def.id)}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
