import { db } from '../db/database'
import type { ImageRecord } from '../types'

function getExt(dataUrl: string): string {
  const m = dataUrl.match(/^data:image\/([^;+]+)/)
  if (!m) return 'png'
  return m[1] === 'jpeg' ? 'jpg' : m[1]
}

/** Construye la ruta relativa (dentro de exported-images/) para cada imagen */
function buildRelativePath(img: ImageRecord, counters: Map<string, number>): string {
  const key = `${img.entityType}:${img.entityKey}`
  const idx = (counters.get(key) ?? 0) + 1
  counters.set(key, idx)
  const ext = getExt(img.data)
  const parts = img.entityKey.split('_')

  if (img.entityType === 'sprint_observation') {
    // entityKey: "{scenarioId}_{sprintNumber}"
    return `escenario-${parts[0]}/sprint-${parts[1]}/obs-${idx}.${ext}`
  }
  if (img.entityType === 'incidence') {
    // entityKey: "{scenarioId}_{sprintNumber}_{uuid}"
    return `escenario-${parts[0]}/sprint-${parts[1]}/inc-${idx}.${ext}`
  }
  if (img.entityType === 'prompt_eval') {
    // entityKey: "{promptId}_{scenarioId}"
    return `escenario-${parts[1]}/prompts/prompt-${parts[0]}-${idx}.${ext}`
  }
  return `otros/${img.entityKey}-${idx}.${ext}`
}

async function saveImages(images: ImageRecord[]): Promise<void> {
  if (images.length === 0) {
    alert('No hay imágenes para descargar.')
    return
  }
  const counters = new Map<string, number>()
  const payload = images.map(img => ({
    path: buildRelativePath(img, counters),
    data: img.data,
  }))
  const res = await fetch('/api/save-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: payload }),
  })
  const json = await res.json() as { ok?: boolean; count?: number; folder?: string; error?: string }
  if (!res.ok || json.error) throw new Error(json.error ?? 'Error desconocido')
  alert(`${json.count} imagen(es) guardada(s) en:\n${json.folder}`)
}

export async function downloadSprintImages(scenarioId: string, sprintNumber: number): Promise<void> {
  const sprintKey = `${scenarioId}_${sprintNumber}`
  const all = await db.images.toArray()
  const images = all.filter(img =>
    (img.entityType === 'sprint_observation' && img.entityKey === sprintKey) ||
    (img.entityType === 'incidence' && img.entityKey.startsWith(`${sprintKey}_`))
  )
  await saveImages(images)
}

export async function downloadScenarioImages(scenarioId: string): Promise<void> {
  const all = await db.images.toArray()
  const images = all.filter(img => {
    if (img.entityType === 'sprint_observation' || img.entityType === 'incidence') {
      return img.entityKey.startsWith(`${scenarioId}_`)
    }
    if (img.entityType === 'prompt_eval') {
      return img.entityKey.endsWith(`_${scenarioId}`)
    }
    return false
  })
  await saveImages(images)
}

export async function downloadAllImages(): Promise<void> {
  const images = await db.images.toArray()
  await saveImages(images)
}
