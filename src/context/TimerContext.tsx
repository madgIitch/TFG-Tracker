import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

export type TimerMode = 'feature' | 'fix'

// ── Timer state ──────────────────────────────────────────────────────────────

interface TimerState {
  baseElapsed: number
  startTimestamp: number | null
}

// ── Segment state (per-mode TTS tracking) ────────────────────────────────────

export interface SegmentState {
  featureSeconds: number   // committed feature seconds (closed segments)
  fixSeconds: number       // committed fix seconds (closed segments)
  currentMode: TimerMode | null
  modeStartElapsed: number // total elapsed when current mode was activated
}

// ── Context value ─────────────────────────────────────────────────────────────

interface TimerContextValue {
  // Timer controls
  initTimer: (key: string, seconds: number) => void
  startTimer: (key: string) => void
  pauseTimer: (key: string) => void
  resetTimer: (key: string) => void
  setTimerElapsed: (key: string, seconds: number) => void
  getElapsed: (key: string) => number
  isRunning: (key: string) => boolean
  hasTimer: (key: string) => boolean
  runningKeys: string[]

  // Segment (per-mode) controls
  initSegment: (key: string, featureSeconds: number, fixSeconds: number) => void
  forceInitSegment: (key: string, featureSeconds: number, fixSeconds: number) => void
  getSegment: (key: string) => SegmentState | null
  setSegmentMode: (key: string, newMode: TimerMode | null, currentElapsed: number) => void
  flushSegment: (key: string, currentElapsed: number) => { featureSeconds: number; fixSeconds: number }
  resetSegment: (key: string) => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

const STORAGE_KEY  = 'tfg-sprint-timers'
const SEGMENTS_KEY = 'tfg-tts-segments'

// ── Persistence helpers ───────────────────────────────────────────────────────

function loadTimers(): Record<string, TimerState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, TimerState>) : {}
  } catch { return {} }
}

function loadSegments(): Record<string, SegmentState> {
  try {
    const raw = localStorage.getItem(SEGMENTS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SegmentState>) : {}
  } catch { return {} }
}

function persistTimers(t: Record<string, TimerState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
}

