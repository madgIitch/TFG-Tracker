import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../database'
import type { ImageRecord } from '../../types'

export function useImages(entityType: string, entityKey: string): ImageRecord[] {
  return (
    useLiveQuery(
      () =>
        db.images
          .where('[entityType+entityKey]')
          .equals([entityType, entityKey])
          .sortBy('createdAt'),
      [entityType, entityKey]
    ) ?? []
  )
}

export async function addImage(
  entityType: string,
  entityKey: string,
  dataUrl: string
): Promise<void> {
  await db.images.add({
    entityType,
    entityKey,
    data: dataUrl,
    createdAt: new Date().toISOString(),
  })
}

export async function deleteImage(id: number): Promise<void> {
  await db.images.delete(id)
}
