import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function TokenInput({ value, onChange }: Props) {
  const [raw, setRaw] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sync when external value changes (e.g., loading from history)
  useEffect(() => {
    setRaw(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value
      setRaw(v)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onChange(v), 300)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    setRaw('')
    clearTimeout(debounceRef.current)
    onChange('')
  }, [onChange])

  // Token preview: color-coded parts
  const parts = raw.trim().split('.')
  const hasThreeParts = parts.length === 3 && raw.trim().length > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-text-muted text-xs uppercase tracking-wider">JWT Token</label>
        <div className="flex items-center gap-3">
          {raw.length > 0 && (
            <span className="text-text-muted text-xs">{raw.length} chars</span>
          )}
          {raw.length > 0 && (
            <button
              onClick={handleClear}
              className="text-text-muted hover:text-danger text-xs transition-colors"
              title="Clear token"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        className="min-h-[100px] bg-surface-800 border border-surface-700 rounded-lg p-3
                   font-mono text-sm text-text-primary placeholder-text-muted
                   focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent
                   resize-none"
        placeholder="Paste your JWT token here…"
        value={raw}
        onChange={handleChange}
        spellCheck={false}
      />

      {hasThreeParts && (
        <div className="flex items-center gap-0.5 text-xs font-mono overflow-hidden">
          <span className="text-red-400 truncate max-w-[8rem]" title={parts[0]}>
            {parts[0].length > 12 ? `${parts[0].substring(0, 12)}…` : parts[0]}
          </span>
          <span className="text-text-muted">.</span>
          <span className="text-purple-400 truncate max-w-[8rem]" title={parts[1]}>
            {parts[1].length > 12 ? `${parts[1].substring(0, 12)}…` : parts[1]}
          </span>
          <span className="text-text-muted">.</span>
          <span className="text-warning truncate max-w-[8rem]" title={parts[2]}>
            {parts[2].length > 12 ? `${parts[2].substring(0, 12)}…` : parts[2]}
          </span>
        </div>
      )}
    </div>
  )
}
