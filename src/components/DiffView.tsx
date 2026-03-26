import { useState, useMemo } from 'react'
import { diffObjects, type DiffEntry } from '../lib/diffEngine'
import type { TokenTab } from '../types/jwt'

interface Props {
  tabs: TokenTab[]
}

type DiffSection = 'header' | 'payload'

const TYPE_STYLE: Record<DiffEntry['type'], string> = {
  added:     'bg-success/10 border-l-2 border-success text-success',
  removed:   'bg-danger/10  border-l-2 border-danger  text-danger',
  changed:   'bg-warning/10 border-l-2 border-warning text-warning',
  unchanged: '',
}

const TYPE_LABEL: Record<DiffEntry['type'], string> = {
  added:     '+ ',
  removed:   '− ',
  changed:   '~ ',
  unchanged: '  ',
}

function DiffRow({ entry }: { entry: DiffEntry }) {
  if (entry.type === 'unchanged') return null
  const style = TYPE_STYLE[entry.type]
  const label = TYPE_LABEL[entry.type]

  return (
    <div className={`px-3 py-1.5 font-mono text-xs rounded mb-0.5 flex gap-2 ${style}`}>
      <span className="shrink-0 opacity-70">{label}</span>
      <span className="text-text-secondary shrink-0">{entry.path}:</span>
      <span className="break-all">
        {entry.type === 'changed' ? (
          <>
            <span className="line-through opacity-60 mr-2">{JSON.stringify(entry.oldValue)}</span>
            <span>{JSON.stringify(entry.newValue)}</span>
          </>
        ) : entry.type === 'added' ? (
          JSON.stringify(entry.newValue)
        ) : (
          JSON.stringify(entry.oldValue)
        )}
      </span>
    </div>
  )
}

export function DiffView({ tabs }: Props) {
  const decodedTabs = tabs.filter((t) => t.decoded !== null)

  const [leftId, setLeftId] = useState<string>(decodedTabs[0]?.id ?? '')
  const [rightId, setRightId] = useState<string>(decodedTabs[1]?.id ?? '')
  const [section, setSection] = useState<DiffSection>('payload')
  const [showUnchanged, setShowUnchanged] = useState(false)

  const leftTab = tabs.find((t) => t.id === leftId)
  const rightTab = tabs.find((t) => t.id === rightId)

  const diffs = useMemo<DiffEntry[]>(() => {
    if (!leftTab?.decoded || !rightTab?.decoded) return []
    const leftData =
      section === 'header' ? leftTab.decoded.header : leftTab.decoded.payload
    const rightData =
      section === 'header' ? rightTab.decoded.header : rightTab.decoded.payload
    return diffObjects(leftData, rightData)
  }, [leftTab, rightTab, section])

  const filtered = useMemo(
    () => (showUnchanged ? diffs : diffs.filter((d) => d.type !== 'unchanged')),
    [diffs, showUnchanged],
  )

  const summary = useMemo(() => {
    const added   = diffs.filter((d) => d.type === 'added').length
    const removed = diffs.filter((d) => d.type === 'removed').length
    const changed = diffs.filter((d) => d.type === 'changed').length
    return { added, removed, changed }
  }, [diffs])

  const canDiff = leftTab?.decoded && rightTab?.decoded && leftId !== rightId

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-surface-700 flex items-center justify-between flex-wrap gap-2">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
          Token Diff
        </span>
        {canDiff && (
          <div className="flex items-center gap-2 text-xs">
            {summary.added > 0 && (
              <span className="text-success">+{summary.added}</span>
            )}
            {summary.removed > 0 && (
              <span className="text-danger">−{summary.removed}</span>
            )}
            {summary.changed > 0 && (
              <span className="text-warning">~{summary.changed}</span>
            )}
            {summary.added === 0 && summary.removed === 0 && summary.changed === 0 && (
              <span className="text-success">Identical</span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Tab selectors */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-xs">Left (A)</label>
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="bg-surface-700 border border-surface-600 text-text-primary text-xs rounded px-2 py-1.5
                         focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              <option value="">— select tab —</option>
              {decodedTabs.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-xs">Right (B)</label>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="bg-surface-700 border border-surface-600 text-text-primary text-xs rounded px-2 py-1.5
                         focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              <option value="">— select tab —</option>
              {decodedTabs.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Section toggle */}
        <div className="flex items-center gap-2">
          {(['payload', 'header'] as DiffSection[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                section === s
                  ? 'bg-accent text-surface-900 font-medium'
                  : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
              }`}
            >
              {s}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.target.checked)}
              className="accent-accent"
            />
            Show unchanged
          </label>
        </div>

        {/* Diff output */}
        {!canDiff ? (
          <p className="text-text-muted text-xs">
            {decodedTabs.length < 2
              ? 'Decode at least 2 tokens in separate tabs to compare.'
              : leftId === rightId
                ? 'Select two different tabs to compare.'
                : 'Select tabs above to diff.'}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-success text-xs">No differences found in {section}.</p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((entry) => (
              <DiffRow key={entry.path} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
