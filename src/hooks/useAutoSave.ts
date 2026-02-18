import { useEffect, useRef, useState } from 'react'

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
}

export function useAutoSave<T>(
  value: T,
  saveFn: (v: T) => Promise<void>,
  delay = 1500
): AutoSaveState {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
  })

  const saveFnRef = useRef(saveFn)
  saveFnRef.current = saveFn

  const pendingRef = useRef<T | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    pendingRef.current = value

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (pendingRef.current == null) return
      setState((s) => ({ ...s, isSaving: true, error: null }))
      try {
        await saveFnRef.current(pendingRef.current)
        pendingRef.current = null
        setState({ isSaving: false, lastSaved: new Date(), error: null })
      } catch (err) {
        setState((s) => ({
          ...s,
          isSaving: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }))
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delay])

  // Flush al desmontar
  useEffect(() => {
    return () => {
      if (pendingRef.current != null) {
        saveFnRef.current(pendingRef.current).catch(() => {})
      }
    }
  }, [])

  return state
}
