// Puzzle data. 20 hand-authored hard boards.
//
// optimalRockCount for every puzzle is computed/verified by the public CLI
// solver:  npm run solve -- all wide  (see src/lib/contain/solver.ts).

import type { Puzzle } from './types'

const P = (row: number, col: number) => ({ row, col })

export const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: 'The First Trap',
    size: 8,
    sharkStart: P(3, 3),
    fish: [P(6, 6), P(1, 6)],
    rocks: [P(2, 2), P(2, 4), P(3, 1), P(4, 2), P(4, 4), P(5, 3)],
    optimalRockCount: 2,
    difficulty: 'hard',
  },
  {
    id: 2,
    title: 'Two Doors',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(1, 1), P(6, 1)],
    rocks: [P(2, 4), P(3, 3), P(3, 5), P(4, 2), P(5, 3), P(6, 4)],
    optimalRockCount: 2,
    difficulty: 'hard',
  },
  {
    id: 3,
    title: 'The Cove',
    size: 8,
    sharkStart: P(3, 4),
    fish: [P(6, 1), P(1, 1)],
    rocks: [P(2, 3), P(2, 5), P(3, 2), P(4, 2), P(5, 3), P(5, 4), P(5, 5), P(3, 6)],
    optimalRockCount: 2,
    difficulty: 'hard',
  },
  {
    id: 4,
    title: 'Triple Leak',
    size: 8,
    sharkStart: P(4, 3),
    fish: [P(1, 6), P(6, 6)],
    rocks: [P(2, 3), P(3, 2), P(4, 1), P(5, 2), P(6, 3)],
    optimalRockCount: 3,
    difficulty: 'hard',
  },
  {
    id: 5,
    title: 'Corner Office',
    size: 8,
    sharkStart: P(2, 2),
    fish: [P(6, 5), P(5, 6)],
    rocks: [P(1, 1), P(1, 3), P(3, 1), P(3, 3), P(2, 4), P(4, 2)],
    optimalRockCount: 2,
    difficulty: 'hard',
  },
  {
    id: 6,
    title: 'The Lure',
    size: 8,
    sharkStart: P(3, 3),
    fish: [P(3, 6), P(6, 2)],
    rocks: [P(1, 3), P(2, 2), P(2, 4), P(3, 1), P(4, 2), P(5, 3), P(4, 5)],
    optimalRockCount: 2,
    difficulty: 'hard',
  },
  {
    id: 7,
    title: 'Open Water',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(1, 1), P(1, 6), P(6, 1)],
    rocks: [P(2, 3), P(2, 4), P(2, 5), P(3, 2), P(4, 2), P(5, 2), P(6, 3), P(6, 4)],
    optimalRockCount: 3,
    difficulty: 'hard',
  },
  {
    id: 8,
    title: 'Handyman',
    size: 8,
    sharkStart: P(3, 4),
    fish: [P(6, 6), P(6, 1)],
    rocks: [P(1, 4), P(2, 2), P(2, 6), P(4, 2), P(4, 6), P(5, 4)],
    optimalRockCount: 4,
    difficulty: 'hard',
  },
  {
    id: 9,
    title: 'The Channel',
    size: 8,
    sharkStart: P(4, 3),
    fish: [P(1, 6), P(6, 6)],
    rocks: [P(3, 1), P(3, 2), P(3, 3), P(3, 4), P(3, 5), P(5, 2), P(5, 3), P(5, 4), P(5, 5)],
    optimalRockCount: 2,
    difficulty: 'hard',
  },
  {
    id: 10,
    title: 'Deep End',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(1, 1), P(6, 6)],
    rocks: [P(2, 4), P(4, 2), P(6, 4), P(4, 6)],
    optimalRockCount: 4,
    difficulty: 'hard',
  },
  {
    // Central shark, three fish spread wide, diamond ring with one gap.
    id: 11,
    title: 'Crossfire',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(1, 1), P(1, 6), P(6, 1)],
    rocks: [P(3, 3), P(3, 5), P(5, 3), P(5, 5), P(2, 4)],
    optimalRockCount: 1,
    difficulty: 'hard',
  },
  {
    // Shark boxed off-center with an escape corridor to the near edge.
    id: 12,
    title: 'Near Miss',
    size: 8,
    sharkStart: P(1, 4),
    fish: [P(5, 1), P(6, 6)],
    rocks: [P(0, 3), P(0, 5), P(2, 3), P(2, 5), P(1, 2)],
    optimalRockCount: 3,
    difficulty: 'hard',
  },
  {
    // Diamond ring around the shark, four fish in the far corners.
    id: 13,
    title: 'Four Corners',
    size: 8,
    sharkStart: P(3, 4),
    fish: [P(0, 0), P(0, 7), P(7, 0), P(7, 7)],
    rocks: [P(2, 3), P(2, 5), P(4, 3), P(4, 5), P(3, 2)],
    optimalRockCount: 3,
    difficulty: 'hard',
  },
  {
    // Shark starts on the edge with a near-ring already built — escape pressure is immediate.
    id: 14,
    title: 'Edge Case',
    size: 8,
    sharkStart: P(1, 4),
    fish: [P(3, 3), P(5, 5)],
    rocks: [P(0, 3), P(0, 5), P(2, 3), P(2, 5)],
    optimalRockCount: 3,
    difficulty: 'hard',
  },
  {
    // Sparse maze of short walls that don't fully seal anything.
    id: 15,
    title: 'The Maze',
    size: 8,
    sharkStart: P(4, 3),
    fish: [P(1, 5), P(6, 2)],
    rocks: [P(2, 2), P(2, 5), P(4, 5), P(5, 3), P(6, 5), P(3, 0)],
    optimalRockCount: 3,
    difficulty: 'hard',
  },
  {
    // Two fish very close together, ring already three-quarters built.
    id: 16,
    title: 'Twin Reef',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(1, 2), P(1, 3)],
    rocks: [P(3, 3), P(3, 5), P(5, 3), P(5, 5), P(2, 4)],
    optimalRockCount: 2,
    difficulty: 'hard',
  },
  {
    // Nearly empty board — a true race from a corner-adjacent start.
    id: 17,
    title: 'Wide Open',
    size: 8,
    sharkStart: P(2, 5),
    fish: [P(5, 2), P(6, 6)],
    rocks: [P(1, 5), P(3, 6)],
    optimalRockCount: 4,
    difficulty: 'hard',
  },
  {
    // Fish guarded by a broken ring with several equally short gaps.
    id: 18,
    title: 'Broken Ring',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(1, 4), P(4, 1), P(7, 4)],
    rocks: [P(2, 3), P(2, 5), P(3, 2), P(5, 2), P(6, 3), P(6, 5), P(3, 6), P(5, 6)],
    optimalRockCount: 4,
    difficulty: 'hard',
  },
  {
    // Shark deep in a corner pocket, diamond ring with one gap.
    id: 19,
    title: 'The Funnel',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(2, 2), P(6, 6)],
    rocks: [P(3, 3), P(3, 5), P(5, 3), P(5, 5)],
    optimalRockCount: 1,
    difficulty: 'hard',
  },
  {
    // Maximum fish count, diamond ring with four gaps — the true finale.
    id: 20,
    title: 'Last Stand',
    size: 8,
    sharkStart: P(4, 4),
    fish: [P(1, 1), P(1, 6), P(6, 1), P(6, 6)],
    rocks: [P(3, 3), P(3, 5), P(5, 3), P(5, 5)],
    optimalRockCount: 4,
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
