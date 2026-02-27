import type { ScenarioId, SprintStatus, IncidenceType, RetrievalMechanism } from './enums'

export interface Incidence {
  id: string
  description: string
  type: IncidenceType
  resolutionTime: number | null // minutos
}

export interface SprintRecord {
  id?: number
  scenarioId: ScenarioId
  sprintNumber: number // 7–23
  status: SprintStatus

  // Datos generales
  dateStart: string | null
  dateEnd: string | null
  tts: number | null        // horas totales (legacy / manual override)
  ttsFeature: number | null // horas dedicadas a features
  ttsFix: number | null     // horas dedicadas a correcciones/fixes
  description: string

  // Fuentes primarias
  commits: number | null
  filesCreated: number | null
  filesModified: number | null
  testsTotal: number | null
  testsPass: number | null
  testsFail: number | null

  // Métricas derivadas
  verificationTime: number | null // horas
  manualEdits: number | null
  correctivePrompts: number | null
  rejectedProposals: number | null
  humanRevisions: number | null      // revisiones humanas aceptadas (total = auto + manual extra)
  autoCorrectivePrompts: number | null
  autoRejectedProposals: number | null
  autoHumanRevisions: number | null  // sum de humanRevisions de evaluaciones de prompt vinculadas

  // D1 Contexto efectivo
  filesReadByAI: number | null
  filesTotalRepo: number | null
  retrievalMechanism: RetrievalMechanism | null
  contextCoherence: number | null // D1b — Escala 1–5: coherencia contextual percibida

  // D2 Autonomía vs control
  autonomousActions: number | null
  controlCheckpoints: number | null

  // D3 Edición multiarchivo
  linesAdded: number | null   // git diff --shortstat: insertions
  linesRemoved: number | null // git diff --shortstat: deletions
  architecturalCoherence: number | null // 1–5
  gitFromCommit: string | null // rango de commits usado en el cálculo
  gitToCommit: string | null

  // D4 Éxito operacional
  buildsOk: number | null
  buildsFailed: number | null
  buildsTotal: number | null // calculado: buildsOk + buildsFailed
  envFailures: number | null

  // D6 Calidad mantenible
  tsWarnings: number | null
  linterWarnings: number | null
  styleConsistency: number | null // 1–5
  uiUxQuality: number | null      // 1–5

  // Incidencias (JSON embebido)
  incidences: Incidence[]

  // Observaciones libres
  observations: string

  createdAt: string
  updatedAt: string
}
