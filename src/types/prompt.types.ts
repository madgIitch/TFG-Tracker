import type { ScenarioId, PromptCategory } from './enums'

export interface PromptRecord {
  id?: number
  title: string
  content: string
  category: PromptCategory
  targetScenarios: ScenarioId[]  // subconjunto de ['A','B','C','D']
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PromptEvaluation {
  id?: number
  promptId: number               // FK → PromptRecord.id
  scenarioId: ScenarioId         // debe estar en prompt.targetScenarios
  sprintNumber: number | null    // sprint asociado (7–23) o null
  quality: number | null         // 1–5
  wasAccepted: boolean | null    // ¿se usó la respuesta?
  humanRevisions: number | null  // nº de revisiones humanas necesarias para aceptar la respuesta
  notes: string
  createdAt: string
  updatedAt: string
}
