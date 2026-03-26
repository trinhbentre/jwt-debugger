import type { DecodedToken } from '../types/jwt'

export function base64UrlDecode(str: string): string {
  const padded = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(str.length + (4 - (str.length % 4)) % 4, '=')
  return atob(padded)
}

export function decodeJWT(token: string): { decoded: DecodedToken | null; error: string | null } {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return { decoded: null, error: 'Invalid JWT: expected 3 parts separated by dots' }
  }
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return {
      decoded: {
        header,
        payload,
        signature: parts[2],
        rawParts: [parts[0], parts[1], parts[2]],
      },
      error: null,
    }
  } catch (e) {
    return { decoded: null, error: `Decode error: ${(e as Error).message}` }
  }
}

export function isExpired(payload: Record<string, unknown>): boolean | null {
  if (typeof payload.exp !== 'number') return null
  return Date.now() / 1000 > payload.exp
}
