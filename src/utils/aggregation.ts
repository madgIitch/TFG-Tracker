import type { SprintRecord, ScenarioId } from '../types'
import {
  computeAutonomyRatio,
  computeContextRatio,
  computeBuildSuccessRate,
  computeTestPassRate,
} from './metrics'
import { getSprintTTS } from '../components/compare/BudgetPanel'

export interface AggregatedScenarioMetrics {
  scenarioId: ScenarioId
  completedSprints: number
  totalSprints: number

  // D5 Eficiencia
  totalTTS: number | null
  totalCommits: number | null
  totalManualEdits: number | null
  totalCorrectivePrompts: number | null
  totalRejectedProposals: number | null
  totalVerificationTime: number | null

  // D4 Éxito operacional
  buildSuccessRate: number | null // 0–1
  totalEnvFailures: number | null
  testPassRate: number | null

  // D6 Calidad
  totalTsWarnings: number | null
  totalLinterWarnings: number | null
  avgStyleConsistency: number | null
  avgUiUxQuality: number | null

  // D1 Contexto
  avgContextRatio: number | null
  avgContextCoherence: number | null

  // Prompts
  avgPromptQuality: number | null

  // D2 Autonomía
  avgAutonomyRatio: number | null
  totalAutonomousActions: number | null
  totalControlCheckpoints: number | null

  // D3 Multiarchivo
  avgArchitecturalCoherence: number | null
  totalFilesModified: number | null

  // Incidencias
  totalIncidences: number
  avgResolutionTime: number | null
}

function sumNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null)
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : null
}

function avgNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null)
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

export function aggregateScenario(
  scenarioId: ScenarioId,
  sprints: SprintRecord[]
): AggregatedScenarioMetrics {
  const completed = sprints.filter((s) => s.status === 'completed')

  // Builds acumulados (sum ok / sum total)
  const totalBuildsOk = sumNullable(sprints.map((s) => s.buildsOk))
  const totalBuildsTotal = sumNullable(sprints.map((s) => s.buildsTotal))
  const buildSuccessRate = computeBuildSuccessRate(totalBuildsOk, totalBuildsTotal)

  // Tests acumulados
  const totalTestsPass = sumNullable(sprints.map((s) => s.testsPass))
  const totalTestsTotal = sumNullable(sprints.map((s) => s.testsTotal))
  const testPassRate = computeTestPassRate(totalTestsPass, totalTestsTotal)

  // Autonomía por sprint → media
  const autonomyRatios = sprints.map((s) =>
    computeAutonomyRatio(s.autonomousActions, s.controlCheckpoints)
  )
  const avgAutonomyRatio = avgNullable(autonomyRatios)

  // Contexto por sprint → media
  const contextRatios = sprints.map((s) =>
    computeContextRatio(s.filesReadByAI, s.filesTotalRepo)
  )
  const avgContextRatio = avgNullable(contextRatios)

  // Incidencias
  const allIncidences = sprints.flatMap((s) => s.incidences ?? [])
  const resolutionTimes = allIncidences
    .map((i) => i.resolutionTime)
    .filter((t): t is number => t != null)
  const avgResolutionTime =
    resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : null

  return {
    scenarioId,
    completedSprints: completed.length,
    totalSprints: sprints.length,

    // D5
    totalTTS: sumNullable(sprints.map((s) => getSprintTTS(s))),
    totalCommits: sumNullable(sprints.map((s) => s.commits)),
    totalManualEdits: sumNullable(sprints.map((s) => s.manualEdits)),
    totalCorrectivePrompts: sumNullable(sprints.map((s) => s.correctivePrompts)),
    totalRejectedProposals: sumNullable(sprints.map((s) => s.rejectedProposals)),
    totalVerificationTime: sumNullable(sprints.map((s) => s.ttsFix)),

    // D4
    buildSuccessRate,
    totalEnvFailures: sumNullable(sprints.map((s) => s.envFailures)),
    testPassRate,

    // D6
    totalTsWarnings: sumNullable(sprints.map((s) => s.tsWarnings)),
    totalLinterWarnings: sumNullable(sprints.map((s) => s.linterWarnings)),
    avgStyleConsistency: avgNullable(sprints.map((s) => s.styleConsistency)),
    avgUiUxQuality: avgNullable(sprints.map((s) => s.uiUxQuality)),

    // D1
    avgContextRatio,
    avgContextCoherence: avgNullable(sprints.map((s) => s.contextCoherence ?? null)),

    // Prompts — se rellena externamente en ComparePage
    avgPromptQuality: null,

    // D2
    avgAutonomyRatio,
    totalAutonomousActions: sumNullable(sprints.map((s) => s.autonomousActions)),
    totalControlCheckpoints: sumNullable(sprints.map((s) => s.controlCheckpoints)),

    // D3
    avgArchitecturalCoherence: avgNullable(sprints.map((s) => s.architecturalCoherence)),
    totalFilesModified: sumNullable(sprints.map((s) => s.filesModified)),

    // Incidencias
    totalIncidences: allIncidences.length,
    avgResolutionTime,
  }
}
