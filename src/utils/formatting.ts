export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—'
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatScore(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(1)} / 5`
}

export function formatHours(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(1)}h`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return String(value)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return iso.slice(0, 10) // YYYY-MM-DD
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export function formatDelta(value: number | null, baseline: number | null): string {
  if (value == null || baseline == null || baseline === 0) return ''
  const pct = ((value - baseline) / baseline) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}
