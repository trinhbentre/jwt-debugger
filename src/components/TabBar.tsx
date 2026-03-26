import { useState, useRef, useCallback } from 'react'
import type { TokenTab } from '../types/jwt'

interface Props {
  tabs: TokenTab[]
  activeId: string
  onSwitch: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  maxTabs?: number
}

interface TabItemProps {
  tab: TokenTab
  isActive: boolean
  onSwitch: (id: string) => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  showClose: boolean
}

function TabItem({ tab, isActive, onSwitch, onRemove, onRename, onDuplicate, showClose }: TabItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tab.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback(() => {
    setDraft(tab.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 10)
  }, [tab.name])

  const commitEdit = useCallback(() => {
    const trimmed = draft.trim()
    if (trimmed) onRename(tab.id, trimmed)
    setEditing(false)
  }, [draft, onRename, tab.id])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitEdit()
      if (e.key === 'Escape') setEditing(false)
    },
    [commitEdit],
  )

  const statusDot =
    tab.decoded && !tab.error
      ? 'bg-success'
      : tab.error
        ? 'bg-danger'
        : 'bg-text-muted'

  return (
    <div
      className={`group relative flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer select-none shrink-0 transition-colors ${
        isActive
          ? 'border-accent bg-surface-800 text-text-primary'
          : 'border-transparent bg-surface-900 text-text-secondary hover:bg-surface-800/60 hover:text-text-primary'
      }`}
      onClick={() => onSwitch(tab.id)}
      onDoubleClick={startEdit}
      title="Double-click to rename"
    >
      {/* Status dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />

      {editing ? (
        <input
          ref={inputRef}
          className="bg-surface-700 text-text-primary text-xs px-1 py-0.5 rounded w-24 focus:outline-none focus:ring-1 focus:ring-accent/50"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-xs max-w-[8rem] truncate">{tab.name}</span>
      )}

      {/* Context menu actions */}
      {!editing && (
        <div className="flex items-center gap-0.5 ml-1">
          {/* Duplicate button - on hover */}
          <button
            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent text-xs px-0.5 transition-all"
            title="Duplicate tab"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(tab.id)
            }}
          >
            ⧉
          </button>

          {/* Close button */}
          {showClose && (
            <button
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger text-xs px-0.5 transition-all"
              title="Close tab"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(tab.id)
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TabBar({
  tabs,
  activeId,
  onSwitch,
  onAdd,
  onRemove,
  onRename,
  onDuplicate,
  maxTabs = 10,
}: Props) {
  return (
    <div className="flex items-stretch border-b border-surface-700 bg-surface-900 overflow-x-auto">
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeId}
          onSwitch={onSwitch}
          onRemove={onRemove}
          onRename={onRename}
          onDuplicate={onDuplicate}
          showClose={tabs.length > 1}
        />
      ))}

      {/* Add tab button */}
      {tabs.length < maxTabs && (
        <button
          onClick={onAdd}
          className="px-3 py-2 text-text-muted hover:text-accent hover:bg-surface-800/60 text-sm transition-colors shrink-0"
          title="New tab"
        >
          +
        </button>
      )}
    </div>
  )
}
