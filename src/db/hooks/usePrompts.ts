import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../database'
import type { PromptEvaluation, PromptRecord, ScenarioId } from '../../types'

export interface PromptEvaluationLinked extends PromptEvaluation {
  prompt: PromptRecord | null
}

interface SprintKey {
  scenarioId: ScenarioId
  sprintNumber: number
}

function dedupeSprintKeys(keys: SprintKey[]): SprintKey[] {
  const map = new Map<string, SprintKey>()
  for (const key of keys) {
    map.set(`${key.scenarioId}-${key.sprintNumber}`, key)
  }
  return Array.from(map.values())
}

function collectSprintKeysFromEvaluations(evaluations: PromptEvaluation[]): SprintKey[] {
  const keys: SprintKey[] = []
  for (const evaluation of evaluations) {
    if (evaluation.sprintNumber != null) {
      keys.push({ scenarioId: evaluation.scenarioId, sprintNumber: evaluation.sprintNumber })
    }
  }
  return dedupeSprintKeys(keys)
}

async function syncSprintPromptCounters(scenarioId: ScenarioId, sprintNumber: number): Promise<void> {
  const sprint = await db.sprints
    .where('[scenarioId+sprintNumber]')
    .equals([scenarioId, sprintNumber])
    .first()

  if (!sprint || sprint.id == null) return

  const evaluations = await db.promptEvaluations
    .where('scenarioId')
    .equals(scenarioId)
    .filter((evaluation) => evaluation.sprintNumber === sprintNumber)
    .toArray()

  const promptIds = Array.from(new Set(evaluations.map((evaluation) => evaluation.promptId)))
  const prompts = promptIds.length > 0 ? await db.prompts.bulkGet(promptIds) : []
  const promptCategoryMap = new Map<number, PromptRecord['category']>()
  prompts.forEach((prompt) => {
    if (prompt?.id != null) {
      promptCategoryMap.set(prompt.id, prompt.category)
    }
  })

  const autoCorrective = evaluations.filter(
    (evaluation) => promptCategoryMap.get(evaluation.promptId) === 'corrective'
  ).length

  const autoRejected = evaluations.filter(
    (evaluation) =>
      evaluation.wasAccepted === false ||
      (evaluation.quality != null && evaluation.quality <= 2)
  ).length

  const autoHumanRevisions = evaluations.reduce(
    (sum, evaluation) => sum + (evaluation.humanRevisions ?? 0),
    0
  )

  const currentCorrective = sprint.correctivePrompts ?? 0
  const currentRejected = sprint.rejectedProposals ?? 0
  const currentHumanRevisions = sprint.humanRevisions ?? 0

  const prevAutoCorrective = sprint.autoCorrectivePrompts ?? 0
  const prevAutoRejected = sprint.autoRejectedProposals ?? 0
  const prevAutoHumanRevisions = sprint.autoHumanRevisions ?? 0

  const hasCorrectiveMeta = sprint.autoCorrectivePrompts != null
  const hasRejectedMeta = sprint.autoRejectedProposals != null
  const hasHumanRevisionsMeta = sprint.autoHumanRevisions != null

  const manualCorrective = hasCorrectiveMeta
    ? Math.max(currentCorrective - prevAutoCorrective, 0)
    : Math.max(currentCorrective - autoCorrective, 0)

  const manualRejected = hasRejectedMeta
    ? Math.max(currentRejected - prevAutoRejected, 0)
    : Math.max(currentRejected - autoRejected, 0)

  const manualHumanRevisions = hasHumanRevisionsMeta
    ? Math.max(currentHumanRevisions - prevAutoHumanRevisions, 0)
    : Math.max(currentHumanRevisions - autoHumanRevisions, 0)

  const nextCorrectiveTotal = manualCorrective + autoCorrective
  const nextRejectedTotal = manualRejected + autoRejected
  const nextHumanRevisionsTotal = manualHumanRevisions + autoHumanRevisions

  const correctiveValue = nextCorrectiveTotal > 0 ? nextCorrectiveTotal : null
  const rejectedValue = nextRejectedTotal > 0 ? nextRejectedTotal : null
  const humanRevisionsValue = nextHumanRevisionsTotal > 0 ? nextHumanRevisionsTotal : null
  const autoCorrectiveValue = autoCorrective > 0 ? autoCorrective : null
  const autoRejectedValue = autoRejected > 0 ? autoRejected : null
  const autoHumanRevisionsValue = autoHumanRevisions > 0 ? autoHumanRevisions : null

  const changed =
    sprint.correctivePrompts !== correctiveValue ||
    sprint.rejectedProposals !== rejectedValue ||
    sprint.humanRevisions !== humanRevisionsValue ||
    sprint.autoCorrectivePrompts !== autoCorrectiveValue ||
    sprint.autoRejectedProposals !== autoRejectedValue ||
    sprint.autoHumanRevisions !== autoHumanRevisionsValue

  if (!changed) return

  await db.sprints.update(sprint.id, {
    correctivePrompts: correctiveValue,
    rejectedProposals: rejectedValue,
    humanRevisions: humanRevisionsValue,
    autoCorrectivePrompts: autoCorrectiveValue,
    autoRejectedProposals: autoRejectedValue,
    autoHumanRevisions: autoHumanRevisionsValue,
    updatedAt: new Date().toISOString(),
  })
}

