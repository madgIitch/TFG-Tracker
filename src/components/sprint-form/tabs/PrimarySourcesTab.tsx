import { useState } from 'react'
import { NumericInput } from '../../ui/Input'
import type { SprintRecord } from '../../../types'
import { computeTestPassRate } from '../../../utils/metrics'
import { formatPercent } from '../../../utils/formatting'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

const REPO_PATH_KEY = 'tfg-git-repo-path'

const DEFAULT_REPO_PATH = 'C:\\Users\\peorr\\Desktop\\HomiTFG'

function loadRepoPath(): string {
  return localStorage.getItem(REPO_PATH_KEY) ?? DEFAULT_REPO_PATH
}

interface GitFileEntry {
  status: string
  path: string
}

interface GitDiffResult {
  created: number
  modified: number
  total: number
  linesAdded: number
  linesRemoved: number
  files: GitFileEntry[]
}

export function PrimarySourcesTab({ data, onChange }: Props) {
  const computedTotal =
    data.testsPass != null || data.testsFail != null
      ? (data.testsPass ?? 0) + (data.testsFail ?? 0)
      : null

  const passRate = computeTestPassRate(data.testsPass, computedTotal)

  function handlePassChange(v: number | null) {
    onChange('testsPass', v)
    const total = (v ?? 0) + (data.testsFail ?? 0)
    onChange('testsTotal', v != null || data.testsFail != null ? total : null)
  }

  function handleFailChange(v: number | null) {
    onChange('testsFail', v)
    const total = (data.testsPass ?? 0) + (v ?? 0)
    onChange('testsTotal', data.testsPass != null || v != null ? total : null)
  }

  // ── Git diff state ────────────────────────────────────────────────────────
  const [repoPath,    setRepoPath]    = useState(loadRepoPath)
  const [fromCommit,  setFromCommit]  = useState(data.gitFromCommit ?? '')
  const [toCommit,    setToCommit]    = useState(data.gitToCommit ?? '')
  const [gitLoading,  setGitLoading]  = useState(false)
  const [gitResult,   setGitResult]   = useState<GitDiffResult | null>(null)
  const [gitError,    setGitError]    = useState<string | null>(null)
  const [showFiles,   setShowFiles]   = useState(false)

  async function handleGitCalc() {
    setGitLoading(true)
    setGitError(null)
    setGitResult(null)
    localStorage.setItem(REPO_PATH_KEY, repoPath)

    try {
      const res = await fetch('/api/git-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath, fromCommit, toCommit }),
      })
      const json = await res.json() as { error?: string } & Partial<GitDiffResult>
      if (!res.ok || json.error) {
        setGitError(json.error ?? 'Error desconocido')
      } else {
        const result = json as GitDiffResult
        setGitResult(result)
        onChange('filesCreated',  result.created)
        onChange('filesModified', result.modified)
        onChange('linesAdded',    result.linesAdded)
        onChange('linesRemoved',  result.linesRemoved)
        onChange('gitFromCommit', fromCommit)
        onChange('gitToCommit',   toCommit)
      }
    } catch (e) {
      setGitError(String(e))
    } finally {
      setGitLoading(false)
    }
  }

  const canCalc = repoPath.trim() && fromCommit.trim() && toCommit.trim()

  return (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Git — Commits y ficheros
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <NumericInput
            label="Commits realizados"
            value={data.commits}
            onChange={(v) => onChange('commits', v)}
            min={0}
            placeholder="0"
          />
          <NumericInput
            label="Ficheros creados"
            value={data.filesCreated}
            onChange={(v) => onChange('filesCreated', v)}
            min={0}
            placeholder="0"
          />
          <NumericInput
            label="Ficheros modificados"
            value={data.filesModified}
            onChange={(v) => onChange('filesModified', v)}
            min={0}
            placeholder="0"
          />
          <NumericInput
            label="Líneas añadidas"
            value={data.linesAdded}
            onChange={(v) => onChange('linesAdded', v)}
            min={0}
            placeholder="0"
            hint="git diff --shortstat (+)"
          />
          <NumericInput
            label="Líneas eliminadas"
            value={data.linesRemoved}
            onChange={(v) => onChange('linesRemoved', v)}
            min={0}
            placeholder="0"
            hint="git diff --shortstat (-)"
          />
        </div>

        {/* Git diff calculator */}
        <div className="mt-4 p-4 bg-[#0f1117] border border-[#2e3650] rounded-lg flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Calcular ficheros desde rango de commits
          </p>

          {/* Repo path */}
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

          {/* Commit range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Commit inicio (desde)</span>
              <input
                type="text"
                value={fromCommit}
                onChange={(e) => setFromCommit(e.target.value)}
                placeholder="abc1234"
                className="w-full bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Commit fin (hasta)</span>
              <input
                type="text"
                value={toCommit}
                onChange={(e) => setToCommit(e.target.value)}
                placeholder="def5678 o HEAD"
                className="w-full bg-[#252b3b] border border-[#2e3650] rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Action + result */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleGitCalc}
              disabled={!canCalc || gitLoading}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
            >
              {gitLoading ? 'Calculando…' : '⚡ Calcular y rellenar'}
            </button>

            {gitResult && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-green-400">
                  ✓ Creados: {gitResult.created} · Modificados: {gitResult.modified} · +{gitResult.linesAdded} / -{gitResult.linesRemoved} líneas
                </span>
                <button
                  type="button"
                  onClick={() => setShowFiles(v => !v)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors"
                >
                  {showFiles ? 'Ocultar archivos' : `Ver ${gitResult.files.length} archivos`}
                </button>
              </div>
            )}
            {gitError && (
              <span className="text-xs text-red-400 truncate max-w-xs" title={gitError}>
                ✗ {gitError}
              </span>
            )}
          </div>

          {/* File list */}
          {gitResult && showFiles && gitResult.files.length > 0 && (
            <div className="max-h-56 overflow-y-auto rounded-md border border-[#2e3650] bg-[#0a0d14]">
              {gitResult.files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1a1f2e] last:border-0 hover:bg-[#131720] transition-colors"
                >
                  <span className={`shrink-0 w-4 text-[10px] font-bold text-center rounded
                    ${f.status === 'A' ? 'text-green-400' : ''}
                    ${f.status === 'M' ? 'text-blue-400' : ''}
                    ${f.status === 'D' ? 'text-red-400' : ''}
                    ${f.status === 'R' ? 'text-yellow-400' : ''}
                    ${f.status === 'C' ? 'text-purple-400' : ''}
                    ${!['A','M','D','R','C'].includes(f.status) ? 'text-slate-400' : ''}
                  `}>
                    {f.status}
                  </span>
                  <span className="text-xs font-mono text-slate-300 break-all">{f.path}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-600 leading-relaxed">
            Usa <code className="text-slate-500">git diff --name-status</code> (ficheros) y <code className="text-slate-500">--shortstat</code> (líneas).
            Para incluir el commit de inicio usa <code className="text-slate-500">&lt;sha&gt;~1</code> como inicio.
            La ruta del repo se guarda en el navegador.
          </p>
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Tests (Jest / RTL)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumericInput
            label="Tests pass ✓"
            value={data.testsPass}
            onChange={handlePassChange}
            min={0}
            placeholder="0"
          />
          <NumericInput
            label="Tests fail ✗"
            value={data.testsFail}
            onChange={handleFailChange}
            min={0}
            placeholder="0"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tests totales</span>
            <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-md px-3 py-2 text-sm font-mono text-slate-300">
              {computedTotal ?? '—'}
            </div>
          </div>
        </div>
        {passRate != null && (
          <div className="mt-3 p-3 bg-[#252b3b] rounded-md flex items-center gap-3">
            <div className="text-sm font-mono font-semibold text-slate-200">
              Tasa de éxito: {formatPercent(passRate)}
            </div>
            <div className="flex-1 h-2 bg-[#2e3650] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${passRate * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
