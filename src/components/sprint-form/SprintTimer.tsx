import { useSprintTimer, formatElapsed } from '../../hooks/useSprintTimer'
import { Button } from '../ui/Button'

interface SprintTimerProps {
  initialSeconds: number
  onTimeChange: (hours: number) => void
}

export function SprintTimer({ initialSeconds, onTimeChange }: SprintTimerProps) {
  const { elapsed, running, start, pause, reset, elapsedHours } = useSprintTimer(initialSeconds)

  function handleStart() {
    start()
  }

  function handlePause() {
    pause()
    onTimeChange(Number(elapsedHours.toFixed(4)))
  }

  function handleReset() {
    reset()
    onTimeChange(0)
  }

  function handleApply() {
    pause()
    onTimeChange(Number(elapsedHours.toFixed(4)))
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-[#0f1117] border border-[#2e3650] rounded-lg">
      <p className="text-xs text-slate-500 uppercase tracking-wide">Cronómetro TTS</p>
      <p className="text-3xl font-mono font-bold text-slate-100 tracking-widest">
        {formatElapsed(elapsed)}
      </p>
      <p className="text-xs text-slate-400 font-mono">
        = {elapsedHours.toFixed(2)}h
      </p>
      <div className="flex gap-2">
        {!running ? (
          <Button variant="primary" size="sm" onClick={handleStart}>
            ▶ Iniciar
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={handlePause}>
            ⏸ Pausar
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleApply} disabled={elapsed === 0}>
          ✓ Aplicar al TTS
        </Button>
        <Button variant="danger" size="sm" onClick={handleReset} disabled={elapsed === 0}>
          ↺ Reset
        </Button>
      </div>
      <p className="text-xs text-slate-600 text-center max-w-xs">
        Pulsa "Aplicar al TTS" para guardar el tiempo en el campo TTS del sprint.
      </p>
    </div>
  )
}
