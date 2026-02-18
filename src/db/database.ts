import Dexie, { type Table } from 'dexie'
import type { SprintRecord, ScenarioRecord } from '../types'

export class TFGTrackerDB extends Dexie {
  sprints!: Table<SprintRecord, number>
  scenarios!: Table<ScenarioRecord, number>

  constructor() {
    super('TFGTrackerDB')

    this.version(1).stores({
      // ++id = auto-increment PK
      // [scenarioId+sprintNumber] = compound index (unique lookup per sprint per scenario)
      sprints:
        '++id, scenarioId, sprintNumber, [scenarioId+sprintNumber], status, updatedAt',
      // &scenarioId = unique index — exactamente 1 registro por escenario
      scenarios: '++id, &scenarioId, updatedAt',
    })
  }
}

export const db = new TFGTrackerDB()
