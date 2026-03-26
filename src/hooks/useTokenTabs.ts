import { useState, useCallback } from 'react'
import { decodeJWT } from '../lib/jwtDecode'
import type { TokenTab, VerifyResult } from '../types/jwt'

const MAX_TABS = 10

function createTab(name: string): TokenTab {
  return {
    id: crypto.randomUUID(),
    name,
    token: '',
    decoded: null,
    error: null,
    verifyResult: null,
  }
}

function initialState(): { tabs: TokenTab[]; activeId: string } {
  const first = createTab('Token 1')
  return { tabs: [first], activeId: first.id }
}

export function useTokenTabs() {
  const [state, setState] = useState(initialState)
  const { tabs, activeId } = state

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0]

  const updateTab = useCallback((id: string, patch: Partial<TokenTab>) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const setToken = useCallback(
    (token: string) => {
      const result = token.trim() ? decodeJWT(token) : { decoded: null, error: null }
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.id === prev.activeId
            ? { ...t, token, decoded: result.decoded, error: result.error, verifyResult: null }
            : t,
        ),
      }))
    },
    [],
  )

  const setVerifyResult = useCallback((result: VerifyResult | null) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) =>
        t.id === prev.activeId ? { ...t, verifyResult: result } : t,
      ),
    }))
  }, [])

  const addTab = useCallback(() => {
    setState((prev) => {
      if (prev.tabs.length >= MAX_TABS) return prev
      const tab = createTab(`Token ${prev.tabs.length + 1}`)
      return { tabs: [...prev.tabs, tab], activeId: tab.id }
    })
  }, [])

  const removeTab = useCallback((id: string) => {
    setState((prev) => {
      if (prev.tabs.length === 1) return prev
      const next = prev.tabs.filter((t) => t.id !== id)
      let nextActiveId = prev.activeId
      if (id === prev.activeId) {
        const removedIdx = prev.tabs.findIndex((t) => t.id === id)
        nextActiveId = next[Math.min(removedIdx, next.length - 1)].id
      }
      return { tabs: next, activeId: nextActiveId }
    })
  }, [])

  const renameTab = useCallback(
    (id: string, name: string) => updateTab(id, { name }),
    [updateTab],
  )

  const switchTab = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeId: id }))
  }, [])

  const duplicateTab = useCallback((id: string) => {
    setState((prev) => {
      if (prev.tabs.length >= MAX_TABS) return prev
      const src = prev.tabs.find((t) => t.id === id)
      if (!src) return prev
      const copy: TokenTab = { ...src, id: crypto.randomUUID(), name: `${src.name} (copy)` }
      const idx = prev.tabs.findIndex((t) => t.id === id)
      const next = [...prev.tabs]
      next.splice(idx + 1, 0, copy)
      return { tabs: next, activeId: copy.id }
    })
  }, [])

  return {
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
  }
}
