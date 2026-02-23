import Dexie, { type Table } from 'dexie'
import type { SprintRecord, ScenarioRecord, PromptRecord, PromptEvaluation, ImageRecord } from '../types'

export class TFGTrackerDB extends Dexie {
  sprints!: Table<SprintRecord, number>
  scenarios!: Table<ScenarioRecord, number>
  prompts!: Table<PromptRecord, number>
  promptEvaluations!: Table<PromptEvaluation, number>
  images!: Table<ImageRecord, number>

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

    // version(3) — añade tabla de imágenes adjuntas (portapapeles / drag-and-drop)
    this.version(3).stores({
      sprints:
        '++id, scenarioId, sprintNumber, [scenarioId+sprintNumber], status, updatedAt',
      scenarios: '++id, &scenarioId, updatedAt',
      prompts: '++id, category, updatedAt',
      promptEvaluations:
        '++id, promptId, scenarioId, [promptId+scenarioId], sprintNumber, updatedAt',
      images: '++id, entityType, entityKey, [entityType+entityKey], createdAt',
    })
  }
}

export const db = new TFGTrackerDB()
