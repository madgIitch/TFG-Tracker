import { NumericInput } from '../../ui/Input'
import type { SprintRecord } from '../../../types'
import { computeTestPassRate } from '../../../utils/metrics'
import { formatPercent } from '../../../utils/formatting'

interface Props {
  data: SprintRecord
  onChange: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void
}

export function PrimarySourcesTab({ data, onChange }: Props) {
  const passRate = computeTestPassRate(data.testsPass, data.testsTotal)

  return (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Git — Commits y ficheros
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Tests (Jest / RTL)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumericInput
            label="Tests totales"
            value={data.testsTotal}
            onChange={(v) => onChange('testsTotal', v)}
            min={0}
            placeholder="0"
          />
          <NumericInput
            label="Tests pass ✓"
            value={data.testsPass}
            onChange={(v) => onChange('testsPass', v)}
            min={0}
            placeholder="0"
          />
          <NumericInput
            label="Tests fail ✗"
            value={data.testsFail}
            onChange={(v) => onChange('testsFail', v)}
            min={0}
            placeholder="0"
          />
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
