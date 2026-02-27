export type ScenarioId = 'A' | 'B' | 'C' | 'D'

export type SprintStatus = 'pending' | 'in_progress' | 'completed'

export type IncidenceType =
  | 'lógica'
  | 'tipado'
  | 'integración'
  | 'alucinación'
  | 'entorno'

export type RetrievalMechanism =
  | 'indexado'
  | 'RAG'
  | 'manual'
  | 'context window'
  | 'mixto'

export type PromptCategory =
  | 'feature'
  | 'corrective'
  | 'debug'
  | 'refactor'
  | 'context'
  | 'context+feature'
  | 'context+debug'
  | 'corrective+feature'
  | 'debug+refactor'
  | 'context+refactor'
