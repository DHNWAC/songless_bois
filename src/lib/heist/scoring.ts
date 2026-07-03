// Rating and share text.

import type { Rating } from './types'

export function calculateRating(turnsUsed: number, optimal: number): Rating {
  const over = turnsUsed - optimal
  if (over <= 0) return 'Perfect'
  if (over <= 2) return 'Sharp'
  if (over <= 5) return 'Safe'
  return 'Messy'
}

export interface ShareData {
  puzzleNumber: number
  turnsUsed: number
  optimal: number
  attempts: number
  streak: number
}

/**
 * Copy-paste result. Never reveals the optimal turn count — that stays a
 * mystery so players have to guess it (same convention as Contain).
 */
export function generateShareText(data: ShareData): string {
  const rating = calculateRating(data.turnsUsed, data.optimal)
  const trail = '🕵️' + '👣'.repeat(Math.min(data.turnsUsed, 18)) + '💰'
  return [
    `Heist #${data.puzzleNumber}`,
    `Clean getaway in ${data.turnsUsed} turns`,
    `Rating: ${rating}`,
    `Attempts: ${data.attempts}`,
    `Streak: ${data.streak}`,
    trail,
  ].join('\n')
}
