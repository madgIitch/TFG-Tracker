import { useRef, type ChangeEvent } from 'react'
import { db } from '../../db/database'

export function ExportImportButtons() {
  const importRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    const sprints = await db.sprints.toArray()
    const scenarios = await db.scenarios.toArray()
    const prompts = await db.prompts.toArray()
    const promptEvaluations = await db.promptEvaluations.toArray()
    const data = { sprints, scenarios, prompts, promptEvaluations, exportedAt: new Date().toISOString() }
    const filename = `tfg-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    const content = JSON.stringify(data, null, 2)
    try {
      const res = await fetch('/api/save-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content }),
      })
      const json = await res.json() as { ok?: boolean; path?: string; error?: string }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Error desconocido')
      alert(`Backup guardado en:\n${json.path}`)
    } catch (e) {
      alert('Error al guardar el backup: ' + String(e))
    }
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ok = window.confirm(
      '¿Importar datos? Esto reemplazará TODOS los datos actuales de la BD local. Esta acción no se puede deshacer.'
    )
    if (!ok) { e.target.value = ''; return }
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data.sprints) || !Array.isArray(data.scenarios)) {
        alert('El fichero no tiene el formato esperado.')
        return
      }
      const prompts = Array.isArray(data.prompts) ? data.prompts : []
      const promptEvaluations = Array.isArray(data.promptEvaluations) ? data.promptEvaluations : []
      await db.transaction('rw', db.sprints, db.scenarios, db.prompts, db.promptEvaluations, async () => {
        await db.sprints.clear()
        await db.scenarios.clear()
        await db.prompts.clear()
        await db.promptEvaluations.clear()
        await db.sprints.bulkAdd(data.sprints.map(({ id: _id, ...rest }: any) => rest))
        await db.scenarios.bulkAdd(data.scenarios.map(({ id: _id, ...rest }: any) => rest))
        // Prompts y evaluaciones deben preservar sus IDs originales para que
        // la referencia promptId en promptEvaluations siga siendo válida.
        await db.prompts.bulkPut(prompts)
        await db.promptEvaluations.bulkPut(promptEvaluations)
      })
      alert('Datos importados correctamente.')
    } catch (err) {
      alert('Error al importar: ' + String(err))
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleExport}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-slate-200 hover:bg-[#252b3b] transition-colors"
      >
        <span className="text-base leading-none">↓</span> Exportar JSON
      </button>
      <button
        type="button"
        onClick={() => importRef.current?.click()}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-slate-200 hover:bg-[#252b3b] transition-colors"
      >
        <span className="text-base leading-none">↑</span> Importar JSON
      </button>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  )
}
