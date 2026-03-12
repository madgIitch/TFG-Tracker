import { useState } from 'react'
import { CounterInput } from '../../ui/Input'
import { RangeSlider } from '../../ui/RangeSlider'
import type { SprintRecord } from '../../../types'

const REPO_PATH_KEY = 'tfg-git-repo-path'
const DEFAULT_REPO_PATH = 'C:\\Users\\peorr\\Desktop\\HomiTFG'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

const CONSISTENCY_LABELS: Record<number, string> = {
  1: 'Muy inconsistente — Naming y estructura dispares',
  2: 'Inconsistente — Varias desviaciones notables',
  3: 'Aceptable — Sigue las convenciones en general',
  4: 'Consistente — Estilo uniforme con pocas excepciones',
  5: 'Muy consistente — Naming, estructura y patrones perfectamente uniformes',
}

const UIUX_LABELS: Record<number, string> = {
  1: 'Muy deficiente — Componentes rotos, layout inutilizable',
  2: 'Deficiente — Varios problemas visibles de layout o accesibilidad',
  3: 'Aceptable — Funcional pero con inconsistencias de diseño',
  4: 'Buena — UI coherente y usable, pequeños detalles mejorables',
  5: 'Excelente — UI pulida, accesible y coherente con el resto del proyecto',
}

export function D6QualityTab({ data, onChange }: Props) {
  const [repoPath, setRepoPath] = useState(
    () => localStorage.getItem(REPO_PATH_KEY) ?? DEFAULT_REPO_PATH
  )
  const [lintLoading, setLintLoading] = useState(false)
  const [lintResult, setLintResult] = useState<{ warnings: number; errors: number; total: number } | null>(null)
  const [lintError, setLintError] = useState<string | null>(null)

  async function handleRunLint() {
    setLintLoading(true)
    setLintError(null)
    setLintResult(null)
    localStorage.setItem(REPO_PATH_KEY, repoPath)

    try {
      const res = await fetch('/api/run-lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      })
      const json = await res.json() as { error?: string; warnings?: number; errors?: number; total?: number }
      if (!res.ok || json.error) {
        setLintError(json.error ?? 'Error desconocido')
      } else {
        const result = { warnings: json.warnings ?? 0, errors: json.errors ?? 0, total: json.total ?? 0 }
        setLintResult(result)
        onChange('linterWarnings', result.total)
      }
    } catch (e) {
      setLintError(String(e))
    } finally {
      setLintLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="p-3 bg-slate-700/40 border border-slate-600/40 rounded-md text-xs text-slate-300">
        <strong>D6 — Calidad mantenible:</strong> Warnings de análisis estático (TypeScript + ESLint)
        y consistencia de estilos. Se mide con{' '}
        <code className="bg-slate-800 px-1 rounded">tsc --noEmit</code> y{' '}
        <code className="bg-slate-800 px-1 rounded">eslint src/ --format json</code>.
      </div>

      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Análisis estático al cierre del sprint
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CounterInput
            label="TypeScript warnings / errors"
            value={data.tsWarnings}
            onChange={(v) => onChange('tsWarnings', v)}
            hint="tsc --noEmit 2>&1 | grep -c 'error TS'"
          />
          <CounterInput
            label="Linter warnings"
            value={data.linterWarnings}
            onChange={(v) => onChange('linterWarnings', v)}
            hint="eslint src/ --format json | jq '[.[].messages | length] | add'"
          />
        </div>

        {/* Lint runner */}
        <div className="mt-4 p-4 bg-[#0f1117] border border-[#2e3650] rounded-lg flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Ejecutar lint en el repositorio del escenario
          </p>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Ruta del repositorio</span>
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="C:\Users\peorr\Desktop\HomiTFG"
              className="w-full bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleRunLint}
              disabled={!repoPath.trim() || lintLoading}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
            >
              {lintLoading ? 'Ejecutando…' : '⚡ npm run lint'}
            </button>

            {lintResult && (
              <span className="text-xs font-mono text-green-400">
                ✓ Warnings: {lintResult.warnings} · Errors: {lintResult.errors} · Total: {lintResult.total} → rellenado automáticamente
              </span>
            )}
            {lintError && (
              <span className="text-xs text-red-400 truncate max-w-xs" title={lintError}>
                ✗ {lintError}
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-600">
            Ejecuta <code className="text-slate-500">npm run lint --format json</code> en la ruta indicada y rellena el contador de linter warnings. La ruta se comparte con el widget de Git.
          </p>
        </div>
      </section>

      <section>
        <RangeSlider
          label="Consistencia de estilos (1–5)"
          value={data.styleConsistency}
          onChange={(v) => onChange('styleConsistency', v)}
          lowLabel="Inconsistente"
          highLabel="Uniforme"
          hint="Naming, estructura de archivos, patrones de código uniformes"
        />
        {data.styleConsistency != null && (
          <p className="text-xs text-slate-400 mt-2 ml-1">
            {CONSISTENCY_LABELS[data.styleConsistency]}
          </p>
        )}
      </section>

      <section>
        <RangeSlider
          label="Calidad UI/UX (1–5)"
          value={data.uiUxQuality}
          onChange={(v) => onChange('uiUxQuality', v)}
          lowLabel="Deficiente"
          highLabel="Excelente"
          hint="Valoración subjetiva del resultado visual y de usabilidad del sprint"
        />
        {data.uiUxQuality != null && (
          <p className="text-xs text-slate-400 mt-2 ml-1">
            {UIUX_LABELS[data.uiUxQuality]}
          </p>
        )}
      </section>
    </div>
  )
}
