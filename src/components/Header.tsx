import { AppHeader } from '@web-tools/ui'
import { ShieldBadge } from './ShieldBadge'

function JwtIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="12" r="4" />
      <line x1="12" y1="12" x2="21" y2="12" />
      <line x1="19" y1="12" x2="19" y2="15" />
      <line x1="16" y1="12" x2="16" y2="14" />
    </svg>
  )
}

interface Props {
  shieldMode: boolean
  onShieldToggle: () => void
}

export function Header({ shieldMode, onShieldToggle }: Props) {
  return (
    <AppHeader
      toolName="JWT Pro Debugger"
      toolIcon={<JwtIcon />}
      actions={<ShieldBadge active={shieldMode} onToggle={onShieldToggle} />}
    />
  )
}

