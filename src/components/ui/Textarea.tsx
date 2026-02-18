import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

const BASE =
  'w-full bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y disabled:opacity-50'

export function Textarea({ label, hint, className = '', id, ...rest }: TextareaProps) {
  const taId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={taId} className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea id={taId} className={`${BASE} ${className}`} {...rest} />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
