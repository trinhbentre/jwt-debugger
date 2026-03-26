import { useState, useCallback } from 'react'
import { verifyJWT, type VerifyMethod } from '../lib/jwtVerify'
import { fetchJwks, jwksKeyToJson, type JwksKey } from '../lib/jwksService'
import type { DecodedToken, VerifyResult } from '../types/jwt'

interface Props {
  decoded: DecodedToken
  shieldMode: boolean
  onResult: (result: VerifyResult | null) => void
}

const METHOD_LABELS: Record<VerifyMethod | 'jwks', string> = {
  secret: 'HMAC Secret',
  pem: 'RSA / EC Public Key (PEM)',
  jwk: 'JWK (JSON)',
  jwks: 'JWKS URL (auto-fetch)',
}

const PLACEHOLDERS: Record<VerifyMethod | 'jwks', string> = {
  secret: 'Enter HMAC secret…',
  pem: '-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----',
  jwk: '{ "kty": "RSA", "n": "…", "e": "AQAB" }',
  jwks: 'https://example.auth0.com/.well-known/jwks.json',
}

export function SignatureVerify({ decoded, shieldMode, onResult }: Props) {
  const [method, setMethod] = useState<VerifyMethod | 'jwks'>('secret')
  const [keyInput, setKeyInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [localResult, setLocalResult] = useState<VerifyResult | null>(null)

  // JWKS chain state
  const [jwksKeys, setJwksKeys] = useState<JwksKey[] | null>(null)
  const [jwksFetching, setJwksFetching] = useState(false)
  const [jwksError, setJwksError] = useState<string | null>(null)
  const [selectedKid, setSelectedKid] = useState<string | null>(null)

  const alg = typeof decoded.header.alg === 'string' ? decoded.header.alg : ''
  const kid = typeof decoded.header.kid === 'string' ? decoded.header.kid : undefined

  // Has kid in header AND not HMAC → suggest JWKS flow
  const sugggestJwks =
    kid !== undefined && !alg.toUpperCase().startsWith('HS') && method !== 'jwks'

  const handleMethodChange = useCallback(
    (m: VerifyMethod | 'jwks') => {
      setMethod(m)
      setKeyInput('')
      setLocalResult(null)
      setJwksKeys(null)
      setJwksError(null)
      setSelectedKid(null)
      onResult(null)
    },
    [onResult],
  )

  // Fetch JWKS and populate key list
  const handleFetchJwks = useCallback(async () => {
    if (!keyInput.trim() || shieldMode) return
    setJwksFetching(true)
    setJwksKeys(null)
    setJwksError(null)
    setSelectedKid(null)
    try {
      const jwks = await fetchJwks(keyInput.trim())
      setJwksKeys(jwks.keys)
      // Auto-select by kid
      if (kid) {
        const match = jwks.keys.find((k) => k.kid === kid)
        if (match) setSelectedKid(match.kid ?? null)
      } else if (jwks.keys.length > 0) {
        setSelectedKid(jwks.keys[0].kid ?? null)
      }
    } catch (e) {
      setJwksError(e instanceof Error ? e.message : String(e))
    } finally {
      setJwksFetching(false)
    }
  }, [keyInput, shieldMode, kid])

  const handleVerify = useCallback(async () => {
    setLoading(true)
    setLocalResult(null)

    try {
      let result: VerifyResult

      if (method === 'jwks') {
        if (shieldMode) {
          result = { valid: false, algorithm: alg, error: 'Shield Mode is ON — network requests are blocked.' }
        } else if (jwksKeys && selectedKid !== null) {
          // Verify with selected key from key list
          const key = jwksKeys.find((k) => k.kid === selectedKid) ?? jwksKeys[0]
          result = await verifyJWT(decoded.rawParts, alg, 'jwk', jwksKeyToJson(key))
        } else if (jwksKeys && jwksKeys.length > 0) {
          result = await verifyJWT(decoded.rawParts, alg, 'jwk', jwksKeyToJson(jwksKeys[0]))
        } else {
          result = { valid: false, algorithm: alg, error: 'Fetch JWKS keys first.' }
        }
      } else if (!keyInput.trim()) {
        result = { valid: false, algorithm: alg, error: 'Please enter a key or secret.' }
      } else {
        result = await verifyJWT(decoded.rawParts, alg, method, keyInput)
      }

      setLocalResult(result)
      onResult(result)
    } finally {
      setLoading(false)
    }
  }, [method, keyInput, decoded, alg, jwksKeys, selectedKid, shieldMode, onResult])

  const handleClear = useCallback(() => {
    setKeyInput('')
    setLocalResult(null)
    setJwksKeys(null)
    setJwksError(null)
    setSelectedKid(null)
    onResult(null)
  }, [onResult])

  const isMultiline = method === 'pem' || method === 'jwk'
  const canVerify =
    method === 'jwks'
      ? (jwksKeys !== null && jwksKeys.length > 0 && !shieldMode)
      : keyInput.trim().length > 0

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-surface-700 flex items-center gap-2 flex-wrap">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
          Signature Verification
        </span>
        {alg && (
          <span className="text-xs bg-surface-700 text-accent px-1.5 py-0.5 rounded font-mono">
            {alg}
          </span>
        )}
        {kid && (
          <span className="text-xs bg-surface-700 text-warning px-1.5 py-0.5 rounded font-mono" title="Key ID in token header">
            kid: {kid}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* kid → suggest JWKS */}
        {sugggestJwks && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-accent/10 border border-accent/30 text-xs">
            <span className="text-accent shrink-0">💡</span>
            <span className="text-text-secondary flex-1">
              Token has <span className="font-mono text-accent">kid</span> — use{' '}
              <button
                className="text-accent underline hover:no-underline"
                onClick={() => handleMethodChange('jwks')}
              >
                JWKS URL
              </button>{' '}
              to auto-match key.
            </span>
          </div>
        )}

        {/* Method selector */}
        <div className="flex flex-col gap-1">
          <label className="text-text-muted text-xs">Verification method</label>
          <select
            value={method}
            onChange={(e) => handleMethodChange(e.target.value as VerifyMethod | 'jwks')}
            className="bg-surface-700 border border-surface-600 text-text-primary text-sm rounded px-2 py-1.5
                       focus:outline-none focus:ring-1 focus:ring-accent/50"
          >
            {(Object.keys(METHOD_LABELS) as Array<VerifyMethod | 'jwks'>).map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>

        {/* Key input or JWKS URL */}
        <div className="flex flex-col gap-1">
          <label className="text-text-muted text-xs">
            {method === 'jwks' ? 'JWKS endpoint URL' : 'Key / Secret'}
          </label>
          {method === 'jwks' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setJwksKeys(null); setJwksError(null) }}
                placeholder={PLACEHOLDERS.jwks}
                className="flex-1 bg-surface-700 border border-surface-600 text-text-primary text-sm font-mono rounded px-2 py-1.5
                           focus:outline-none focus:ring-1 focus:ring-accent/50"
                spellCheck={false}
              />
              <button
                onClick={handleFetchJwks}
                disabled={jwksFetching || !keyInput.trim() || shieldMode}
                className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {jwksFetching ? '…' : 'Fetch'}
              </button>
            </div>
          ) : isMultiline ? (
            <textarea
              rows={5}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={PLACEHOLDERS[method]}
              className="bg-surface-700 border border-surface-600 text-text-primary text-xs font-mono rounded px-2 py-1.5
                         focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
              spellCheck={false}
            />
          ) : (
            <input
              type={method === 'secret' ? 'password' : 'text'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={PLACEHOLDERS[method]}
              className="bg-surface-700 border border-surface-600 text-text-primary text-sm font-mono rounded px-2 py-1.5
                         focus:outline-none focus:ring-1 focus:ring-accent/50"
              spellCheck={false}
            />
          )}
        </div>

        {/* Shield Mode warning */}
        {method === 'jwks' && shieldMode && (
          <p className="text-warning text-xs bg-warning/10 border border-warning/30 rounded px-3 py-2">
            🛡 Shield Mode is ON — JWKS fetch is disabled.
          </p>
        )}

        {/* JWKS error */}
        {jwksError && (
          <p className="text-danger text-xs bg-danger/10 border border-danger/30 rounded px-3 py-2">
            {jwksError}
          </p>
        )}

        {/* JWKS key list */}
        {jwksKeys && jwksKeys.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-xs">
              {jwksKeys.length} key{jwksKeys.length > 1 ? 's' : ''} in JWKS
              {kid && ` — looking for kid: "${kid}"`}
            </label>
            <div className="bg-surface-900 border border-surface-700 rounded p-2 flex flex-col gap-1 max-h-40 overflow-y-auto">
              {jwksKeys.map((k, i) => {
                const keyId = k.kid ?? `key-${i}`
                const isMatch = kid ? k.kid === kid : i === 0
                const isSelected = selectedKid === keyId || (selectedKid === null && i === 0)
                return (
                  <button
                    key={keyId}
                    onClick={() => setSelectedKid(keyId)}
                    className={`text-left px-2 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-accent/20 border border-accent/40 text-accent'
                        : 'hover:bg-surface-700 text-text-secondary'
                    }`}
                  >
                    {isMatch && <span className="text-success shrink-0">✓</span>}
                    {!isMatch && <span className="w-4 shrink-0" />}
                    <span className="flex-1 truncate">
                      {k.kid ? `kid: ${k.kid}` : `key ${i}`}
                    </span>
                    <span className="text-text-muted">{k.kty}{k.alg ? ` · ${k.alg}` : ''}{k.crv ? ` · ${k.crv}` : ''}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={loading || !canVerify}
            className="btn btn-primary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          {(keyInput || localResult || jwksKeys) && (
            <button onClick={handleClear} className="btn btn-secondary text-sm px-3 py-1.5">
              Clear
            </button>
          )}
        </div>

        {/* Result */}
        {localResult && (
          <div
            className={`flex items-start gap-2 px-3 py-2 rounded border text-sm ${
              localResult.valid
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-danger/10 border-danger/30 text-danger'
            }`}
          >
            <span className="shrink-0 mt-0.5">{localResult.valid ? '✓' : '✕'}</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">
                {localResult.valid ? 'Signature valid' : 'Signature invalid'}
              </span>
              {localResult.error && (
                <span className="text-xs opacity-80">{localResult.error}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
