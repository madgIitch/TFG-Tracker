interface RangeSliderProps {
  label?: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  lowLabel?: string
  highLabel?: string
  hint?: string
}

export function RangeSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  lowLabel,
  highLabel,
  hint,
}: RangeSliderProps) {
  const marks = Array.from({ length: max - min + 1 }, (_, i) => i + min)

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        {lowLabel && <span className="text-xs text-slate-500 w-20 text-right shrink-0">{lowLabel}</span>}
        <div className="flex-1 flex items-center gap-1">
          {marks.map((mark) => (
            <button
              key={mark}
              type="button"
              onClick={() => onChange(mark === value ? null : mark)}
              className={`flex-1 h-8 rounded text-sm font-mono font-medium transition-colors
                ${value === mark
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#252b3b] text-slate-400 hover:bg-[#2e3650] border border-[#2e3650]'
                }`}
            >
              {mark}
            </button>
          ))}
        </div>
        {highLabel && <span className="text-xs text-slate-500 w-20 shrink-0">{highLabel}</span>}
      </div>
      {value != null && (
        <p className="text-xs text-slate-400 text-center">
          Valor seleccionado: <span className="font-mono text-blue-400">{value} / {max}</span>
        </p>
      )}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
