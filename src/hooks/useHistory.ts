import { useState, useCallback } from 'react'
import { encryptText, decryptText } from '../lib/cryptoStorage'
import type { HistoryEntry } from '../types/jwt'

const STORAGE_KEY = 'jwt-pro-history'
const MAX_ENTRIES = 50

function loadFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveToStorage(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadFromStorage)
  const [password, setPassword] = useState('')

  const addEntry = useCallback(
    async (token: string) => {
      const preview = token.slice(0, 30) + (token.length > 30 ? '…' : '')
      let data: string
      let encrypted: boolean

      if (password) {
        data = await encryptText(token, password)
        encrypted = true
      } else {
        data = token
        encrypted = false
      }

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        preview,
        data,
        encrypted,
      }

      setEntries((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES)
        saveToStorage(next)
        return next
      })
    },
    [password],
  )

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveToStorage(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setEntries([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  /**
   * Returns the raw token from an entry.
   * If the entry is encrypted, decrypts it with the stored password.
   * Throws if password is wrong.
   */
  const loadEntry = useCallback(
    async (entry: HistoryEntry): Promise<string> => {
      if (!entry.encrypted) return entry.data
      if (!password) throw new Error('Password required to decrypt history entry.')
      return decryptText(entry.data, password)
    },
    [password],
  )

  return {
    entries,
    password,
    setPassword,
    addEntry,
    removeEntry,
    clearAll,
    loadEntry,
  }
}
