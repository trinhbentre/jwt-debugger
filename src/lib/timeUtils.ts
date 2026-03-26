export const TIMESTAMP_CLAIMS = new Set(['exp', 'iat', 'nbf', 'auth_time'])

export function isTimestampClaim(key: string, value: unknown): boolean {
  return TIMESTAMP_CLAIMS.has(key) && typeof value === 'number'
}

export function formatLocalTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(ts * 1000))
}

export function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds)
  if (abs < 60) return `${abs}s`
  if (abs < 3600) return `${Math.floor(abs / 60)}m ${abs % 60}s`
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ${Math.floor((abs % 3600) / 60)}m`
  return `${Math.floor(abs / 86400)}d ${Math.floor((abs % 86400) / 3600)}h`
}
