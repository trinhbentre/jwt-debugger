export interface DecodedToken {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  rawParts: [string, string, string]
}

export interface AuditResult {
  level: 'critical' | 'warning' | 'info'
  code: string
  message: string
  claim?: string
}

export interface VerifyResult {
  valid: boolean
  algorithm: string
  error?: string
}

export interface TokenTab {
  id: string
  name: string
  token: string
  decoded: DecodedToken | null
  error: string | null
  verifyResult: VerifyResult | null
}

export interface HistoryEntry {
  id: string
  timestamp: number
  /** First 30 chars of the original token */
  preview: string
  /** Raw token (plaintext) or AES-GCM encrypted blob (base64) */
  data: string
  encrypted: boolean
}
