interface ProgressBarProps {
  value: number   // 0–1
  label?: string
  showPercent?: boolean
  color?: string  // hex
  className?: string
}

export function ProgressBar({
  value,
  label,
  showPercent = true,
  color = '#3b82f6',
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100))
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showPercent && (
            <span className="text-xs font-mono text-slate-300">{pct.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-[#252b3b] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
