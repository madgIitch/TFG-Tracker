import { Tabs } from '../ui/Tabs'
import { Spinner } from '../ui/Spinner'
import { GeneralTab } from './tabs/GeneralTab'
import { PrimarySourcesTab } from './tabs/PrimarySourcesTab'
import { DerivedMetricsTab } from './tabs/DerivedMetricsTab'
import { D1ContextTab } from './tabs/D1ContextTab'
import { D2AutonomyTab } from './tabs/D2AutonomyTab'
import { D3MultifileTab } from './tabs/D3MultifileTab'
import { D4OperationalTab } from './tabs/D4OperationalTab'
import { D6QualityTab } from './tabs/D6QualityTab'
import { IncidencesTab } from './tabs/IncidencesTab'
import { ObservationsTab } from './tabs/ObservationsTab'
import { useSprintForm } from '../../hooks/useSprintForm'
import { useAutoSave } from '../../hooks/useAutoSave'
import { upsertSprint } from '../../db/hooks/useSprints'
import type { SprintRecord, ScenarioId } from '../../types'

const TABS = [
  { id: 'general',    label: 'General' },
  { id: 'sources',    label: 'Fuentes' },
  { id: 'derived',    label: 'Derivadas' },
  { id: 'd1',         label: 'D1 Contexto' },
  { id: 'd2',         label: 'D2 Autonomía' },
  { id: 'd3',         label: 'D3 Multiarchivo' },
  { id: 'd4',         label: 'D4 Operacional' },
  { id: 'd6',         label: 'D6 Calidad' },
  { id: 'incidences', label: 'Incidencias' },
  { id: 'notes',      label: 'Notas' },
]

interface SprintFormShellProps {
  scenarioId: ScenarioId
  sprintNumber: number
  initialRecord: SprintRecord | null | undefined
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'ahora'
  if (seconds < 60) return `hace ${seconds}s`
  return `hace ${Math.floor(seconds / 60)}min`
}

export function SprintFormShell({ scenarioId, sprintNumber, initialRecord }: SprintFormShellProps) {
  const { formData, updateField, addIncidence, updateIncidence, removeIncidence } =
    useSprintForm(scenarioId, sprintNumber, initialRecord)

  const { isSaving, lastSaved, error } = useAutoSave(formData, upsertSprint)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Auto-save status bar */}
      <div className="flex items-center justify-end gap-2 px-5 py-1.5 border-b border-[#2e3650] bg-[#0f1117] shrink-0">
        {error && (
          <span className="text-xs text-red-400">Error al guardar: {error.message}</span>
        )}
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Spinner size="sm" /> Guardando…
          </span>
        ) : lastSaved ? (
          <span className="text-xs text-slate-500">
            ✓ Guardado {formatTimeAgo(lastSaved)}
          </span>
        ) : (
          <span className="text-xs text-slate-600">Auto-guardado activo</span>
        )}
      </div>

      {/* Tabs + panel */}
      <div className="flex-1 overflow-y-auto">
        <Tabs tabs={TABS}>
          {(activeTab) => (
            <>
              {activeTab === 'general' && (
                <GeneralTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'sources' && (
                <PrimarySourcesTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'derived' && (
                <DerivedMetricsTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'd1' && (
                <D1ContextTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'd2' && (
                <D2AutonomyTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'd3' && (
                <D3MultifileTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'd4' && (
                <D4OperationalTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'd6' && (
                <D6QualityTab data={formData} onChange={updateField} />
              )}
              {activeTab === 'incidences' && (
                <IncidencesTab
                  incidences={formData.incidences}
                  onAdd={addIncidence}
                  onUpdate={updateIncidence}
                  onRemove={removeIncidence}
                />
              )}
              {activeTab === 'notes' && (
                <ObservationsTab data={formData} onChange={updateField} />
              )}
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
