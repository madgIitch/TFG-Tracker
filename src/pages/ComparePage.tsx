import { useRef } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { CompareTable } from '../components/compare/CompareTable'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { useAllSprints } from '../db/hooks/useSprints'
import { useAllScenarios } from '../db/hooks/useScenarios'
import { aggregateScenario } from '../utils/aggregation'
import { db } from '../db/database'
import type { ScenarioId } from '../types'

const SCENARIO_IDS: ScenarioId[] = ['A', 'B', 'C', 'D']

export default function ComparePage() {
  const allSprints = useAllSprints()
  const allScenarios = useAllScenarios()
  const importRef = useRef<HTMLInputElement>(null)

  if (allSprints === undefined || allScenarios === undefined) return <LoadingScreen />

  const metrics = SCENARIO_IDS.map((id) => {
    const sprints = allSprints.filter((s) => s.scenarioId === id)
    return aggregateScenario(id, sprints)
  })

  async function handleExport() {
    const sprints = await db.sprints.toArray()
    const scenarios = await db.scenarios.toArray()
    const data = { sprints, scenarios, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tfg-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ok = window.confirm(
      '¿Importar datos? Esto reemplazará TODOS los datos actuales de la BD local. Esta acción no se puede deshacer.'
    )
    if (!ok) {
      e.target.value = ''
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data.sprints) || !Array.isArray(data.scenarios)) {
        alert('El fichero no tiene el formato esperado.')
        return
      }

      await db.transaction('rw', db.sprints, db.scenarios, async () => {
        await db.sprints.clear()
        await db.scenarios.clear()
        // Eliminar los ids para que Dexie los reasigne
        await db.sprints.bulkAdd(data.sprints.map(({ id: _id, ...rest }: any) => rest))
        await db.scenarios.bulkAdd(data.scenarios.map(({ id: _id, ...rest }: any) => rest))
      })

      alert('Datos importados correctamente.')
    } catch (err) {
      alert('Error al importar: ' + String(err))
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Comparativa' }]}>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            ↓ Exportar JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => importRef.current?.click()}
          >
            ↑ Importar JSON
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </TopBar>

      <div className="p-6 flex flex-col gap-6 flex-1">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            Tabla comparativa — Escenarios A–D
          </h2>
          <p className="text-sm text-slate-400">
            Métricas agregadas de los 6 dimensiones del marco de evaluación.
            <span className="ml-3 text-green-400">■ Mejor</span>
            <span className="ml-2 text-red-400">■ Peor</span>
            <span className="ml-2 text-slate-500">(solo cuando hay ≥2 valores)</span>
          </p>
        </div>

        <CompareTable metrics={metrics} />
      </div>
    </div>
  )
}
