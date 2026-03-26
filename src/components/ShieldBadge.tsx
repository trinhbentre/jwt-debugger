interface Props {
  active: boolean
  onToggle: () => void
}

export function ShieldBadge({ active, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={active ? 'Shield Mode ON — no network calls allowed' : 'Shield Mode OFF — click to enable'}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
        active
          ? 'bg-success/10 border-success/40 text-success'
          : 'bg-surface-700 border-surface-600 text-text-muted hover:border-accent/40 hover:text-accent'
      }`}
    >
      <span>{active ? '🛡' : '🔓'}</span>
      <span>{active ? 'Shield Mode' : 'Shield Mode'}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-success' : 'bg-text-muted'}`} />
    </button>
  )
}
