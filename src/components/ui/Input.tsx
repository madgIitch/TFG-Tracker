import type { InputHTMLAttributes } from 'react'

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
