import { useCallback, useMemo, useEffect, useRef } from 'react'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { TokenInput } from './components/TokenInput'
import { DecodedView } from './components/DecodedView'
import { SecurityAudit } from './components/SecurityAudit'
import { SignatureVerify } from './components/SignatureVerify'
import { DiffView } from './components/DiffView'
import { HistoryPanel } from './components/HistoryPanel'
import { CodeSnippet } from './components/CodeSnippet'
import { auditToken } from './lib/securityRules'
import { useShieldMode } from './hooks/useShieldMode'
import { useTokenTabs } from './hooks/useTokenTabs'
import { useHistory } from './hooks/useHistory'
import type { HistoryEntry } from './types/jwt'

export default function App() {
  const { shieldMode, toggle: toggleShield } = useShieldMode()
  const {
    tabs,
    activeTab,
    activeId,
    setToken,
    setVerifyResult,
    addTab,
    removeTab,
    renameTab,
    switchTab,
    duplicateTab,
  } = useTokenTabs()

  const {
    entries: historyEntries,
    password: historyPassword,
    setPassword: setHistoryPassword,
    addEntry: addHistoryEntry,
    removeEntry: removeHistoryEntry,
    clearAll: clearHistory,
    loadEntry: loadHistoryEntry,
  } = useHistory()

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { decoded, error } = activeTab

  const auditResults = useMemo(
    () => (decoded ? auditToken(decoded, {}) : []),
    [decoded],
  )

  // When a token is successfully decoded, add to history
  const handleTokenChange = useCallback(
    (value: string) => {
      setToken(value)
      if (value.trim() && value.trim().split('.').length === 3) {
        addHistoryEntry(value.trim()).catch(() => {/* silent */})
      }
    },
    [setToken, addHistoryEntry],
  )

  // Load a history entry into the active tab
  const handleHistoryLoad = useCallback(
    async (entry: HistoryEntry) => {
      const token = await loadHistoryEntry(entry)
      setToken(token)
    },
    [loadHistoryEntry, setToken],
  )

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      // Ctrl/Cmd+V when NOT in an input/textarea → focus token input
      if (meta && e.key === 'v') {
        const active = document.activeElement
        const isInInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement
        if (!isInInput) {
          e.preventDefault()
          const ta = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="JWT"]')
          ta?.focus()
        }
      }

      // Ctrl/Cmd+1..9 → switch to tab N
      if (meta && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1
        if (idx < tabs.length) {
          e.preventDefault()
          switchTab(tabs[idx].id)
        }
      }

      // Ctrl/Cmd+T → new tab
      if (meta && e.key === 't') {
        e.preventDefault()
        addTab()
      }

      // Ctrl/Cmd+W → close active tab
      if (meta && e.key === 'w') {
        e.preventDefault()
        if (tabs.length > 1) removeTab(activeId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tabs, activeId, switchTab, addTab, removeTab])

  void textareaRef // suppress lint

  return (
    <div className="min-h-screen flex flex-col">
      <Header shieldMode={shieldMode} onShieldToggle={toggleShield} />

      {/* Tab bar */}
      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSwitch={switchTab}
        onAdd={addTab}
        onRemove={removeTab}
        onRename={renameTab}
        onDuplicate={duplicateTab}
        maxTabs={10}
      />

      <main className="flex-1 max-w-[90rem] mx-auto w-full px-4 py-6">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">

          {/* Column 1 — Token Input + History */}
          <div className="flex flex-col gap-4">
            <TokenInput value={activeTab.token} onChange={handleTokenChange} />

            {error && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            {!activeTab.token && (
              <p className="text-text-muted text-xs text-center pt-2">
                Decoded in-browser — no data is sent to any server
              </p>
            )}

            <HistoryPanel
              entries={historyEntries}
              password={historyPassword}
              onSetPassword={setHistoryPassword}
              onLoad={handleHistoryLoad}
              onRemove={removeHistoryEntry}
              onClearAll={clearHistory}
            />
          </div>

          {/* Column 2 — Decoded View (flat/tree/edit) */}
          <div className="flex flex-col gap-4">
            {decoded ? (
              <DecodedView decoded={decoded} verifyResult={activeTab.verifyResult} />
            ) : (
              <div className="bg-surface-800 border border-surface-700 rounded-lg p-6 flex items-center justify-center text-text-muted text-sm">
                Paste a JWT to inspect it
              </div>
            )}
          </div>

          {/* Column 3 — Verify + Audit + Code Snippet + Diff */}
          <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-1">
            {decoded ? (
              <>
                <SignatureVerify
                  decoded={decoded}
                  shieldMode={shieldMode}
                  onResult={setVerifyResult}
                />
                <SecurityAudit results={auditResults} />
                <CodeSnippet decoded={decoded} />
              </>
            ) : (
              <div className="bg-surface-800 border border-surface-700 rounded-lg p-6 flex items-center justify-center text-text-muted text-sm">
                Security audit will appear here
              </div>
            )}

            <DiffView tabs={tabs} />
          </div>
        </div>
      </main>
    </div>
  )
}
