import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../database'
import type { ScenarioRecord, ScenarioId } from '../../types'

export function useScenario(scenarioId: ScenarioId) {
  return useLiveQuery(
    () => db.scenarios.where('scenarioId').equals(scenarioId).first(),
    [scenarioId]
  )
}

export function useAllScenarios() {
  return useLiveQuery(() => db.scenarios.toArray(), [])
}

export async function upsertScenario(data: ScenarioRecord): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.scenarios
    .where('scenarioId')
    .equals(data.scenarioId)
    .first()

  if (existing?.id != null) {
    await db.scenarios.update(existing.id, { ...data, updatedAt: now })
  } else {
    await db.scenarios.add({ ...data, updatedAt: now })
  }
}
