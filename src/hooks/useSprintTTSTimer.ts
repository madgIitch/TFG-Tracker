import { useState, useEffect, useCallback } from 'react'
import { useTimerContext } from '../context/TimerContext'
import type { TimerMode } from '../context/TimerContext'

export type { TimerMode as TTSMode }

export function useSprintTTSTimer(
  timerKey: string,
  initialFeatureSeconds: number,
  initialFixSeconds: number,
) {
  const {
    initTimer, startTimer, pauseTimer, resetTimer, getElapsed, isRunning, hasTimer,
    initSegment, getSegment, setSegmentMode, flushSegment, resetSegment,
  } = useTimerContext()

  const [, setTick] = useState(0)
  const running = isRunning(timerKey)

  // Initialize timer and segments on mount
  useEffect(() => {
    if (!hasTimer(timerKey)) {
      initTimer(timerKey, initialFeatureSeconds + initialFixSeconds)
    }
    initSegment(timerKey, initialFeatureSeconds, initialFixSeconds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerKey])

  // Tick every second while running to keep display fresh
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  const currentElapsed = getElapsed(timerKey)
  const seg = getSegment(timerKey)

  const liveFeatureSeconds =
    (seg?.featureSeconds ?? initialFeatureSeconds) +
    (seg?.currentMode === 'feature' ? Math.max(0, currentElapsed - (seg?.modeStartElapsed ?? 0)) : 0)

  const liveFixSeconds =
    (seg?.fixSeconds ?? initialFixSeconds) +
    (seg?.currentMode === 'fix' ? Math.max(0, currentElapsed - (seg?.modeStartElapsed ?? 0)) : 0)

  const setMode = useCallback(
    (newMode: TimerMode | null) => {
      setSegmentMode(timerKey, newMode, getElapsed(timerKey))
    },
    [timerKey, setSegmentMode, getElapsed],
  )

  const apply = useCallback((): { featureHours: number; fixHours: number } => {
    const E = getElapsed(timerKey)
    pauseTimer(timerKey)
    const { featureSeconds, fixSeconds } = flushSegment(timerKey, E)
    return { featureHours: featureSeconds / 3600, fixHours: fixSeconds / 3600 }
  }, [timerKey, getElapsed, pauseTimer, flushSegment])

  const reset = useCallback(() => {
    resetTimer(timerKey)
    resetSegment(timerKey)
  }, [timerKey, resetTimer, resetSegment])

  return {
    mode: seg?.currentMode ?? null,
    setMode,
    liveFeatureSeconds,
    liveFixSeconds,
    totalElapsed: currentElapsed,
    running,
    start:  () => startTimer(timerKey),
    pause:  () => pauseTimer(timerKey),
    apply,
    reset,
  }
}
