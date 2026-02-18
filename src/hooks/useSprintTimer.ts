import { useState, useEffect, useRef, useCallback } from 'react'

interface SprintTimerState {
  elapsed: number // segundos acumulados
  running: boolean
  start: () => void
  pause: () => void
  reset: () => void
  setElapsed: (seconds: number) => void
  elapsedHours: number
}

export function useSprintTimer(initialSeconds = 0): SprintTimerState {
  const [elapsed, setElapsedState] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const baseElapsedRef = useRef(initialSeconds)

  // Sincronizar el valor inicial cuando cambia desde fuera (carga de BD)
  useEffect(() => {
    if (!running) {
      setElapsedState(initialSeconds)
      baseElapsedRef.current = initialSeconds
    }
  }, [initialSeconds, running])

  const start = useCallback(() => {
    if (running) return
    startTimeRef.current = Date.now()
    baseElapsedRef.current = elapsed
    setRunning(true)
  }, [running, elapsed])

  const pause = useCallback(() => {
    setRunning(false)
    startTimeRef.current = null
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    startTimeRef.current = null
    baseElapsedRef.current = 0
    setElapsedState(0)
  }, [])

  const setElapsed = useCallback((seconds: number) => {
    baseElapsedRef.current = seconds
    setElapsedState(seconds)
  }, [])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current == null) return
      const delta = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsedState(baseElapsedRef.current + delta)
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  return {
    elapsed,
    running,
    start,
    pause,
    reset,
    setElapsed,
    elapsedHours: elapsed / 3600,
  }
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
