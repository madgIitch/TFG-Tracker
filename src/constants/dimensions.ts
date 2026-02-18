export interface DimensionDefinition {
  id: string
  label: string
  description: string
}

export const DIMENSION_DEFINITIONS: DimensionDefinition[] = [
  {
    id: 'D1',
    label: 'D1 — Contexto efectivo',
    description: 'Qué parte del repositorio usa realmente la IA (ficheros accedidos / total)',
  },
  {
    id: 'D2',
    label: 'D2 — Autonomía vs. control',
    description: 'Ratio acciones autónomas / (autónomas + controladas)',
  },
  {
    id: 'D3',
    label: 'D3 — Edición multiarchivo',
    description: 'Capacidad de modificar varios ficheros manteniendo coherencia arquitectónica',
  },
  {
    id: 'D4',
    label: 'D4 — Éxito operacional',
    description: 'Tasa de builds exitosos y fallos de entorno',
  },
  {
    id: 'D5',
    label: 'D5 — Eficiencia total',
    description: 'TTS acumulado + iteraciones (commits) + retrabajo',
  },
  {
    id: 'D6',
    label: 'D6 — Calidad mantenible',
    description: 'Warnings estáticos (TS + linter) + consistencia de estilos',
  },
]
