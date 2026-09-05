// Shareable result text for Draw the Curve. Deliberately built only from
// '█'/'░' (full/light block) rather than the eighths-height block set
// (▁▂▃▄▅▆▇) — several common monospace fonts (including this app's own
// Geist Mono webfont) don't carry those glyphs and silently substitute a
// broken/missing-glyph box, which made the richer sparkline look corrupted
// in the app's own share preview. '█'/'░' are near-universally supported.
// The bars never name the subject or show real values, so posting a result
// can't spoil the round for someone who hasn't played yet.

import type { Point, Puzzle, ScoreBreakdown } from './types'
import { sampleAt } from './scoring'

function bar(n: number, width = 10): string {
  const filled = Math.max(0, Math.min(width, Math.round((n / 100) * width)))
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

/** Per-segment direction match (up/down/flat vs. the real curve), rendered
 * as a row of squares — spoiler-safe (shows agreement, not values), and a
 * livelier readout of "where the shape went wrong" than a single number. */
function directionRow(real: number[], guess: number[], width = 12): string {
  const n = real.length
  const cells: string[] = []
  for (let i = 0; i < width; i++) {
    const t = i / (width - 1)
    const idx = Math.min(n - 2, Math.max(0, Math.round(t * (n - 2))))
    const realDir = Math.sign(real[idx + 1] - real[idx])
    const guessDir = Math.sign(guess[idx + 1] - guess[idx])
    if (realDir === guessDir) cells.push('🟩')
    else if (realDir === 0 || guessDir === 0) cells.push('🟨')
    else cells.push('🟥')
  }
  return cells.join('')
}

/** Mirrors the verdict tone breakpoints in scoring.ts's buildVerdict, so the
 * share card's emoji always agrees with the on-page verdict's opener. */
function tierEmoji(total: number): string {
  if (total >= 85) return '🎯'
  if (total >= 70) return '📈'
  if (total >= 50) return '🧭'
  if (total >= 30) return '📉'
  return '🌀'
}

export function buildShareText(puzzle: Puzzle, drawn: Point[], s: ScoreBreakdown, dayNumber: number): string {
  const realValues = puzzle.series.map((p) => p.y)
  const guessValues = puzzle.series.map((p) => sampleAt(drawn, p.x))

  return [
    `${tierEmoji(s.total)} Draw the Curve #${dayNumber} — ${s.total}/100`,
    `${puzzle.xStart}–${puzzle.xEnd}`,
    ``,
    directionRow(realValues, guessValues),
    ``,
    `shape  ${bar(s.shape)}  ${s.shape}`,
    `level  ${bar(s.magnitude)}  ${s.magnitude}`,
    ``,
    `jimsengdle.vercel.app/draw-the-curve`,
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
