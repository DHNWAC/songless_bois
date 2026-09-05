// Light obfuscation for the puzzle queue, not encryption. The goal is only to
// stop a curious player from reading tomorrow's answer at a glance in
// devtools; anyone determined can trivially reverse this, which is fine for a
// daily game with no stakes.

import type { Puzzle } from './types'

const KEY = 'draw-the-curve-v1'

function xorCipher(input: string): string {
  let out = ''
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length))
  }
  return out
}

/** UTF-8 safe base64 in both directions, so prompts can contain any character. */
function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin)
}

function fromBase64(b64: string): string {
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodePuzzles(puzzles: Puzzle[]): string {
  return toBase64(xorCipher(JSON.stringify(puzzles)))
}

export function decodePuzzles(encoded: string): Puzzle[] {
  return JSON.parse(xorCipher(fromBase64(encoded)))
}
