/**
 * AES-256-GCM encryption/decryption for API payloads.
 * Runs in browser via Web Crypto API and in Node.js via the same interface.
 * Inspired by secure-messenger-desktop crypto patterns.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const TAG_LENGTH = 128

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv as BufferSource, tagLength: TAG_LENGTH },
    key,
    enc.encode(plaintext) as BufferSource
  )

  // Pack: salt (16) + iv (12) + ciphertext+tag
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  packed.set(salt, 0)
  packed.set(iv, salt.length)
  packed.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return btoa(String.fromCharCode(...packed))
}

export async function decrypt(encoded: string, password: string): Promise<string> {
  const packed = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))

  const salt = packed.slice(0, 16)
  const iv = packed.slice(16, 16 + IV_LENGTH)
  const ciphertext = packed.slice(16 + IV_LENGTH)

  const key = await deriveKey(password, salt)

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv as BufferSource, tagLength: TAG_LENGTH },
    key,
    ciphertext as BufferSource
  )

  return new TextDecoder().decode(plainBuffer)
}
