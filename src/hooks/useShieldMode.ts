import { useState, useCallback } from 'react'

/**
 * useShieldMode — simple boolean toggle.
 * When shieldMode is true, any component that makes network calls
 * (e.g., JWKS fetch) must check this flag and refuse to proceed.
 */
export function useShieldMode() {
  const [shieldMode, setShieldMode] = useState(false)
  const toggle = useCallback(() => setShieldMode((v) => !v), [])
  return { shieldMode, toggle }
}
