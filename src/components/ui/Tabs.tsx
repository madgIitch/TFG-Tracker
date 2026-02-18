import { useState, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  children: (activeTab: string) => ReactNode
  defaultTab?: string
}

export function Tabs({ tabs, children, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '')

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-[#2e3650] gap-0 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
              ${active === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Panel */}
      <div className="flex-1">{children(active)}</div>
    </div>
  )
}
