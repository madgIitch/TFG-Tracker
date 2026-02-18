import type { SprintStatus } from '../../types'

const STATUS_CONFIG: Record<SprintStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-slate-700 text-slate-300',
  },
  in_progress: {
    label: 'En curso',
    className: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
  },
  completed: {
    label: 'Completado',
    className: 'bg-green-900/60 text-green-300 border border-green-700/50',
  },
}

interface StatusBadgeProps {
  status: SprintStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.className} ${className}`}
    >
      {cfg.label}
    </span>
  )
}

interface ScenarioBadgeProps {
  id: string
  color: string
  className?: string
}

const COLOR_CLASSES: Record<string, string> = {
  blue:   'bg-blue-900/60 text-blue-300 border border-blue-700/50',
  green:  'bg-green-900/60 text-green-300 border border-green-700/50',
  purple: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
  orange: 'bg-orange-900/60 text-orange-300 border border-orange-700/50',
}

export function ScenarioBadge({ id, color, className = '' }: ScenarioBadgeProps) {
  const cls = COLOR_CLASSES[color] ?? 'bg-slate-700 text-slate-300'
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${cls} ${className}`}
    >
      {id}
    </span>
  )
}
