import { useCountdown } from '../hooks/useCountdown'
import { formatLocalTime, formatDuration, isTimestampClaim } from '../lib/timeUtils'

interface Props {
  timestamp: number
  claimKey: string
}

/** Sub-component that uses hook for live countdown — only rendered for exp */
function ExpiryCountdown({ timestamp }: { timestamp: number }) {
  const secondsLeft = useCountdown(timestamp)

  let badgeClass: string
  let label: string

  if (secondsLeft > 300) {
    badgeClass = 'bg-success/10 border-success/30 text-success'
    label = `Expires in ${formatDuration(secondsLeft)}`
  } else if (secondsLeft > 60) {
    badgeClass = 'bg-warning/10 border-warning/30 text-warning'
    label = `Expires in ${formatDuration(secondsLeft)}`
  } else if (secondsLeft > 0) {
    badgeClass = 'bg-danger/10 border-danger/30 text-danger'
    label = `Expires in ${formatDuration(secondsLeft)}`
  } else {
    badgeClass = 'bg-danger/10 border-danger/30 text-danger'
    label = `Expired ${formatDuration(secondsLeft)} ago`
  }

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${badgeClass}`}>
      {label}
    </span>
  )
}

export function TimeBadge({ timestamp, claimKey }: Props) {
  if (!isTimestampClaim(claimKey, timestamp)) return null

  return (
    <span className="flex flex-col gap-0.5 ml-2 shrink-0">
      <span className="text-text-muted text-xs">// {formatLocalTime(timestamp)}</span>
      {claimKey === 'exp' && <ExpiryCountdown timestamp={timestamp} />}
    </span>
  )
}
