// AES-256-GCM + PBKDF2-SHA256 — pattern mirrored from crypto-tool/src/App.tsx
// Output format: base64(salt[16] + iv[12] + ciphertext)

const SALT_LEN = 16
const IV_LEN = 12
const PBKDF2_ITERATIONS = 100_000

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>
}

async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptText(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveKey(password, salt)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  const combined = new Uint8Array(SALT_LEN + IV_LEN + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, SALT_LEN)
  combined.set(new Uint8Array(ciphertext), SALT_LEN + IV_LEN)
  return toBase64(combined.buffer)
}

export async function decryptText(ciphertextB64: string, password: string): Promise<string> {
  const combined = fromBase64(ciphertextB64)
  if (combined.length <= SALT_LEN + IV_LEN) throw new Error('Invalid ciphertext')
  const salt = combined.slice(0, SALT_LEN)
  const iv = combined.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const ciphertext = combined.slice(SALT_LEN + IV_LEN)
  const key = await deriveKey(password, salt)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
