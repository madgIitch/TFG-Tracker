import type { ScenarioId } from '../types'

export interface ScenarioDefinition {
  id: ScenarioId
  label: string
  model: string
  environment: string
  role: string
  colorClass: string   // clase Tailwind base para el color
  accentColor: string  // hex para estilos inline si hace falta
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    id: 'A',
    label: 'Codex en VS',
    model: 'GPT 5.3',
    environment: 'VS Code',
    role: 'Baseline',
    colorClass: 'blue',
    accentColor: '#3b82f6',
  },
  {
    id: 'B',
    label: 'Gemini Code Assist',
    model: 'Gemini 1.5 Pro',
    environment: 'VS Code',
    role: 'Replicación',
    colorClass: 'green',
    accentColor: '#22c55e',
  },
  {
    id: 'C',
    label: 'Codex en Windsurf',
    model: 'GPT 5.3',
    environment: 'Windsurf',
    role: 'Replicación',
    colorClass: 'purple',
    accentColor: '#a855f7',
  },
  {
    id: 'D',
    label: 'Gemini en Antigravity',
    model: 'Gemini 1.5 Pro',
    environment: 'Antigravity',
    role: 'Replicación',
    colorClass: 'orange',
    accentColor: '#f97316',
  },
]

export const SCENARIO_MAP: Record<ScenarioId, ScenarioDefinition> = Object.fromEntries(
  SCENARIO_DEFINITIONS.map((s) => [s.id, s])
) as Record<ScenarioId, ScenarioDefinition>
