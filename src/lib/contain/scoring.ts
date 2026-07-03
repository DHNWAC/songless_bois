// Rating and share text.

import type { Rating } from './types'

export function calculateRating(rocksUsed: number, optimal: number): Rating {
  const over = rocksUsed - optimal
  if (over <= 0) return 'Perfect'
  if (over === 1) return 'Sharp'
  if (over <= 3) return 'Safe'
  return 'Messy'
}

export interface ShareData {
  puzzleNumber: number
  rocksUsed: number
  optimal: number
  fishSaved: number
  fishTotal: number
  attempts: number
  streak: number
}

/**
 * Copy-paste result. Never reveals the solution placements OR the puzzle's
 * optimal rock count — that stays a mystery so players have to guess it.
 */
export function generateShareText(data: ShareData): string {
  const rating = calculateRating(data.rocksUsed, data.optimal)
  const rockRow = '🦈' + '🪨'.repeat(Math.min(data.rocksUsed, 20))
  return [
    `Contain #${data.puzzleNumber}`,
    `Solved in ${data.rocksUsed} rocks`,
    `Rating: ${rating}`,
    `Fish saved: ${data.fishSaved}/${data.fishTotal}`,
    `Attempts: ${data.attempts}`,
    `Streak: ${data.streak}`,
    rockRow,
  ].join('\n')
}
