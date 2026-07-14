// Rating and share text — same thresholds/convention as Heist.

export type Rating = 'Perfect' | 'Sharp' | 'Safe' | 'Messy'

export function calculateRating(stepsUsed: number, optimal: number): Rating {
  const over = stepsUsed - optimal
  if (over <= 0) return 'Perfect'
  if (over <= 2) return 'Sharp'
  if (over <= 5) return 'Safe'
  return 'Messy'
}

export interface ShareData {
  puzzleNumber: number
  startWord: string
  stepsUsed: number
  optimal: number
  attempts: number
  streak: number
}

/**
 * Copy-paste result. Never reveals the optimal step count — that stays a
 * mystery so players have to guess it (same convention as Contain/Heist).
 */
export function generateShareText(data: ShareData): string {
  const rating = calculateRating(data.stepsUsed, data.optimal)
  const rungs = '🪜'.repeat(Math.min(data.stepsUsed, 18))
  return [
    `Omerdle #${data.puzzleNumber}`,
    `${data.startWord.toUpperCase()} → OMER in ${data.stepsUsed} steps`,
    `Rating: ${rating}`,
    `Attempts: ${data.attempts}`,
    `Streak: ${data.streak}`,
    rungs,
  ].join('\n')
}
