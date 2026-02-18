import type { SprintRecord } from '../types'

export function computeAutonomyRatio(
  autonomous: number | null,
  checkpoints: number | null
): number | null {
  if (autonomous == null || checkpoints == null) return null
  const total = autonomous + checkpoints
  if (total === 0) return null
  return autonomous / total
}

export function computeContextRatio(
  filesReadByAI: number | null,
  filesTotalRepo: number | null
): number | null {
  if (filesReadByAI == null || filesTotalRepo == null || filesTotalRepo === 0) return null
  return filesReadByAI / filesTotalRepo
}

export function computeBuildSuccessRate(
  buildsOk: number | null,
  buildsTotal: number | null
): number | null {
  if (buildsOk == null || buildsTotal == null || buildsTotal === 0) return null
  return buildsOk / buildsTotal
}

export function computeTestPassRate(
  testsPass: number | null,
  testsTotal: number | null
): number | null {
  if (testsPass == null || testsTotal == null || testsTotal === 0) return null
  return testsPass / testsTotal
}

export function getSprintCompletionCount(sprints: SprintRecord[]): number {
  return sprints.filter((s) => s.status === 'completed').length
}

export function getTotalTTS(sprints: SprintRecord[]): number {
  return sprints.reduce((acc, s) => acc + (s.tts ?? 0), 0)
}
