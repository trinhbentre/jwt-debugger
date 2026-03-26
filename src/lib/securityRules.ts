import type { AuditResult, DecodedToken } from '../types/jwt'

export interface AuditContext {
  /** HMAC secret provided by user for signature verification */
  secret?: string
  /** Whether signature was verified (true = valid) */
  verifyValid?: boolean
}

type RuleFn = (decoded: DecodedToken, ctx: AuditContext) => AuditResult | null

const rules: RuleFn[] = [
  // ALG_NONE: algorithm "none" means no signature — critical vulnerability
  (decoded, _ctx) => {
    if (decoded.header.alg === 'none') {
      return {
        level: 'critical',
        code: 'ALG_NONE',
        message: 'Algorithm is "none" — token has no signature and cannot be trusted.',
        claim: 'alg',
      }
    }
    return null
  },

  // TOKEN_EXPIRED: exp claim is in the past
  (decoded, _ctx) => {
    const exp = decoded.payload.exp
    if (typeof exp === 'number' && Date.now() / 1000 > exp) {
      return {
        level: 'critical',
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired (exp claim is in the past).',
        claim: 'exp',
      }
    }
    return null
  },

  // MISSING_SUB: no subject claim
  (decoded, _ctx) => {
    if (!('sub' in decoded.payload)) {
      return {
        level: 'warning',
        code: 'MISSING_SUB',
        message: 'Missing "sub" (subject) claim — identity of token owner is unspecified.',
        claim: 'sub',
      }
    }
    return null
  },

  // MISSING_ISS: no issuer claim
  (decoded, _ctx) => {
    if (!('iss' in decoded.payload)) {
      return {
        level: 'warning',
        code: 'MISSING_ISS',
        message: 'Missing "iss" (issuer) claim — cannot verify token origin.',
        claim: 'iss',
      }
    }
    return null
  },

  // LONG_LIFETIME: token lives more than 24h
  (decoded, _ctx) => {
    const exp = decoded.payload.exp
    const iat = decoded.payload.iat
    if (typeof exp === 'number' && typeof iat === 'number' && exp - iat > 86400) {
      const hours = Math.round((exp - iat) / 3600)
      return {
        level: 'warning',
        code: 'LONG_LIFETIME',
        message: `Token lifetime is ${hours}h — exceeds the recommended 24h maximum.`,
        claim: 'exp',
      }
    }
    return null
  },
]

// ─── Phase 2 rules ───────────────────────────────────────────────────────────

const phase2Rules: RuleFn[] = [
  // WEAK_SECRET: HMAC secret shorter than 32 chars
  (decoded, ctx) => {
    const alg = decoded.header.alg
    if (
      typeof alg === 'string' &&
      alg.startsWith('HS') &&
      ctx.secret !== undefined &&
      ctx.secret.length < 32
    ) {
      return {
        level: 'warning',
        code: 'WEAK_SECRET',
        message: `HMAC secret is ${ctx.secret.length} chars — minimum 32 chars recommended for ${alg}.`,
        claim: 'alg',
      }
    }
    return null
  },

  // DEPRECATED_ALG: RS256 when RS512 would be better
  (decoded, _ctx) => {
    if (decoded.header.alg === 'RS256') {
      return {
        level: 'info',
        code: 'DEPRECATED_ALG',
        message: 'RS256 is functional but RS512 offers stronger collision resistance.',
        claim: 'alg',
      }
    }
    return null
  },

  // KID_MISSING: RSA/EC token without kid in header
  (decoded, _ctx) => {
    const alg = decoded.header.alg
    if (
      typeof alg === 'string' &&
      (alg.startsWith('RS') || alg.startsWith('PS') || alg.startsWith('ES')) &&
      !('kid' in decoded.header)
    ) {
      return {
        level: 'info',
        code: 'KID_MISSING',
        message: 'No "kid" (key ID) in header — key rotation and JWKS lookup will not work correctly.',
        claim: 'kid',
      }
    }
    return null
  },
]

export function auditToken(decoded: DecodedToken, ctx: AuditContext = {}): AuditResult[] {
  const allRules = [...rules, ...phase2Rules]
  return allRules.map((rule) => rule(decoded, ctx)).filter((r): r is AuditResult => r !== null)
}
