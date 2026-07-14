// Start words. Every entry is verified reachable from OMER by the CLI
// solver, which also computes optimalSteps:  npm run solve:omerdle

import type { Puzzle } from './types'

export const PUZZLES: Puzzle[] = [
  { id: 1, startWord: 'beer', optimalSteps: 4, difficulty: 'easy' },
  { id: 2, startWord: 'tree', optimalSteps: 4, difficulty: 'easy' },
  { id: 3, startWord: 'bear', optimalSteps: 5, difficulty: 'medium' },
  { id: 4, startWord: 'song', optimalSteps: 6, difficulty: 'medium' },
  { id: 5, startWord: 'game', optimalSteps: 7, difficulty: 'hard' },
  { id: 6, startWord: 'jazz', optimalSteps: 9, difficulty: 'hard' },
]

/**
 * Deterministic daily pick: day N (AEST epoch from src/lib/daily.ts)
 * maps to puzzle (N-1) mod count — same scheme as Heist/Contain.
 */
export function getDailyPuzzle(dayNumber: number): Puzzle {
  const idx = ((dayNumber - 1) % PUZZLES.length + PUZZLES.length) % PUZZLES.length
  return PUZZLES[idx]
}

export function getPuzzleById(id: number): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id)
}
