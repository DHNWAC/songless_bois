// localStorage persistence for Heist — mirrors src/lib/contain/storage.ts.
// Scores are turn counts (lower is better); bestScore improves monotonically.

export { getAESTDateString } from '../contain/storage'

const STORAGE_KEY = 'heist_progress'

export interface PuzzleRecord {
  puzzleId: number
  firstScore: number
  bestScore: number
  attempts: number
  completed: boolean
}

export interface HeistProgress {
  records: Record<number, PuzzleRecord>
  streak: number
  /** AEST date string of the last daily-completion, e.g. '2026-07-03'. */
  lastCompletedDate: string | null
}

function defaultProgress(): HeistProgress {
  return { records: {}, streak: 0, lastCompletedDate: null }
}

export function loadProgress(): HeistProgress {
  if (typeof window === 'undefined') return defaultProgress()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    return { ...defaultProgress(), ...(JSON.parse(raw) as HeistProgress) }
  } catch {
    return defaultProgress()
  }
}

function saveProgress(progress: HeistProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

/** Count a started attempt (called on the first move of a fresh attempt). */
export function recordAttempt(puzzleId: number): HeistProgress {
  const progress = loadProgress()
  const prev = progress.records[puzzleId]
  const record: PuzzleRecord = prev
    ? { ...prev, attempts: prev.attempts + 1 }
    : { puzzleId, firstScore: -1, bestScore: -1, attempts: 1, completed: false }
  const next = { ...progress, records: { ...progress.records, [puzzleId]: record } }
  saveProgress(next)
  return next
}

/**
 * Record a win. `todayAEST` and `isDaily` drive the streak: solving today's
 * daily extends it when yesterday's was also solved, else restarts it at 1.
 */
export function recordWin(
  puzzleId: number,
  turnsUsed: number,
  todayAEST: string,
  isDaily: boolean,
): HeistProgress {
  const progress = loadProgress()
  const prev = progress.records[puzzleId]
  const record: PuzzleRecord = prev
    ? {
        ...prev,
        completed: true,
        firstScore: prev.firstScore === -1 ? turnsUsed : prev.firstScore,
        bestScore: prev.bestScore === -1 ? turnsUsed : Math.min(prev.bestScore, turnsUsed),
      }
    : { puzzleId, firstScore: turnsUsed, bestScore: turnsUsed, attempts: 1, completed: true }

  let { streak, lastCompletedDate } = progress
  if (isDaily && lastCompletedDate !== todayAEST) {
    streak = lastCompletedDate === yesterdayOf(todayAEST) ? streak + 1 : 1
    lastCompletedDate = todayAEST
  }

  const next: HeistProgress = {
    records: { ...progress.records, [puzzleId]: record },
    streak,
    lastCompletedDate,
  }
  saveProgress(next)
  return next
}

function yesterdayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