async function syncSprintPromptCountersForKeys(keys: SprintKey[]): Promise<void> {
  const uniqueKeys = dedupeSprintKeys(keys)
  for (const key of uniqueKeys) {
    await syncSprintPromptCounters(key.scenarioId, key.sprintNumber)
  }
}

export async function recomputeAllSprintPromptCounters(): Promise<void> {
  const allEvaluations = await db.promptEvaluations.toArray()
  const keysFromEvaluations = collectSprintKeysFromEvaluations(allEvaluations)

  const sprintsWithAuto = await db.sprints
    .toCollection()
    .filter(
      (sprint) =>
        (sprint.autoCorrectivePrompts ?? 0) > 0 ||
        (sprint.autoRejectedProposals ?? 0) > 0 ||
        (sprint.autoHumanRevisions ?? 0) > 0
    )
    .toArray()

  const keysFromSprints: SprintKey[] = sprintsWithAuto.map((sprint) => ({
    scenarioId: sprint.scenarioId,
    sprintNumber: sprint.sprintNumber,
  }))

  await syncSprintPromptCountersForKeys([...keysFromEvaluations, ...keysFromSprints])
}

export function useAllPrompts() {
  return useLiveQuery(() => db.prompts.orderBy('updatedAt').reverse().toArray(), [])
}

export function useAllPromptEvaluations() {
  return useLiveQuery(() => db.promptEvaluations.toArray(), [])
}

export function usePrompt(id: number) {
  return useLiveQuery(
    async () => {
      const result = await db.prompts.get(id)
      return result ?? null
    },
    [id]
  )
}

export function usePromptEvals(promptId: number) {
  return useLiveQuery(
    () => db.promptEvaluations.where('promptId').equals(promptId).toArray(),
    [promptId]
  )
}

export function usePromptEval(promptId: number, scenarioId: ScenarioId) {
  return useLiveQuery(
    async () => {
      const result = await db.promptEvaluations
        .where('[promptId+scenarioId]')
        .equals([promptId, scenarioId])
        .first()
      return result ?? null
    },
    [promptId, scenarioId]
  )
}

export function usePromptEvaluationsBySprint(scenarioId: ScenarioId, sprintNumber: number) {
  return useLiveQuery(
    async (): Promise<PromptEvaluationLinked[]> => {
      const evaluations = await db.promptEvaluations
        .where('scenarioId')
        .equals(scenarioId)
        .filter((evaluation) => evaluation.sprintNumber === sprintNumber)
        .toArray()

      if (evaluations.length === 0) return []

      const promptIds = Array.from(new Set(evaluations.map((evaluation) => evaluation.promptId)))
      const prompts = await db.prompts.bulkGet(promptIds)
      const promptMap = new Map<number, PromptRecord>()
      prompts.forEach((prompt) => {
        if (prompt?.id != null) promptMap.set(prompt.id, prompt)
      })

      return evaluations
        .map((evaluation) => ({
          ...evaluation,
          prompt: promptMap.get(evaluation.promptId) ?? null,
        }))
        .sort((a, b) => (a.promptId ?? 0) - (b.promptId ?? 0))
    },
    [scenarioId, sprintNumber]
  )
}

