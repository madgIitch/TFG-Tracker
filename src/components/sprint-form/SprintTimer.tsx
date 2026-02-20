import { useSprintTTSTimer } from '../../hooks/useSprintTTSTimer'
import { formatElapsed } from '../../hooks/useSprintTimer'
import { Button } from '../ui/Button'

interface SprintTimerProps {
  timerKey: string
  initialFeatureSeconds: number
  initialFixSeconds: number
  onApply: (featureHours: number | null, fixHours: number | null) => void
}

const MODES = [
  {
    value: 'feature' as const,
    label: '✦ Feature',
    active: 'bg-blue-900/50 border-blue-600 text-blue-300',
    idle: 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-blue-700 hover:text-blue-400',
  },
  {
    value: 'fix' as const,
    label: '⚠ Corrección',
    active: 'bg-orange-900/50 border-orange-600 text-orange-300',
    idle: 'bg-[#252b3b] border-[#2e3650] text-slate-500 hover:border-orange-700 hover:text-orange-400',
  },
]

export function SprintTimer({ timerKey, initialFeatureSeconds, initialFixSeconds, onApply }: SprintTimerProps) {
  const { mode, setMode, liveFeatureSeconds, liveFixSeconds, totalElapsed, running, start, pause, apply, reset } =
    useSprintTTSTimer(timerKey, initialFeatureSeconds, initialFixSeconds)

  function handleApply() {
    const { featureHours, fixHours } = apply()
    onApply(
      featureHours > 0 ? Number(featureHours.toFixed(2)) : null,
      fixHours > 0 ? Number(fixHours.toFixed(2)) : null,
    )
  }

  function handleReset() {
    reset()
    onApply(null, null)
  }

  const totalHours = totalElapsed / 3600

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-[#0f1117] border border-[#2e3650] rounded-lg">
      <p className="text-xs text-slate-500 uppercase tracking-wide">Cronómetro TTS</p>

      {/* Selector de modo */}
      <div className="flex gap-2 w-full">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(mode === m.value ? null : m.value)}
            className={`flex-1 py-1.5 rounded-md border text-xs font-semibold transition-colors ${mode === m.value ? m.active : m.idle}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Tiempo total */}
      <p className={`text-3xl font-mono font-bold tracking-widest ${running ? 'text-green-400' : 'text-slate-100'}`}>
        {formatElapsed(totalElapsed)}
      </p>
      <p className="text-xs text-slate-400 font-mono">= {totalHours.toFixed(2)}h total</p>

      {/* Desglose por modo */}
      <div className="flex gap-6 text-xs font-mono">
        <span className="text-blue-400">✦ {(liveFeatureSeconds / 3600).toFixed(2)}h</span>
        <span className="text-orange-400">⚠ {(liveFixSeconds / 3600).toFixed(2)}h</span>
      </div>

      {/* Controles */}
      <div className="flex gap-2">
        {!running ? (
          <Button variant="primary" size="sm" onClick={start}>
            ▶ Iniciar
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={pause}>
            ⏸ Pausar
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleApply} disabled={totalElapsed === 0}>
          ✓ Aplicar
        </Button>
        <Button variant="danger" size="sm" onClick={handleReset} disabled={totalElapsed === 0}>
          ↺ Reset
        </Button>
      </div>
    </div>
  )
}
