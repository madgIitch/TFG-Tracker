import { useState, useEffect } from 'react'
import { Textarea } from '../ui/Textarea'
import { useAutoSave } from '../../hooks/useAutoSave'
import { upsertScenario } from '../../db/hooks/useScenarios'
import type { ScenarioRecord } from '../../types'

interface NarrativeFormProps {
  scenarioRecord: ScenarioRecord
}

export function NarrativeForm({ scenarioRecord }: NarrativeFormProps) {
  const [narrative, setNarrative] = useState(scenarioRecord.narrative)

  useEffect(() => {
    setNarrative(scenarioRecord.narrative)
  }, [scenarioRecord.narrative])

  const { isSaving, lastSaved } = useAutoSave(
    { ...scenarioRecord, narrative },
    upsertScenario
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Observaciones narrativas</h3>
        <span className="text-xs text-slate-500">
          {isSaving ? 'Guardando…' : lastSaved ? `Guardado ${formatTimeAgo(lastSaved)}` : ''}
        </span>
      </div>

      <Textarea
        label="Fortalezas"
        rows={3}
        placeholder="¿Qué hizo bien la herramienta?"
        value={narrative.strengths}
        onChange={(e) => setNarrative((n) => ({ ...n, strengths: e.target.value }))}
      />
      <Textarea
        label="Debilidades"
        rows={3}
        placeholder="¿Qué falló o fue limitante?"
        value={narrative.weaknesses}
        onChange={(e) => setNarrative((n) => ({ ...n, weaknesses: e.target.value }))}
      />
      <Textarea
        label="Experiencia general"
        rows={4}
        placeholder="Resumen narrativo del escenario…"
        value={narrative.generalExperience}
        onChange={(e) => setNarrative((n) => ({ ...n, generalExperience: e.target.value }))}
      />
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'ahora'
  if (seconds < 60) return `hace ${seconds}s`
  return `hace ${Math.floor(seconds / 60)}min`
}
