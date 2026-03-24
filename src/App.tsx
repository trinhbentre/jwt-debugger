import { useState } from 'react'
import { Header } from './components/Header'

interface JwtParts {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + (4 - (str.length % 4)) % 4, '='
  )
  return atob(padded)
}

function decodeJWT(token: string): { parts: JwtParts | null; error: string | null } {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return { parts: null, error: 'Invalid JWT: expected 3 parts separated by dots' }
  }
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return { parts: { header, payload, signature: parts[2] }, error: null }
  } catch (e) {
    return { parts: null, error: `Decode error: ${(e as Error).message}` }
  }
}

function isExpired(payload: Record<string, unknown>): boolean | null {
  if (typeof payload.exp !== 'number') return null
  return Date.now() / 1000 > payload.exp
}

function formatValue(val: unknown): string {
  if (typeof val === 'number' && String(val).length === 10) {
    const date = new Date(val * 1000)
    return `${val} (${date.toISOString()})`
  }
  return String(val)
}

function JsonCard({ title, data, highlight }: { title: string; data: Record<string, unknown>; highlight?: 'success' | 'danger' | null }) {
  const borderColor = highlight === 'success' ? 'border-success/40' : highlight === 'danger' ? 'border-danger/40' : 'border-surface-700'
  return (
    <div className={`bg-surface-800 border ${borderColor} rounded-lg overflow-hidden`}>
      <div className="px-4 py-2 border-b border-surface-700 flex items-center justify-between">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">{title}</span>
        {highlight === 'success' && <span className="text-success text-xs">✓ Not expired</span>}
        {highlight === 'danger' && <span className="text-danger text-xs">✗ Expired</span>}
      </div>
      <pre className="p-4 text-sm font-mono text-text-primary overflow-x-auto">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <span className="text-accent">"{k}"</span>
            <span className="text-text-muted">: </span>
            <span className="text-success">{JSON.stringify(v)}</span>
            {typeof v === 'number' && String(v).length === 10 && (
              <span className="text-text-muted text-xs ml-2">// {formatValue(v).split('(')[1]?.replace(')', '')}</span>
            )}
          </div>
        ))}
      </pre>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState('')

  const { parts, error } = token.trim() ? decodeJWT(token) : { parts: null, error: null }
  const expired = parts ? isExpired(parts.payload) : null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-text-muted text-xs uppercase tracking-wider">JWT Token</label>
          <textarea
            className="min-h-[100px] bg-surface-800 border border-surface-700 rounded-lg p-3
                       font-mono text-sm text-text-primary placeholder-text-muted
                       focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent
                       resize-none"
            placeholder="Paste your JWT token here…"
            value={token}
            onChange={e => setToken(e.target.value)}
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {parts && (
          <div className="flex flex-col gap-4">
            <JsonCard title="Header" data={parts.header} />
            <JsonCard
              title="Payload"
              data={parts.payload}
              highlight={expired === null ? null : expired ? 'danger' : 'success'}
            />
            <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-surface-700">
                <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Signature</span>
              </div>
              <div className="p-4 font-mono text-sm text-warning break-all">{parts.signature}</div>
            </div>
          </div>
        )}

        {!token && (
          <p className="text-text-muted text-xs text-center">
            Decoded in-browser — no data is sent to any server
          </p>
        )}
      </main>
    </div>
  )
}
