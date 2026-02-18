import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117] text-slate-200 font-['Inter',sans-serif]">
      {/* Sidebar fijo */}
      <aside className="w-56 shrink-0 border-r border-[#2e3650] overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Área principal */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
