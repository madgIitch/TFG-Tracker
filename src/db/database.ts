import Dexie, { type Table } from 'dexie'
import type { SprintRecord, ScenarioRecord, PromptRecord, PromptEvaluation } from '../types'

export class TFGTrackerDB extends Dexie {
  sprints!: Table<SprintRecord, number>
  scenarios!: Table<ScenarioRecord, number>
  prompts!: Table<PromptRecord, number>
  promptEvaluations!: Table<PromptEvaluation, number>

  constructor() {
    super('TFGTrackerDB')

    // version(1) — tablas originales (no tocar, Dexie necesita el historial)
    this.version(1).stores({
      sprints:
        '++id, scenarioId, sprintNumber, [scenarioId+sprintNumber], status, updatedAt',
      scenarios: '++id, &scenarioId, updatedAt',
    })

    // version(2) — añade tablas de prompts sin alterar datos existentes
    this.version(2).stores({
      sprints:
        '++id, scenarioId, sprintNumber, [scenarioId+sprintNumber], status, updatedAt',
      scenarios: '++id, &scenarioId, updatedAt',
      prompts: '++id, category, updatedAt',
      // [promptId+scenarioId] → 1 evaluación por (prompt, escenario)
      promptEvaluations:
        '++id, promptId, scenarioId, [promptId+scenarioId], sprintNumber, updatedAt',
    })
  }
}

export const db = new TFGTrackerDB()
