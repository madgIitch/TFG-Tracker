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
  tts: number | null // horas de trabajo efectivo
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

  // D1 Contexto efectivo
  filesReadByAI: number | null
  filesTotalRepo: number | null
  retrievalMechanism: RetrievalMechanism | null

  // D2 Autonomía vs control
  autonomousActions: number | null
  controlCheckpoints: number | null

  // D3 Edición multiarchivo
  architecturalCoherence: number | null // 1–5

  // D4 Éxito operacional
  buildsOk: number | null
  buildsTotal: number | null
  envFailures: number | null

  // D6 Calidad mantenible
  tsWarnings: number | null
  linterWarnings: number | null
  styleConsistency: number | null // 1–5

  // Incidencias (JSON embebido)
  incidences: Incidence[]

  // Observaciones libres
  observations: string

  createdAt: string
  updatedAt: string
}
