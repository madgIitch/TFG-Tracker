import { db } from './database'
import type { ScenarioId, AcceptanceKey, AcceptanceChecklist } from '../types'

const SCENARIO_IDS: ScenarioId[] = ['A', 'B', 'C', 'D']

const ACCEPTANCE_KEYS: AcceptanceKey[] = [
  'sprint7', 'sprint8', 'sprint9', 'sprint10', 'sprint11', 'sprint12',
  'sprint13', 'sprint14', 'sprint15', 'sprint16', 'sprint17', 'sprint18',
  'sprint19', 'sprint20', 'sprint21', 'sprint22', 'sprint23', 'functionalParity',
]

function emptyChecklist(): AcceptanceChecklist {
  return Object.fromEntries(ACCEPTANCE_KEYS.map((k) => [k, false])) as AcceptanceChecklist
}

export async function seedIfEmpty() {
  const count = await db.scenarios.count()
  if (count > 0) return

  const now = new Date().toISOString()
  await db.scenarios.bulkAdd(
    SCENARIO_IDS.map((id) => ({
      scenarioId: id,
      acceptanceChecklist: emptyChecklist(),
      narrative: { strengths: '', weaknesses: '', generalExperience: '' },
      updatedAt: now,
    }))
  )
}
