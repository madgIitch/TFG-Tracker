import React, { useState } from 'react'
import {
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { SPRINT_NAMES } from '../../constants/sprints'
import { SCENARIO_DEFINITIONS } from '../../constants/scenarios'
import { getSprintTTS } from './BudgetPanel'
import type { SprintRecord } from '../../types'

type ViewMode = 'ambos' | 'sprints' | 'centroides'

function avgQuality(s: SprintRecord): number | null {
  const vals = [s.uiUxQuality, s.architecturalCoherence, s.styleConsistency].filter(
    (v): v is number => v != null
  )
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

interface PointData {
  tts: number
  quality: number
  sprint?: number
  scenarioLabel: string
  isCentroid?: boolean
}

interface TooltipPayload {
  name: string
  value: number
  payload: PointData
}

function CentroidShape({ cx = 0, cy = 0, fill = '#fff' }: { cx?: number; cy?: number; fill?: string }) {
  const arm = 8
  return (
    <g>
      <line x1={cx - arm} y1={cy} x2={cx + arm} y2={cy} stroke={fill} strokeWidth={2.5} />
      <line x1={cx} y1={cy - arm} x2={cx} y2={cy + arm} stroke={fill} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={4} fill={fill} stroke="#0f1117" strokeWidth={1.5} />
    </g>
  )
}

interface ScatterQualityChartProps {
  allSprints: SprintRecord[]
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.isCentroid) {
    return (
      <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-md px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-300 font-semibold mb-1">Centroide — {d.scenarioLabel}</p>
        <p className="text-slate-200 font-mono mt-1">TTS medio: {d.tts.toFixed(1)}h</p>
        <p className="text-slate-200 font-mono">Calidad media: {d.quality.toFixed(2)} / 5</p>
      </div>
    )
  }
  return (
    <div className="bg-[#1a1f2e] border border-[#2e3650] rounded-md px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">
        S{d.sprint} — {SPRINT_NAMES[d.sprint!]}
      </p>
      <p className="text-slate-400">{d.scenarioLabel}</p>
      <p className="text-slate-200 font-mono mt-1">TTS: {d.tts.toFixed(1)}h</p>
      <p className="text-slate-200 font-mono">Calidad: {d.quality.toFixed(2)} / 5</p>
    </div>
  )
}

export function ScatterQualityChart({ allSprints }: ScatterQualityChartProps) {
  const [view, setView] = useState<ViewMode>('ambos')

  const series = SCENARIO_DEFINITIONS.map((def) => {
    const sprints = allSprints.filter((s) => s.scenarioId === def.id)
    const data: PointData[] = sprints
      .map((s) => {
        const tts = getSprintTTS(s)
        const quality = avgQuality(s)
        if (tts == null || quality == null) return null
        return {
          tts,
          quality,
          sprint: s.sprintNumber,
          scenarioLabel: `${def.id} — ${def.label}`,
        }
      })
      .filter((d): d is NonNullable<typeof d> => d != null)

    const centroid: PointData | null =
      data.length > 0
        ? {
            tts: data.reduce((a, d) => a + d.tts, 0) / data.length,
            quality: data.reduce((a, d) => a + d.quality, 0) / data.length,
            scenarioLabel: `${def.id} — ${def.label}`,
            isCentroid: true,
          }
        : null

    return { def, data, centroid }
  })

  const hasData = series.some((s) => s.data.length > 0)

  const allPoints = series.flatMap((s) => s.data)
  const avgTTS = allPoints.length > 0
    ? allPoints.reduce((a, d) => a + d.tts, 0) / allPoints.length
    : null

  return (
    <div className="bg-[#0f1117] border border-[#2e3650] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-slate-200">TTS vs Calidad por sprint</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Cada punto = un sprint. X = tiempo invertido (h), Y = calidad media (UI/UX + coherencia + consistencia).
            {' '}<span className="text-slate-400">Zona ideal: arriba-izquierda (rápido y con calidad alta).</span>
            {view !== 'sprints' && (
              <>{' '}<span className="text-slate-400">La cruz indica el centroide de cada escenario.</span></>
            )}
            {' '}<span className="text-slate-400">Las líneas de referencia marcan calidad = 3 y TTS medio global.</span>
          </p>
        </div>
        <div className="flex rounded-md overflow-hidden border border-[#2e3650] shrink-0">
          {(['ambos', 'sprints', 'centroides'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors capitalize ${
                view === v
                  ? 'bg-[#2e3650] text-slate-100'
                  : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-600">
          Sin datos aún
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 12, right: 32, left: 4, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3650" />
            <XAxis
              dataKey="tts"
              type="number"
              name="TTS"
              domain={([dataMin, dataMax]: readonly [number, number]) => {
                const pad = (dataMax - dataMin) * 0.12 || 0.5
                return [Math.max(0, dataMin - pad), dataMax + pad]
              }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Number(v).toFixed(1)}h`}
              tickCount={8}
              label={{
                value: 'TTS (h)',
                position: 'insideBottom',
                offset: -14,
                fill: '#475569',
                fontSize: 10,
              }}
            />
            <YAxis
              dataKey="quality"
              type="number"
              name="Calidad"
              domain={[0.8, 5.2]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
              label={{
                value: 'Calidad (1–5)',
                angle: -90,
                position: 'insideLeft',
                offset: 14,
                fill: '#475569',
                fontSize: 10,
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, color: '#94a3b8', paddingTop: 8 }}
            />

            {/* Línea horizontal: calidad = 3 (umbral medio) */}
            <ReferenceLine
              y={3}
              stroke="#64748b"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{ value: 'Cal. 3', position: 'insideTopRight', fill: '#64748b', fontSize: 9 }}
            />

            {/* Línea vertical: TTS medio global */}
            {avgTTS != null && (
              <ReferenceLine
                x={avgTTS}
                stroke="#64748b"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{ value: `${avgTTS.toFixed(1)}h`, position: 'insideTopRight', fill: '#64748b', fontSize: 9 }}
              />
            )}

            {series.flatMap(({ def, data, centroid }) => {
              const items: React.ReactElement[] = []
              if (view !== 'centroides') {
                items.push(
                  <Scatter
                    key={def.id}
                    name={`${def.id} — ${def.label}`}
                    data={data}
                    fill={def.accentColor}
                    fillOpacity={0.75}
                    r={5}
                  />
                )
              }
              if (view !== 'sprints' && centroid) {
                items.push(
                  <Scatter
                    key={`${def.id}-centroid`}
                    name={view === 'centroides' ? `${def.id} — ${def.label}` : undefined}
                    data={[centroid]}
                    fill={def.accentColor}
                    legendType={view === 'centroides' ? 'circle' : 'none'}
                    shape={CentroidShape}
                  />
                )
              }
              return items
            })}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
