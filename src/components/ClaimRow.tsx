import { TimeBadge } from './TimeBadge'
import { isTimestampClaim } from '../lib/timeUtils'

const STANDARD_CLAIMS = new Set(['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'])

interface Props {
  claimKey: string
  value: unknown
  context: 'header' | 'payload'
}

export function ClaimRow({ claimKey, value, context }: Props) {
  let keyClass = 'text-success' // custom payload claims
  if (context === 'header') {
    keyClass = 'text-purple-400'
  } else if (STANDARD_CLAIMS.has(claimKey)) {
    keyClass = 'text-accent'
  }

  const isTimestamp = context === 'payload' && isTimestampClaim(claimKey, value)

  return (
    <div className="flex items-start gap-1 flex-wrap min-w-0">
      <span className={`${keyClass} shrink-0`}>"{claimKey}"</span>
      <span className="text-text-muted shrink-0">:</span>
      <span className="text-text-primary break-all">{JSON.stringify(value)}</span>
      {isTimestamp && (
        <TimeBadge timestamp={value as number} claimKey={claimKey} />
      )}
    </div>
  )
}
