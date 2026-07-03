// Puzzle data. Hand-authored boards.
//
// optimalTurns for every puzzle is computed/verified by the public CLI
// solver:  npm run solve:heist  (see src/lib/heist/solver.ts).

import type { Guard, Position, Puzzle } from './types'

const P = (row: number, col: number) => ({ row, col })

/** Clockwise perimeter loop of the rectangle (r1,c1)–(r2,c2). */
function rect(r1: number, c1: number, r2: number, c2: number): Position[] {
  const loop: Position[] = []
  for (let c = c1; c <= c2; c++) loop.push(P(r1, c))
  for (let r = r1 + 1; r <= r2; r++) loop.push(P(r, c2))
  for (let c = c2 - 1; c >= c1; c--) loop.push(P(r2, c))
  for (let r = r2 - 1; r > r1; r--) loop.push(P(r, c1))
  return loop
}

/** Back-and-forth loop along a straight line from a to b (inclusive). */
function pingpong(a: Position, b: Position): Position[] {
  const dr = Math.sign(b.row - a.row)
  const dc = Math.sign(b.col - a.col)
  const steps = Math.abs(b.row - a.row) + Math.abs(b.col - a.col)
  const out: Position[] = []
  for (let i = 0; i <= steps; i++) out.push(P(a.row + dr * i, a.col + dc * i))
  for (let i = steps - 1; i >= 1; i--) out.push(P(a.row + dr * i, a.col + dc * i))
  return out
}

/** Rotate a loop's phase so the guard starts k steps into it. */
function phase(loop: Position[], k: number): Position[] {
  const n = ((k % loop.length) + loop.length) % loop.length
  return [...loop.slice(n), ...loop.slice(0, n)]
}

const patrol = (loop: Position[]): Guard => ({ loop })
const sentry = (pos: Position, facing: Guard['facing']): Guard => ({ loop: [pos], facing })

export const PUZZLES: Puzzle[] = [
  {
    // One vertical sweeper between you and the vault. Learn the rhythm.
    id: 1,
    title: 'Training Night',
    size: 7,
    start: P(6, 0),
    vault: P(0, 6),
    walls: [P(3, 2), P(3, 3), P(3, 4)],
    guards: [patrol(pingpong(P(1, 5), P(5, 5)))],
    optimalTurns: 25,
    difficulty: 'easy',
  },
  {
    // A lighthouse guard circling the courtyard block, rays sweeping the board.
    id: 2,
    title: 'The Courtyard',
    size: 8,
    start: P(7, 0),
    vault: P(0, 7),
    walls: [P(3, 3), P(3, 4), P(4, 3), P(4, 4)],
    guards: [patrol(phase(rect(2, 2, 5, 5), 6))],
    optimalTurns: 29,
    difficulty: 'medium',
  },
  {
    // Two horizontal sweepers, opposite phases. Pure timing, no cover.
    id: 3,
    title: 'Crossfire',
    size: 8,
    start: P(7, 4),
    vault: P(0, 3),
    walls: [],
    guards: [
      patrol(pingpong(P(2, 1), P(2, 6))),
      patrol(pingpong(P(5, 6), P(5, 1))),
    ],
    optimalTurns: 22,
    difficulty: 'medium',
  },
  {
    // Fixed sentries carve permanent no-go lanes; a patroller sweeps the middle.
    id: 4,
    title: 'Sentry Hall',
    size: 8,
    start: P(7, 0),
    vault: P(1, 7),
    walls: [P(5, 2), P(2, 6), P(2, 7)],
    guards: [
      sentry(P(0, 2), 'down'),
      sentry(P(3, 5), 'right'),
      patrol(pingpong(P(6, 4), P(1, 4))),
    ],
    optimalTurns: 27,
    difficulty: 'medium',
  },
  {
    // Two counter-rotating loops flanking the center corridor.
    id: 5,
    title: 'Clockwork',
    size: 9,
    start: P(8, 4),
    vault: P(0, 4),
    walls: [P(3, 1), P(3, 2), P(4, 1), P(4, 2), P(3, 6), P(3, 7), P(4, 6), P(4, 7)],
    guards: [
      patrol(phase(rect(2, 0, 5, 3), 11)),
      patrol(phase([...rect(2, 5, 5, 8)].reverse(), 10)),
    ],
    optimalTurns: 22,
    difficulty: 'hard',
  },
  {
    // The loot sits in a walled ring with one southern gap, orbited by a guard.
    id: 6,
    title: 'The Vault Job',
    size: 9,
    start: P(8, 0),
    vault: P(4, 4),
    walls: [P(3, 3), P(3, 4), P(3, 5), P(4, 3), P(4, 5), P(5, 3), P(5, 5)],
    guards: [patrol(rect(2, 2, 6, 6)), sentry(P(0, 0), 'right')],
    optimalTurns: 18,
    difficulty: 'hard',
  },
]

/**
 * Deterministic daily pick: day N (AEST epoch from src/lib/daily.ts)
 * maps to puzzle (N-1) mod count.
 */
export function getDailyPuzzle(dayNumber: number): Puzzle {
  const idx = ((dayNumber - 1) % PUZZLES.length + PUZZLES.length) % PUZZLES.length
  return PUZZLES[idx]
}

export function getPuzzleById(id: number): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id)
}
