import type { VerifyResult } from '../types/jwt'

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64UrlToArrayBuffer(b64url: string): ArrayBuffer {
  const padded = b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(b64url.length + (4 - (b64url.length % 4)) % 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer.slice(0) as ArrayBuffer
}

function strToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer.slice(0) as ArrayBuffer
}

// ─── PEM Parser ─────────────────────────────────────────────────────────────

/**
 * Strips PEM headers/footers and decodes base64 content to ArrayBuffer.
 * Supports PKCS#8 private keys and SPKI public keys.
 */
export function parsePem(pem: string): ArrayBuffer {
  const lines = pem.trim().split('\n')
  const base64 = lines
    .filter((l) => !l.startsWith('-----'))
    .join('')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer.slice(0) as ArrayBuffer
}

// ─── Algorithm mappings ──────────────────────────────────────────────────────

type HmacAlg = 'HS256' | 'HS384' | 'HS512'
type EcAlg = 'ES256' | 'ES384' | 'ES512'

const HMAC_HASH: Record<HmacAlg, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
}

const RSA_SHA: Record<string, string> = {
  RS256: 'SHA-256',
  RS384: 'SHA-384',
  RS512: 'SHA-512',
  PS256: 'SHA-256',
  PS384: 'SHA-384',
  PS512: 'SHA-512',
}

const EC_CURVE: Record<EcAlg, string> = {
  ES256: 'P-256',
  ES384: 'P-384',
  ES512: 'P-521',
}

const EC_HASH: Record<EcAlg, string> = {
  ES256: 'SHA-256',
  ES384: 'SHA-384',
  ES512: 'SHA-512',
}

// ─── HMAC Verify ─────────────────────────────────────────────────────────────

async function verifyHmac(
  signingInput: string,
  signaturePart: string,
  secret: string,
  alg: HmacAlg,
): Promise<boolean> {
  const hash = HMAC_HASH[alg]
  const keyMaterial = strToArrayBuffer(secret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash },
    false,
    ['verify'],
  )
  const signature = base64UrlToArrayBuffer(signaturePart)
  const data = strToArrayBuffer(signingInput)
  return crypto.subtle.verify('HMAC', cryptoKey, signature, data)
}

// ─── RSA Verify ──────────────────────────────────────────────────────────────

async function verifyRsa(
  signingInput: string,
  signaturePart: string,
  publicKeyPem: string,
  alg: string,
): Promise<boolean> {
  const keyData = parsePem(publicKeyPem)
  const isPs = alg.startsWith('PS')
  const algorithm = isPs
    ? { name: 'RSA-PSS', saltLength: parseInt(alg.slice(2)) / 8 }
    : { name: 'RSASSA-PKCS1-v1_5' }

  const importAlg = isPs
    ? { name: 'RSA-PSS', hash: RSA_SHA[alg] }
    : { name: 'RSASSA-PKCS1-v1_5', hash: RSA_SHA[alg] }

  const cryptoKey = await crypto.subtle.importKey('spki', keyData, importAlg, false, ['verify'])
  const signature = base64UrlToArrayBuffer(signaturePart)
  const data = strToArrayBuffer(signingInput)
  return crypto.subtle.verify(algorithm, cryptoKey, signature, data)
}

// ─── ECDSA Verify ─────────────────────────────────────────────────────────────

async function verifyEc(
  signingInput: string,
  signaturePart: string,
  publicKeyPem: string,
  alg: EcAlg,
): Promise<boolean> {
  const keyData = parsePem(publicKeyPem)
  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'ECDSA', namedCurve: EC_CURVE[alg] },
    false,
    ['verify'],
  )
  const signature = base64UrlToArrayBuffer(signaturePart)
  const data = strToArrayBuffer(signingInput)
  return crypto.subtle.verify({ name: 'ECDSA', hash: EC_HASH[alg] }, cryptoKey, signature, data)
}

// ─── JWK Verify ──────────────────────────────────────────────────────────────

async function verifyJwk(
  signingInput: string,
  signaturePart: string,
  jwkJson: string,
  alg: string,
): Promise<boolean> {
  const jwk: JsonWebKey = JSON.parse(jwkJson) as JsonWebKey

  if (alg in EC_CURVE) {
    const ecAlg = alg as EcAlg
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: EC_CURVE[ecAlg] },
      false,
      ['verify'],
    )
    const signature = base64UrlToArrayBuffer(signaturePart)
    const data = strToArrayBuffer(signingInput)
    return crypto.subtle.verify({ name: 'ECDSA', hash: EC_HASH[ecAlg] }, cryptoKey, signature, data)
  }

  if (alg in RSA_SHA) {
    const isPs = alg.startsWith('PS')
    const importAlg = isPs
      ? { name: 'RSA-PSS', hash: RSA_SHA[alg] }
      : { name: 'RSASSA-PKCS1-v1_5', hash: RSA_SHA[alg] }
    const algorithm = isPs
      ? { name: 'RSA-PSS', saltLength: parseInt(alg.slice(2)) / 8 }
      : { name: 'RSASSA-PKCS1-v1_5' }
    const cryptoKey = await crypto.subtle.importKey('jwk', jwk, importAlg, false, ['verify'])
    const signature = base64UrlToArrayBuffer(signaturePart)
    const data = strToArrayBuffer(signingInput)
    return crypto.subtle.verify(algorithm, cryptoKey, signature, data)
  }

  throw new Error(`JWK verify not supported for algorithm: ${alg}`)
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export type VerifyMethod = 'secret' | 'pem' | 'jwk'

export async function verifyJWT(
  rawParts: [string, string, string],
  headerAlg: string,
  method: VerifyMethod,
  keyInput: string,
): Promise<VerifyResult> {
  const alg = headerAlg.toUpperCase()
  const signingInput = `${rawParts[0]}.${rawParts[1]}`
  const signaturePart = rawParts[2]

  try {
    let valid = false

    if (method === 'secret') {
      if (!(alg in HMAC_HASH)) {
        return { valid: false, algorithm: alg, error: `Algorithm ${alg} does not use a secret — use PEM or JWK.` }
      }
      valid = await verifyHmac(signingInput, signaturePart, keyInput, alg as HmacAlg)
    } else if (method === 'pem') {
      if (alg in RSA_SHA) {
        valid = await verifyRsa(signingInput, signaturePart, keyInput, alg)
      } else if (alg in EC_CURVE) {
        valid = await verifyEc(signingInput, signaturePart, keyInput, alg as EcAlg)
      } else {
        return { valid: false, algorithm: alg, error: `Algorithm ${alg} is not supported for PEM keys.` }
      }
    } else if (method === 'jwk') {
      valid = await verifyJwk(signingInput, signaturePart, keyInput, alg)
    }

    return { valid, algorithm: alg }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { valid: false, algorithm: alg, error: msg }
  }
}
