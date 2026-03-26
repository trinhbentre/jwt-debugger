export interface JwksKey {
  kid?: string
  kty: string
  use?: string
  alg?: string
  n?: string
  e?: string
  x?: string
  y?: string
  crv?: string
  [key: string]: unknown
}

export interface Jwks {
  keys: JwksKey[]
}

/**
 * Fetch a JWKS endpoint and return the parsed key set.
 * NOTE: This is the only network call in the app; it is user-initiated.
 * Shield Mode must disable this call when active.
 */
export async function fetchJwks(url: string): Promise<Jwks> {
  let res: Response
  try {
    res = await fetch(url, { mode: 'cors' })
  } catch {
    throw new Error(`Network error fetching JWKS from ${url}. Check CORS policy.`)
  }
  if (!res.ok) {
    throw new Error(`JWKS fetch failed: HTTP ${res.status} ${res.statusText}`)
  }
  const json: unknown = await res.json()
  if (!json || typeof json !== 'object' || !Array.isArray((json as Jwks).keys)) {
    throw new Error('Invalid JWKS response: expected { keys: [...] }')
  }
  return json as Jwks
}

/**
 * Find a key in a JWKS by kid (key ID).
 * If kid is undefined, returns the first key.
 */
export function findKey(jwks: Jwks, kid?: string): JwksKey | null {
  if (!kid) return jwks.keys[0] ?? null
  return jwks.keys.find((k) => k.kid === kid) ?? null
}

/**
 * Convert a JwksKey to a JSON string suitable for jwtVerify's JWK method.
 */
export function jwksKeyToJson(key: JwksKey): string {
  return JSON.stringify(key)
}
