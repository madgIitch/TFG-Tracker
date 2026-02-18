import { Link, useMatches } from 'react-router-dom'
import type { ReactNode } from 'react'

interface Crumb {
  label: string
  to?: string
}

interface TopBarProps {
  crumbs?: Crumb[]
  children?: ReactNode
}

export function TopBar({ crumbs = [], children }: TopBarProps) {
  return (
    <div className="h-12 flex items-center justify-between px-6 border-b border-[#2e3650] shrink-0">
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-600">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="text-slate-400 hover:text-slate-200 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-200 font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
