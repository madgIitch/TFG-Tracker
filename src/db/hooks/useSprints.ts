import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../database'
import type { SprintRecord, ScenarioId } from '../../types'

export function useSprint(scenarioId: ScenarioId, sprintNumber: number) {
  return useLiveQuery(
    async () => {
      const result = await db.sprints
        .where('[scenarioId+sprintNumber]')
        .equals([scenarioId, sprintNumber])
        .first()
      // undefined = cargando (estado inicial de useLiveQuery)
      // null = cargado, no existe en BD
      // SprintRecord = cargado, existe
      return result ?? null
    },
    [scenarioId, sprintNumber]
  )
}

export function useSprints(scenarioId: ScenarioId) {
  return useLiveQuery(
    () => db.sprints.where('scenarioId').equals(scenarioId).toArray(),
    [scenarioId]
  )
}

export function useAllSprints() {
  return useLiveQuery(() => db.sprints.toArray(), [])
}

export async function upsertSprint(data: SprintRecord): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.sprints
    .where('[scenarioId+sprintNumber]')
    .equals([data.scenarioId, data.sprintNumber])
    .first()

  if (existing?.id != null) {
    await db.sprints.update(existing.id, { ...data, updatedAt: now })
  } else {
    await db.sprints.add({ ...data, createdAt: now, updatedAt: now })
  }
}

export async function deleteSprint(scenarioId: ScenarioId, sprintNumber: number): Promise<void> {
  await db.sprints
    .where('[scenarioId+sprintNumber]')
    .equals([scenarioId, sprintNumber])
    .delete()
}
