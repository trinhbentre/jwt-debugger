import { ShieldBadge } from './ShieldBadge'

interface Props {
  shieldMode: boolean
  onShieldToggle: () => void
}

export function Header({ shieldMode, onShieldToggle }: Props) {
  return (
    <header className="h-11 flex items-center px-4 gap-3 border-b border-surface-700 bg-surface-800 shadow-[0_1px_8px_rgba(0,0,0,0.4)] shrink-0">
      {/* Home link */}
      <a
        href="https://trinhbentre.github.io/"
        className="flex-shrink-0 text-text-muted hover:text-accent transition-colors"
        title="Back to homepage"
        aria-label="Back to homepage"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </a>

      {/* Divider */}
      <div className="w-px h-5 bg-surface-600 flex-shrink-0" />

      {/* Brand */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* Key icon */}
        <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="12" r="4" />
          <line x1="12" y1="12" x2="21" y2="12" />
          <line x1="19" y1="12" x2="19" y2="15" />
          <line x1="16" y1="12" x2="16" y2="14" />
        </svg>
        <span className="font-semibold tracking-tight text-sm text-text-primary">JWT PRO DEBUGGER</span>
        <span className="text-[10px] text-success/70 border border-success/20 rounded px-1.5 py-0.5 leading-none">🔒 Client-side</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-surface-600 mx-1 flex-shrink-0" />

      {/* Right — Shield Mode */}
      <div className="ml-auto flex items-center gap-2">
        <ShieldBadge active={shieldMode} onToggle={onShieldToggle} />
      </div>
    </header>
  )
}

