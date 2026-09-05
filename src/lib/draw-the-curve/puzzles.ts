// Daily rotation for Draw the Curve — mirrors the epoch/day-number pattern
// used by the other daily games (src/lib/daily.ts), reset at midnight AEST
// rather than the player's local midnight so everyone gets the same puzzle.

import { decodePuzzles } from './codec'
import type { Puzzle } from './types'
import rawQueue from './queue.json'
import { getAESTDateString, msUntilAESTMidnight as sharedMsUntilAESTMidnight } from '../aest'

const EPOCH_DATE = '2026-09-05'

const QUEUE: Puzzle[] = decodePuzzles(rawQueue as unknown as string)

/** 1-based day number, matching the convention of the other daily games. */
export function getDayNumber(now: Date = new Date()): number {
  const today = getAESTDateString(now)
  const epoch = new Date(EPOCH_DATE + 'T00:00:00')
  const current = new Date(today + 'T00:00:00')
  const diffDays = Math.floor((current.getTime() - epoch.getTime()) / 86_400_000)
  return diffDays + 1
}

/** Wrap any integer into a valid queue slot (handles negatives and 1-based day numbers). */
function wrapIndex(i: number): number {
  const n = QUEUE.length
  return ((i % n) + n) % n
}

export function getDailyPuzzle(dayNumber: number): Puzzle {
  return QUEUE[wrapIndex(dayNumber - 1)]
}

/** Direct lookup by queue position (0-based), for the admin preview panel. */
export function getPuzzleAtIndex(index: number): Puzzle {
  return QUEUE[wrapIndex(index)]
}

/** Lightweight listing for an admin puzzle picker. */
export function listPuzzles(): { index: number; id: string; prompt: string }[] {
  return QUEUE.map((q, index) => ({ index, id: q.id, prompt: q.prompt }))
}

export function queueLength(): number {
  return QUEUE.length
}

/** ms until the next AEST midnight rollover, for the "next puzzle in" countdown. */
export function msUntilAESTMidnight(now: Date = new Date()): number {
  return sharedMsUntilAESTMidnight(now)
}
