import { useState, useEffect, useCallback } from 'react'
import type { SprintRecord, ScenarioId, Incidence } from '../types'
import { computeAutonomyRatio, computeContextRatio } from '../utils/metrics'

function defaultRecord(scenarioId: ScenarioId, sprintNumber: number): SprintRecord {
  const now = new Date().toISOString()
  return {
    scenarioId,
    sprintNumber,
    status: 'pending',
    dateStart: null,
    dateEnd: null,
    tts: null,
    description: '',
    commits: null,
    filesCreated: null,
    filesModified: null,
    testsTotal: null,
    testsPass: null,
    testsFail: null,
    verificationTime: null,
    manualEdits: null,
    correctivePrompts: null,
    rejectedProposals: null,
    autoCorrectivePrompts: null,
    autoRejectedProposals: null,
    filesReadByAI: null,
    filesTotalRepo: null,
    retrievalMechanism: null,
    autonomousActions: null,
    controlCheckpoints: null,
    architecturalCoherence: null,
    buildsOk: null,
    buildsTotal: null,
    envFailures: null,
    tsWarnings: null,
    linterWarnings: null,
    styleConsistency: null,
    incidences: [],
    observations: '',
    createdAt: now,
    updatedAt: now,
  }
}

export interface SprintFormDerived {
  autonomyRatio: number | null
  contextRatio: number | null
}

export function useSprintForm(
  scenarioId: ScenarioId,
  sprintNumber: number,
  initial: SprintRecord | undefined | null
) {
  const [formData, setFormData] = useState<SprintRecord>(() =>
    initial ?? defaultRecord(scenarioId, sprintNumber)
  )

  // Sincronizar cuando llega el registro de la BD (puede ser undefined al inicio)
  useEffect(() => {
    if (initial != null) {
      setFormData(initial)
    }
  }, [initial])

  const updateField = useCallback(
    <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const addIncidence = useCallback(() => {
    const newIncidence: Incidence = {
      id: crypto.randomUUID(),
      description: '',
      type: 'lógica',
      resolutionTime: null,
    }
    setFormData((prev) => ({
      ...prev,
      incidences: [...prev.incidences, newIncidence],
    }))
  }, [])

  const updateIncidence = useCallback(
    (id: string, partial: Partial<Incidence>) => {
      setFormData((prev) => ({
        ...prev,
        incidences: prev.incidences.map((inc) =>
          inc.id === id ? { ...inc, ...partial } : inc
        ),
      }))
    },
    []
  )

  const removeIncidence = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      incidences: prev.incidences.filter((inc) => inc.id !== id),
    }))
  }, [])

  const derived: SprintFormDerived = {
    autonomyRatio: computeAutonomyRatio(
      formData.autonomousActions,
      formData.controlCheckpoints
    ),
    contextRatio: computeContextRatio(
      formData.filesReadByAI,
      formData.filesTotalRepo
    ),
  }

  return {
    formData,
    updateField,
    addIncidence,
    updateIncidence,
    removeIncidence,
    derived,
  }
}
