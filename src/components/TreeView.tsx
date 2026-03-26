import { useState, useMemo, useCallback, useRef } from 'react'
import { isTimestampClaim } from '../lib/timeUtils'
import { formatLocalTime } from '../lib/timeUtils'

// ─── Path matching ───────────────────────────────────────────────────────────

function matchesSearch(value: unknown, query: string): boolean {
  if (!query) return false
  const q = query.toLowerCase()
  if (typeof value === 'string') return value.toLowerCase().includes(q)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).includes(q)
  return false
}

/**
 * Collect all paths in the tree that match the query (by key or value).
 */
function collectMatches(
  obj: unknown,
  query: string,
  path: string,
  results: Set<string>,
): void {
  if (!query) return
  const q = query.toLowerCase()

  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      const childPath = `${path}[${i}]`
      collectMatches(v, query, childPath, results)
    })
  } else if (obj !== null && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const childPath = path ? `${path}.${k}` : k
      if (k.toLowerCase().includes(q)) results.add(childPath)
      collectMatches(v, query, childPath, results)
    }
  } else {
    if (matchesSearch(obj, query)) results.add(path)
  }
}

// ─── Tree node ───────────────────────────────────────────────────────────────

interface NodeProps {
  nodeKey: string | number | null
  value: unknown
  depth: number
  path: string
  matchedPaths: Set<string>
  context: 'header' | 'payload'
}

function TreeNode({ nodeKey, value, depth, path, matchedPaths, context }: NodeProps) {
  const isArr = Array.isArray(value)
  const isObj = !isArr && value !== null && typeof value === 'object'
  const isCollapsible = isArr || isObj
  const isHighlighted = matchedPaths.size > 0 && matchedPaths.has(path)
  const [open, setOpen] = useState(depth < 3)

  const pl = depth * 14

  // Determine key color matching Phase 1 ClaimRow logic
  const STANDARD_CLAIMS = new Set(['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'])
  let keyClass = 'text-success'
  if (context === 'header' || depth > 0) keyClass = 'text-text-secondary'
  else if (typeof nodeKey === 'string' && STANDARD_CLAIMS.has(nodeKey)) keyClass = 'text-accent'

  const keyEl = nodeKey !== null ? (
    <span className={`${keyClass} shrink-0 mr-1`}>
      {typeof nodeKey === 'number'
        ? <span className="text-text-muted">{nodeKey}</span>
        : `"${nodeKey}"`}
      <span className="text-text-muted mx-0.5">:</span>
    </span>
  ) : null

  const highlightClass = isHighlighted
    ? 'bg-warning/15 border-l-2 border-warning rounded'
    : 'hover:bg-surface-700/30 rounded'

  if (isCollapsible) {
    const entries = Object.entries(value as object)
    const count = entries.length
    const [ob, cb] = isArr ? ['[', ']'] : ['{', '}']

    if (count === 0) {
      return (
        <div
          className={`flex items-center gap-0.5 py-0.5 px-1 text-xs font-mono ${highlightClass}`}
          style={{ paddingLeft: `${pl + 4}px` }}
        >
          <span className="w-3" />
          {keyEl}
          <span className="text-text-muted">{ob}{cb}</span>
        </div>
      )
    }

    return (
      <div>
        <button
          className={`w-full text-left flex items-center gap-0.5 py-0.5 px-1 text-xs font-mono ${highlightClass}`}
          style={{ paddingLeft: `${pl + 4}px` }}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-text-muted text-[10px] w-3 shrink-0 select-none">
            {open ? '▾' : '▸'}
          </span>
          {keyEl}
          <span className="text-text-muted">{ob}</span>
          {!open && (
            <span className="text-text-muted italic ml-1">
              {isArr ? `${count} items` : `${count} keys`}
            </span>
          )}
        </button>

        {open && (
          <>
            {entries.map(([k, v]) => {
              const childKey = isArr ? Number(k) : k
              const childPath = path === ''
                ? String(k)
                : isArr ? `${path}[${k}]` : `${path}.${k}`
              return (
                <TreeNode
                  key={k}
                  nodeKey={childKey}
                  value={v}
                  depth={depth + 1}
                  path={childPath}
                  matchedPaths={matchedPaths}
                  context={context}
                />
              )
            })}
            <div
              className="py-0.5 px-1 text-text-muted text-xs font-mono"
              style={{ paddingLeft: `${(depth + 1) * 14 + 4}px` }}
            >
              {cb}
            </div>
          </>
        )}
      </div>
    )
  }

  // Primitive values
  let valueEl: React.ReactNode
  const isTimestamp =
    context === 'payload' &&
    typeof nodeKey === 'string' &&
    isTimestampClaim(nodeKey, value)

  if (value === null) {
    valueEl = <span className="text-danger/70 italic">null</span>
  } else if (typeof value === 'boolean') {
    valueEl = <span className="text-warning">{String(value)}</span>
  } else if (typeof value === 'number') {
    valueEl = (
      <span className="flex items-center gap-2 flex-wrap">
        <span className="text-success">{String(value)}</span>
        {isTimestamp && (
          <span className="text-warning/80 text-xs not-italic">// {formatLocalTime(value)}</span>
        )}
      </span>
    )
  } else if (typeof value === 'string') {
    valueEl = <span className="text-orange-300 break-all">"{value}"</span>
  } else {
    valueEl = <span className="text-text-muted">{JSON.stringify(value)}</span>
  }

  return (
    <div
      className={`flex items-start gap-0.5 py-0.5 px-1 text-xs font-mono ${highlightClass}`}
      style={{ paddingLeft: `${pl + 16}px` }}
    >
      {keyEl}
      {valueEl}
    </div>
  )
}

// ─── Public component ────────────────────────────────────────────────────────

interface Props {
  data: Record<string, unknown>
  context: 'header' | 'payload'
  title: string
  headerBadge?: React.ReactNode
}

export function TreeView({ data, context, title, headerBadge }: Props) {
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const matchedPaths = useMemo<Set<string>>(() => {
    if (!query.trim()) return new Set()
    const results = new Set<string>()
    collectMatches(data, query.trim(), '', results)
    return results
  }, [data, query])

  const toggleSearch = useCallback(() => {
    setShowSearch((v) => {
      if (!v) setTimeout(() => searchRef.current?.focus(), 50)
      else setQuery('')
      return !v
    })
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearch(false)
      setQuery('')
    }
  }, [])

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-surface-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
            {title}
          </span>
          {headerBadge}
        </div>
        <button
          onClick={toggleSearch}
          title="Search claims (Ctrl+F)"
          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
            showSearch ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent'
          }`}
        >
          ⌕
        </button>
      </div>

      {showSearch && (
        <div className="px-3 py-2 border-b border-surface-700">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search key or value…"
            className="w-full bg-surface-700 border border-surface-600 text-text-primary text-xs rounded px-2 py-1
                       focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          {query && (
            <p className="text-text-muted text-xs mt-1">
              {matchedPaths.size === 0
                ? 'No matches'
                : `${matchedPaths.size} match${matchedPaths.size > 1 ? 'es' : ''}`}
            </p>
          )}
        </div>
      )}

      <div className="py-2 overflow-auto max-h-96">
        {Object.entries(data).map(([k, v]) => (
          <TreeNode
            key={k}
            nodeKey={k}
            value={v}
            depth={0}
            path={k}
            matchedPaths={matchedPaths}
            context={context}
          />
        ))}
      </div>
    </div>
  )
}
