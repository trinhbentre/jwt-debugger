import { useState } from 'react'
import type { AuditResult } from '../types/jwt'

interface Props {
  results: AuditResult[]
}

const LEVEL_CONFIG = {
  critical: {
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    icon: '✕',
    label: 'Critical',
  },
  warning: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    icon: '⚠',
    label: 'Warning',
  },
  info: {
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    icon: 'ℹ',
    label: 'Info',
  },
}

export function SecurityAudit({ results }: Props) {
  const [open, setOpen] = useState(true)

  if (results.length === 0) {
    return (
      <div className="bg-surface-800 border border-success/30 rounded-lg px-4 py-3 flex items-center gap-2">
        <span className="text-success text-sm">✓</span>
        <span className="text-success text-sm">No security issues detected</span>
      </div>
    )
  }

  const hasCritical = results.some((r) => r.level === 'critical')

  return (
    <div
      className={`bg-surface-800 border ${hasCritical ? 'border-danger/40' : 'border-warning/40'} rounded-lg overflow-hidden`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2 border-b border-surface-700 flex items-center justify-between hover:bg-surface-700/50 transition-colors"
      >
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
          Security Audit
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${hasCritical ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}
          >
            {results.length} issue{results.length > 1 ? 's' : ''}
          </span>
        </span>
        <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-3 flex flex-col gap-2">
          {results.map((r) => {
            const cfg = LEVEL_CONFIG[r.level]
            return (
              <div
                key={r.code}
                className={`flex items-start gap-2 px-3 py-2 rounded border ${cfg.bg} ${cfg.border}`}
              >
                <span className={`${cfg.color} text-sm shrink-0 mt-0.5`}>{cfg.icon}</span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className={`${cfg.color} text-xs font-semibold`}>
                    {cfg.label}: {r.code}
                  </span>
                  <span className="text-text-secondary text-xs">{r.message}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
