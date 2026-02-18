import type { ScenarioId } from './enums'

export type AcceptanceKey =
  | 'sprint7'
  | 'sprint8'
  | 'sprint9'
  | 'sprint10'
  | 'sprint11'
  | 'sprint12'
  | 'sprint13'
  | 'sprint14'
  | 'sprint15'
  | 'sprint16'
  | 'sprint17'
  | 'sprint18'
  | 'sprint19'
  | 'sprint20'
  | 'sprint21'
  | 'sprint22'
  | 'sprint23'
  | 'functionalParity'

export type AcceptanceChecklist = Record<AcceptanceKey, boolean>

export interface ScenarioNarrative {
  strengths: string
  weaknesses: string
  generalExperience: string
}

export interface ScenarioRecord {
  id?: number
  scenarioId: ScenarioId
  acceptanceChecklist: AcceptanceChecklist
  narrative: ScenarioNarrative
  updatedAt: string
}
