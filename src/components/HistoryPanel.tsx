import { useState, useCallback } from 'react'
import type { HistoryEntry } from '../types/jwt'

interface Props {
  entries: HistoryEntry[]
  password: string
  onSetPassword: (p: string) => void
  onLoad: (entry: HistoryEntry) => Promise<void>
  onRemove: (id: string) => void
  onClearAll: () => void
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function HistoryPanel({
  entries,
  password,
  onSetPassword,
  onLoad,
  onRemove,
  onClearAll,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showPwInput, setShowPwInput] = useState(false)

  const handleLoad = useCallback(
    async (entry: HistoryEntry) => {
      setLoadingId(entry.id)
      setErrorId(null)
      try {
        await onLoad(entry)
      } catch {
        setErrorId(entry.id)
      } finally {
        setLoadingId(null)
      }
    },
    [onLoad],
  )

  const hasEncrypted = entries.some((e) => e.encrypted)

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2 border-b border-surface-700 flex items-center justify-between hover:bg-surface-700/50 transition-colors"
      >
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
          History
          {entries.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-surface-700 text-text-muted">
              {entries.length}
            </span>
          )}
        </span>
        <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-3 flex flex-col gap-2">
          {/* Password field (shown when history has encrypted entries or user toggles) */}
          {(hasEncrypted || showPwInput) && (
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs flex items-center gap-1">
                🔑 Encryption password
                <span className="text-text-muted opacity-60">
                  (new: entries saved encrypted)
                </span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => onSetPassword(e.target.value)}
                placeholder="Leave blank to store unencrypted"
                className="bg-surface-700 border border-surface-600 text-text-primary text-xs rounded px-2 py-1.5
                           focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-2">
            {!showPwInput && !hasEncrypted && (
              <button
                onClick={() => setShowPwInput(true)}
                className="text-text-muted hover:text-accent text-xs transition-colors"
              >
                + Set password
              </button>
            )}
            {entries.length > 0 && !confirmClear && (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-text-muted hover:text-danger text-xs transition-colors ml-auto"
              >
                Clear all
              </button>
            )}
            {confirmClear && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-warning text-xs">Clear all history?</span>
                <button
                  onClick={() => { onClearAll(); setConfirmClear(false) }}
                  className="text-danger hover:underline text-xs"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-text-muted hover:underline text-xs"
                >
                  No
                </button>
              </div>
            )}
          </div>

          {/* Entry list */}
          {entries.length === 0 ? (
            <p className="text-text-muted text-xs">
              No history yet. Decoded tokens will be saved here automatically.
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-2 px-2 py-2 rounded bg-surface-700/50 hover:bg-surface-700 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="font-mono text-xs text-text-primary truncate">
                      {entry.encrypted ? '🔒 ' : ''}{entry.preview}
                    </span>
                    <span className="text-text-muted text-xs">{formatTime(entry.timestamp)}</span>
                    {errorId === entry.id && (
                      <span className="text-danger text-xs">Wrong password</span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleLoad(entry)}
                      disabled={loadingId === entry.id}
                      className="text-accent hover:underline text-xs disabled:opacity-50"
                      title="Load into active tab"
                    >
                      {loadingId === entry.id ? '…' : 'Load'}
                    </button>
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="text-text-muted hover:text-danger text-xs"
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
