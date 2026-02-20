import { useRef, useCallback, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

const BASE =
  'w-full bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50'

export function Input({ label, hint, error, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input id={inputId} className={`${BASE} ${error ? 'border-red-500' : ''} ${className}`} {...rest} />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// Input numérico especializado
interface NumericInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value: number | null
  onChange: (value: number | null) => void
}

export function NumericInput({ value, onChange, ...rest }: NumericInputProps) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : Number(v))
      }}
      {...rest}
    />
  )
}

// Contador con botones + / −
interface CounterInputProps {
  label?: string
  hint?: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
}

export function CounterInput({ label, hint, value, onChange, min = 0 }: CounterInputProps) {
  const current    = value ?? 0
  const currentRef = useRef(current)
  currentRef.current = current

  const holdTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (holdTimeout.current)  { clearTimeout(holdTimeout.current);   holdTimeout.current  = null }
    if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null }
  }, [])

  const doDecrement = useCallback(() => {
    const next = currentRef.current - 1
    if (next < min) return
    onChange(next === 0 && value === null ? null : next)
  }, [min, onChange, value])

  const doIncrement = useCallback(() => {
    onChange(currentRef.current + 1)
  }, [onChange])

  function startHold(action: () => void) {
    action()
    holdTimeout.current = setTimeout(() => {
      holdInterval.current = setInterval(action, 80)
    }, 400)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      )}
      <div className="flex items-center gap-0 rounded-md overflow-hidden border border-[#2e3650]">
        <button
          type="button"
          disabled={current <= min}
          onMouseDown={() => startHold(doDecrement)}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={() => startHold(doDecrement)}
          onTouchEnd={stop}
          className="px-4 py-2 bg-[#1e2436] text-slate-300 text-lg font-bold hover:bg-[#252b3b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
        >
          −
        </button>
        <span className="flex-1 text-center font-mono text-lg font-semibold text-slate-100 bg-[#252b3b] py-2 select-none">
          {current}
        </span>
        <button
          type="button"
          onMouseDown={() => startHold(doIncrement)}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={() => startHold(doIncrement)}
          onTouchEnd={stop}
          className="px-4 py-2 bg-[#1e2436] text-slate-300 text-lg font-bold hover:bg-[#252b3b] transition-colors select-none"
        >
          +
        </button>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
