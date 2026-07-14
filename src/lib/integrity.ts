// Tamper-evidence for localStorage and hashed unlock codes.
//
// ponytail: FNV-1a + salt is obfuscation, not cryptography — anyone who reads
// the minified bundle can re-derive the scheme and re-sign. It stops casual
// DevTools edits (hand-tweaked streaks/multipliers get rejected on load).
// Real integrity needs a server.

const SALT = 'jimseng-v1:'

function fnv1a(str: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** Store JSON with a signature so hand-edited values are rejected on load. */
export function setSigned(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  const data = JSON.stringify(value)
  localStorage.setItem(key, JSON.stringify({ data, sig: fnv1a(SALT + data) }))
}

/** Read signed JSON; null on missing, malformed, unsigned, or tampered data. */
export function getSigned<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, sig } = JSON.parse(raw) as { data?: string; sig?: string }
    if (typeof data !== 'string' || sig !== fnv1a(SALT + data)) return null
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

/** SHA-256 hex digest — used so unlock codes never appear in the bundle. */
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}
