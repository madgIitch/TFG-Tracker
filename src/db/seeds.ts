import { db } from './database'
import type { ScenarioId, AcceptanceKey, AcceptanceChecklist } from '../types'

const SCENARIO_IDS: ScenarioId[] = ['A', 'B', 'C', 'D', 'E']

const ACCEPTANCE_KEYS: AcceptanceKey[] = [
  'sprint7', 'sprint8', 'sprint9', 'sprint10', 'sprint11', 'sprint12',
  'sprint13', 'sprint14', 'sprint15', 'sprint16', 'sprint17', 'sprint18',
  'sprint19', 'sprint20', 'sprint21', 'sprint22', 'sprint23', 'sprint24', 'functionalParity',
]

function emptyChecklist(): AcceptanceChecklist {
  return Object.fromEntries(ACCEPTANCE_KEYS.map((k) => [k, false])) as AcceptanceChecklist
}

export async function seedIfEmpty() {
  const now = new Date().toISOString()
  for (const id of SCENARIO_IDS) {
    const existing = await db.scenarios.where('scenarioId').equals(id).first()
    if (!existing) {
      await db.scenarios.add({
        scenarioId: id,
        acceptanceChecklist: emptyChecklist(),
        narrative: { strengths: '', weaknesses: '', generalExperience: '' },
        updatedAt: now,
      })
    }
  }
}