export function usePromptEvaluationsByScenario(scenarioId: ScenarioId) {
  return useLiveQuery(
    async (): Promise<PromptEvaluationLinked[]> => {
      const evaluations = await db.promptEvaluations
        .where('scenarioId')
        .equals(scenarioId)
        .toArray()

      if (evaluations.length === 0) return []

      const promptIds = Array.from(new Set(evaluations.map((evaluation) => evaluation.promptId)))
      const prompts = await db.prompts.bulkGet(promptIds)
      const promptMap = new Map<number, PromptRecord>()
      prompts.forEach((prompt) => {
        if (prompt?.id != null) promptMap.set(prompt.id, prompt)
      })

      return evaluations
        .map((evaluation) => ({
          ...evaluation,
          prompt: promptMap.get(evaluation.promptId) ?? null,
        }))
        .sort((a, b) => {
          const sprintA = a.sprintNumber ?? Number.MAX_SAFE_INTEGER
          const sprintB = b.sprintNumber ?? Number.MAX_SAFE_INTEGER
          if (sprintA !== sprintB) return sprintA - sprintB
          return (a.prompt?.title ?? '').localeCompare(b.prompt?.title ?? '')
        })
    },
    [scenarioId]
  )
}

export async function upsertPrompt(data: PromptRecord): Promise<number> {
  const now = new Date().toISOString()
  let savedId = 0

  await db.transaction('rw', db.prompts, db.promptEvaluations, db.sprints, async () => {
    const previous = data.id != null ? await db.prompts.get(data.id) : null

    if (data.id != null) {
      await db.prompts.update(data.id, { ...data, updatedAt: now })
      savedId = data.id
    } else {
      savedId = await db.prompts.add({ ...data, createdAt: now, updatedAt: now })
    }

    if (previous && previous.category !== data.category) {
      const evaluations = await db.promptEvaluations.where('promptId').equals(savedId).toArray()
      const touched = collectSprintKeysFromEvaluations(evaluations)
      await syncSprintPromptCountersForKeys(touched)
    }
  })

  return savedId
}

export async function deletePrompt(id: number): Promise<void> {
  await db.transaction('rw', db.prompts, db.promptEvaluations, db.sprints, async () => {
    const evaluations = await db.promptEvaluations.where('promptId').equals(id).toArray()
    const touched = collectSprintKeysFromEvaluations(evaluations)

    await db.promptEvaluations.where('promptId').equals(id).delete()
    await db.prompts.delete(id)

    await syncSprintPromptCountersForKeys(touched)
  })
}

export async function upsertEvaluation(data: PromptEvaluation): Promise<void> {
  const now = new Date().toISOString()

  await db.transaction('rw', db.promptEvaluations, db.prompts, db.sprints, async () => {
    const existing = await db.promptEvaluations
      .where('[promptId+scenarioId]')
      .equals([data.promptId, data.scenarioId])
      .first()

    if (existing?.id != null) {
      await db.promptEvaluations.update(existing.id, { ...data, updatedAt: now })
    } else {
      await db.promptEvaluations.add({ ...data, createdAt: now, updatedAt: now })
    }

    const touched: SprintKey[] = []
    if (existing?.sprintNumber != null) {
      touched.push({ scenarioId: existing.scenarioId, sprintNumber: existing.sprintNumber })
    }
    if (data.sprintNumber != null) {
      touched.push({ scenarioId: data.scenarioId, sprintNumber: data.sprintNumber })
    }
    await syncSprintPromptCountersForKeys(touched)
  })
}

export async function deleteEvaluation(promptId: number, scenarioId: ScenarioId): Promise<void> {
  await db.transaction('rw', db.promptEvaluations, db.prompts, db.sprints, async () => {
    const existing = await db.promptEvaluations
      .where('[promptId+scenarioId]')
      .equals([promptId, scenarioId])
      .first()

    await db.promptEvaluations
      .where('[promptId+scenarioId]')
      .equals([promptId, scenarioId])
      .delete()

    if (existing?.sprintNumber != null) {
      await syncSprintPromptCounters(existing.scenarioId, existing.sprintNumber)
    }
  })
}
