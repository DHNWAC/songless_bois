// Shareable result text for Draw the Curve — a sparkline pair in block
// characters shows the *shape* of both lines without naming the subject or
// values, so posting it cannot spoil the round for someone who hasn't played.

import type { Point, Puzzle, ScoreBreakdown } from './types'
import { sampleAt } from './scoring'

const BLOCKS = '▁▂▃▄▅▆▇█'

function spark(values: number[], min: number, max: number, width = 12): string {
  const range = max - min || 1
  const out: string[] = []
  for (let i = 0; i < width; i++) {
    const t = i / (width - 1)
    const idx = t * (values.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.min(values.length - 1, lo + 1)
    const v = values[lo] + (values[hi] - values[lo]) * (idx - lo)
    out.push(BLOCKS[Math.max(0, Math.min(7, Math.round(((v - min) / range) * 7)))])
  }
  return out.join('')
}

export function buildShareText(puzzle: Puzzle, drawn: Point[], s: ScoreBreakdown, dayNumber: number): string {
  const realValues = puzzle.series.map((p) => p.y)
  const guessValues = puzzle.series.map((p) => sampleAt(drawn, p.x))
  const finiteGuesses = guessValues.filter(Number.isFinite)
  const lo = Math.min(...realValues, ...finiteGuesses)
  const hi = Math.max(...realValues, ...finiteGuesses)

  const bar = (n: number) => {
    const filled = Math.round((n / 100) * 10)
    return '█'.repeat(filled) + '░'.repeat(10 - filled)
  }

  return [
    `Draw the Curve #${dayNumber} — ${s.total}/100`,
    ``,
    `You  ${spark(guessValues, lo, hi)}`,
    `Real ${spark(realValues, lo, hi)}`,
    ``,
    `shape ${bar(s.shape)} ${s.shape}`,
    `level ${bar(s.magnitude)} ${s.magnitude}`,
  ].join('\n')
}

/**
 * Copy from a *visible, on-page* textarea using execCommand, which needs no
 * permission prompt and works purely off DOM selection. Tried first because
 * it is the most reliable path from a click handler: the async Clipboard API
 * below can lose the click's "user activation" the moment anything is
 * awaited before it runs, which silently turns writeText() into a no-op or a
 * rejected promise in Safari and some locked-down Chrome policies.
 */
function copyViaExecCommand(source: HTMLTextAreaElement): boolean {
  try {
    const hadFocus = document.activeElement
    source.focus()
    source.select()
    source.setSelectionRange(0, source.value.length)
    const ok = document.execCommand('copy')
    if (!ok && hadFocus instanceof HTMLElement) hadFocus.focus()
    return ok
  } catch {
    return false
  }
}

function copyViaHiddenTextarea(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.width = '1px'
    ta.style.height = '1px'
    ta.style.padding = '0'
    ta.style.border = 'none'
    ta.style.opacity = '0.01'
    document.body.appendChild(ta)
    const ok = copyViaExecCommand(ta)
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/**
 * Copy text to the clipboard. Tries execCommand from the given visible
 * textarea first (synchronous, no permission prompt, survives strict user-
 * activation rules), then the modern async Clipboard API, then a detached
 * textarea as a last resort. Returns true only if a copy mechanism actually
 * reported success.
 */
export async function copyShare(text: string, source?: HTMLTextAreaElement): Promise<boolean> {
  if (source && copyViaExecCommand(source)) return true

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to the hidden-textarea fallback below.
    }
  }

  return copyViaHiddenTextarea(text)
}