function persistSegments(s: Record<string, SegmentState>) {
  localStorage.setItem(SEGMENTS_KEY, JSON.stringify(s))
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers,   setTimers]   = useState<Record<string, TimerState>>(loadTimers)
  const [segments, setSegments] = useState<Record<string, SegmentState>>(loadSegments)

  useEffect(() => { persistTimers(timers) },     [timers])
  useEffect(() => { persistSegments(segments) }, [segments])

  // ── Timer methods ────────────────────────────────────────────────────────

  const initTimer = useCallback((key: string, seconds: number) => {
    setTimers((prev) => {
      if (key in prev) return prev
      const next = { ...prev, [key]: { baseElapsed: seconds, startTimestamp: null } }
      persistTimers(next)
      return next
    })
  }, [])

  const startTimer = useCallback((key: string) => {
    setTimers((prev) => {
      const current = prev[key] ?? { baseElapsed: 0, startTimestamp: null }
      if (current.startTimestamp !== null) return prev
      const next = { ...prev, [key]: { baseElapsed: current.baseElapsed, startTimestamp: Date.now() } }
      persistTimers(next)
      return next
    })
  }, [])

  const pauseTimer = useCallback((key: string) => {
    setTimers((prev) => {
      const current = prev[key] ?? { baseElapsed: 0, startTimestamp: null }
      if (current.startTimestamp === null) return prev
      const elapsed = current.baseElapsed + Math.floor((Date.now() - current.startTimestamp) / 1000)
      const next = { ...prev, [key]: { baseElapsed: elapsed, startTimestamp: null } }
      persistTimers(next)
      return next
    })
  }, [])

  const resetTimer = useCallback((key: string) => {
    setTimers((prev) => {
      const next = { ...prev, [key]: { baseElapsed: 0, startTimestamp: null } }
      persistTimers(next)
      return next
    })
  }, [])

  const setTimerElapsed = useCallback((key: string, seconds: number) => {
    setTimers((prev) => {
      const current = prev[key] ?? { baseElapsed: 0, startTimestamp: null }
      const next = {
        ...prev,
        [key]: { baseElapsed: seconds, startTimestamp: current.startTimestamp !== null ? Date.now() : null },
      }
      persistTimers(next)
      return next
    })
  }, [])

  const getElapsed = useCallback(
    (key: string): number => {
      const timer = timers[key]
      if (!timer) return 0
      if (timer.startTimestamp !== null) {
        return timer.baseElapsed + Math.floor((Date.now() - timer.startTimestamp) / 1000)
      }
      return timer.baseElapsed
    },
    [timers],
  )

  const isRunning  = useCallback((key: string) => (timers[key]?.startTimestamp ?? null) !== null, [timers])
  const hasTimer   = useCallback((key: string) => key in timers, [timers])
  const runningKeys = useMemo(
    () => Object.entries(timers).filter(([, s]) => s.startTimestamp !== null).map(([k]) => k),
    [timers],
  )

  // ── Segment methods ──────────────────────────────────────────────────────

  const initSegment = useCallback((key: string, featureSeconds: number, fixSeconds: number) => {
    setSegments((prev) => {
      if (key in prev) return prev
      const total = featureSeconds + fixSeconds
      const next = {
        ...prev,
        [key]: { featureSeconds, fixSeconds, currentMode: null, modeStartElapsed: total } as SegmentState,
      }
      persistSegments(next)
      return next
    })
  }, [])

  const forceInitSegment = useCallback((key: string, featureSeconds: number, fixSeconds: number) => {
    setSegments((prev) => {
      const total = featureSeconds + fixSeconds
      const next = {
        ...prev,
        [key]: {
          featureSeconds,
          fixSeconds,
          currentMode: prev[key]?.currentMode ?? null,
          modeStartElapsed: total,
        } as SegmentState,
      }
      persistSegments(next)
      return next
    })
  }, [])

  const getSegment = useCallback(
    (key: string): SegmentState | null => segments[key] ?? null,
    [segments],
  )

  const setSegmentMode = useCallback(
    (key: string, newMode: TimerMode | null, currentElapsed: number) => {
      setSegments((prev) => {
        const old = prev[key] ?? { featureSeconds: 0, fixSeconds: 0, currentMode: null, modeStartElapsed: 0 }
        const addFeature = old.currentMode === 'feature' ? Math.max(0, currentElapsed - old.modeStartElapsed) : 0
        const addFix     = old.currentMode === 'fix'     ? Math.max(0, currentElapsed - old.modeStartElapsed) : 0
        const next = {
          ...prev,
          [key]: {
            featureSeconds: old.featureSeconds + addFeature,
            fixSeconds:     old.fixSeconds     + addFix,
            currentMode:    newMode,
            modeStartElapsed: currentElapsed,
          },
        }
        persistSegments(next)
        return next
      })
    },
    [],
  )

  const flushSegment = useCallback(
    (key: string, currentElapsed: number): { featureSeconds: number; fixSeconds: number } => {
      const old = segments[key] ?? { featureSeconds: 0, fixSeconds: 0, currentMode: null, modeStartElapsed: 0 }
      const featureFinal =
        old.featureSeconds + (old.currentMode === 'feature' ? Math.max(0, currentElapsed - old.modeStartElapsed) : 0)
      const fixFinal =
        old.fixSeconds + (old.currentMode === 'fix' ? Math.max(0, currentElapsed - old.modeStartElapsed) : 0)
      setSegments((prev) => {
        const next = {
          ...prev,
          [key]: { ...old, featureSeconds: featureFinal, fixSeconds: fixFinal, modeStartElapsed: currentElapsed },
        }
        persistSegments(next)
        return next
      })
      return { featureSeconds: featureFinal, fixSeconds: fixFinal }
    },
    [segments],
  )

  const resetSegment = useCallback((key: string) => {
    setSegments((prev) => {
      const old = prev[key]
      const next = {
        ...prev,
        [key]: { featureSeconds: 0, fixSeconds: 0, currentMode: old?.currentMode ?? null, modeStartElapsed: 0 },
      }
      persistSegments(next)
      return next
    })
  }, [])

  return (
    <TimerContext.Provider
      value={{
        initTimer, startTimer, pauseTimer, resetTimer, setTimerElapsed,
        getElapsed, isRunning, hasTimer, runningKeys,
        initSegment, forceInitSegment, getSegment, setSegmentMode, flushSegment, resetSegment,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimerContext must be used inside TimerProvider')
  return ctx
}
