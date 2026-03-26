import { useState, useMemo, useCallback } from 'react'
import { ClaimRow } from './ClaimRow'
import { TreeView } from './TreeView'
import { isExpired } from '../lib/jwtDecode'
import type { DecodedToken, VerifyResult } from '../types/jwt'

interface Props {
  decoded: DecodedToken
  verifyResult?: VerifyResult | null
}

// ─── Header card (flat view only, it's small) ──────────────────────────────

interface HeaderCardProps {
  data: Record<string, unknown>
}

function HeaderCard({ data }: HeaderCardProps) {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-surface-700">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Header</span>
      </div>
      <div className="p-4 text-sm font-mono flex flex-col gap-1.5">
        {Object.entries(data).map(([k, v]) => (
          <ClaimRow key={k} claimKey={k} value={v} context="header" />
        ))}
      </div>
    </div>
  )
}

// ─── Payload card — flat / tree / edit toggle ──────────────────────────────

interface PayloadCardProps {
  data: Record<string, unknown>
  highlight: 'success' | 'danger' | null
  verifyResult?: VerifyResult | null
}

function PayloadCard({ data, highlight, verifyResult }: PayloadCardProps) {
  const [viewMode, setViewMode] = useState<'flat' | 'tree'>('flat')
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null)

  const displayData = editData ?? data

  const borderColor =
    highlight === 'success'
      ? 'border-success/40'
      : highlight === 'danger'
        ? 'border-danger/40'
        : 'border-surface-700'

  const startEdit = useCallback(() => {
    setDraft(JSON.stringify(data, null, 2))
    setEditError(null)
    setEditData(null)
    setEditMode(true)
  }, [data])

  const handleDraftChange = useCallback((val: string) => {
    setDraft(val)
    try {
      const parsed = JSON.parse(val) as Record<string, unknown>
      setEditData(parsed)
      setEditError(null)
    } catch (e) {
      setEditData(null)
      setEditError((e as Error).message)
    }
  }, [])

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(draft)
      setDraft(JSON.stringify(parsed, null, 2))
      setEditError(null)
    } catch {
      // keep error visible
    }
  }, [draft])

  const handleReset = useCallback(() => {
    setDraft(JSON.stringify(data, null, 2))
    setEditData(null)
    setEditError(null)
  }, [data])

  const handleExitEdit = useCallback(() => {
    setEditMode(false)
    setEditError(null)
  }, [])

  const badge = useMemo(() => {
    if (verifyResult) {
      return (
        <span className={`text-xs font-medium ${verifyResult.valid ? 'text-success' : 'text-danger'}`}>
          {verifyResult.valid ? '✓ Sig valid' : '✕ Sig invalid'}
        </span>
      )
    }
    if (highlight === 'success') return <span className="text-success text-xs">✓ Not expired</span>
    if (highlight === 'danger') return <span className="text-danger text-xs">✗ Expired</span>
    return null
  }, [highlight, verifyResult])

  return (
    <div className={`bg-surface-800 border ${borderColor} rounded-lg overflow-hidden`}>
      <div className="px-4 py-2 border-b border-surface-700 flex items-center gap-2 flex-wrap">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Payload</span>

        {!editMode && (
          <div className="flex items-center gap-1 ml-1">
            {(['flat', 'tree'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2 py-0.5 text-xs rounded transition-colors capitalize ${
                  viewMode === m
                    ? 'bg-accent text-surface-900 font-medium'
                    : 'bg-surface-700 text-text-muted hover:bg-surface-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {badge}
          {!editMode ? (
            <button
              onClick={startEdit}
              className="text-text-muted hover:text-accent text-xs transition-colors"
              title="Edit payload"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleFormat} className="text-accent hover:underline text-xs">Format</button>
              <button onClick={handleReset} className="text-text-muted hover:text-warning text-xs">Reset</button>
              <button onClick={handleExitEdit} className="text-text-muted hover:text-danger text-xs">✕</button>
            </div>
          )}
        </div>
      </div>

      {editMode ? (
        <div className="p-3 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            className={`w-full bg-surface-900 border rounded p-2 text-xs font-mono text-text-primary focus:outline-none focus:ring-1 resize-none ${
              editError ? 'border-danger/50 focus:ring-danger/30' : 'border-surface-600 focus:ring-accent/50'
            }`}
            rows={12}
            spellCheck={false}
          />
          {editError && (
            <p className="text-danger text-xs">{editError}</p>
          )}
          {!editError && editData && (
            <p className="text-success text-xs">✓ Valid JSON</p>
          )}
        </div>
      ) : viewMode === 'tree' ? (
        <div className="border-0">
          <TreeView data={displayData} context="payload" title="" />
        </div>
      ) : (
        <div className="p-4 text-sm font-mono flex flex-col gap-1.5">
          {Object.entries(displayData).map(([k, v]) => (
            <ClaimRow key={k} claimKey={k} value={v} context="payload" />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Signature card ─────────────────────────────────────────────────────────

interface SigCardProps {
  signature: string
  verifyResult?: VerifyResult | null
}

function SignatureCard({ signature, verifyResult }: SigCardProps) {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-surface-700 flex items-center justify-between">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Signature</span>
        {verifyResult && (
          <span className={`text-xs font-medium ${verifyResult.valid ? 'text-success' : 'text-danger'}`}>
            {verifyResult.valid ? '✓ Valid' : '✕ Invalid'}
          </span>
        )}
      </div>
      <div className="p-4 font-mono text-sm text-warning break-all">{signature}</div>
    </div>
  )
}

// ─── Public component ──────────────────────────────────────────────────────

export function DecodedView({ decoded, verifyResult }: Props) {
  const expired = useMemo(() => isExpired(decoded.payload), [decoded.payload])

  return (
    <div className="flex flex-col gap-4">
      <HeaderCard data={decoded.header} />
      <PayloadCard
        data={decoded.payload}
        highlight={expired === null ? null : expired ? 'danger' : 'success'}
        verifyResult={verifyResult}
      />
      <SignatureCard signature={decoded.signature} verifyResult={verifyResult} />
    </div>
  )
}
