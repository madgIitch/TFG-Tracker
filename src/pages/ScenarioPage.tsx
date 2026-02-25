import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { SprintTable } from '../components/scenario/SprintTable'
import { AcceptanceChecklistComponent } from '../components/scenario/AcceptanceChecklist'
import { NarrativeForm } from '../components/scenario/NarrativeForm'
import { PromptEvaluationsSummary } from '../components/scenario/PromptEvaluationsSummary'
import { LoadingScreen } from '../components/ui/Spinner'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useSprints } from '../db/hooks/useSprints'
import { useScenario } from '../db/hooks/useScenarios'
import { SCENARIO_MAP } from '../constants/scenarios'
import { getSprintCompletionCount } from '../utils/metrics'
import { downloadScenarioImages } from '../utils/imageDownload'
import type { ScenarioId } from '../types'

const VALID_IDS: ScenarioId[] = ['A', 'B', 'C', 'D']

export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>()
  const [downloadingImgs, setDownloadingImgs] = useState(false)

  if (!id || !VALID_IDS.includes(id as ScenarioId)) {
    return <Navigate to="/" replace />
  }

  const scenarioId = id as ScenarioId
  const def = SCENARIO_MAP[scenarioId]
  const sprints = useSprints(scenarioId)
  const scenarioRecord = useScenario(scenarioId)

  if (sprints === undefined || scenarioRecord === undefined) return <LoadingScreen />

  const completed = getSprintCompletionCount(sprints)

  async function handleDownloadScenarioImages() {
    setDownloadingImgs(true)
    try {
      await downloadScenarioImages(scenarioId)
    } catch (err) {
      alert('Error al descargar imágenes: ' + String(err))
    } finally {
      setDownloadingImgs(false)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: `Escenario ${scenarioId} — ${def.label}` },
        ]}
      />

      <div className="p-6 flex flex-col gap-8 flex-1">
        {/* Header escenario */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-100">
              Escenario {scenarioId}: {def.label}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {def.model} · {def.environment} · {def.role}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-full md:w-64">
              <ProgressBar
                value={completed / 17}
                color={def.accentColor}
                label={`${completed} / 17 sprints completados`}
              />
            </div>
            <button
              type="button"
              onClick={handleDownloadScenarioImages}
              disabled={downloadingImgs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-[#252b3b] border border-[#2e3650] disabled:opacity-40 transition-colors"
            >
              <span className="text-sm leading-none">↓</span>
              {downloadingImgs ? 'Descargando…' : 'Descargar imágenes del escenario'}
            </button>
          </div>
        </div>

        {/* Tabla de sprints */}
        <section>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Sprints</h3>
          <SprintTable scenarioId={scenarioId} sprints={sprints} />
        </section>

        <section className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Evaluaciones de prompts en este escenario
          </h3>
          <PromptEvaluationsSummary scenarioId={scenarioId} />
        </section>

        {/* Checklist */}
        {scenarioRecord && (
          <section className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-5">
            <AcceptanceChecklistComponent scenarioRecord={scenarioRecord} />
          </section>
        )}

        {/* Narrativa */}
        {scenarioRecord && (
          <section className="bg-[#1a1f2e] border border-[#2e3650] rounded-lg p-5">
            <NarrativeForm scenarioRecord={scenarioRecord} />
          </section>
        )}
      </div>
    </div>
  )
}
