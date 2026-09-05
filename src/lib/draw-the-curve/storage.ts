// localStorage persistence for Draw the Curve — mirrors src/lib/heist/storage.ts.
// Scores are 0-100 (higher is better); bestScore improves monotonically.
// First result for a puzzle also locks the drawn line so a reload restores
// the exact sketch that was scored, rather than replaying for a better score.

import { getSigned, setSigned } from '../integrity'

const STORAGE_KEY = 'draw_the_curve_progress'

export interface PuzzleRecord {
  puzzleId: string
  firstScore: number
  bestScore: number
  attempts: number
  completed: boolean
  /** Compressed sketch (see compressLine), so a revisit can redraw it. */
  line: string
}

export interface DrawTheCurveProgress {
  records: Record<string, PuzzleRecord>
  streak: number
  /** AEST date string of the last daily-completion, e.g. '2026-07-20'. */
  lastCompletedDate: string | null
}

function defaultProgress(): DrawTheCurveProgress {
  return { records: {}, streak: 0, lastCompletedDate: null }
}

export function loadProgress(): DrawTheCurveProgress {
  const stored = getSigned<DrawTheCurveProgress>(STORAGE_KEY)
  return stored ? { ...defaultProgress(), ...stored } : defaultProgress()
}

function saveProgress(progress: DrawTheCurveProgress): void {
  setSigned(STORAGE_KEY, progress)
}

export function getRecord(puzzleId: string): PuzzleRecord | null {
  return loadProgress().records[puzzleId] ?? null
}

/**
 * Record a completed round. Only the first submission for a puzzle is scored
 * and stored — repeat visits to an already-completed puzzle should not call
 * this again (the page checks getRecord() first).
 */
export function recordResult(
  puzzleId: string,
  score: number,
  line: string,
  todayAEST: string,
  isDaily: boolean,
): DrawTheCurveProgress {
  const progress = loadProgress()
  const prev = progress.records[puzzleId]
  const record: PuzzleRecord = prev
    ? {
        ...prev,
        completed: true,
        attempts: prev.attempts + 1,
        bestScore: Math.max(prev.bestScore, score),
      }
    : { puzzleId, firstScore: score, bestScore: score, attempts: 1, completed: true, line }

  let { streak, lastCompletedDate } = progress
  if (isDaily && lastCompletedDate !== todayAEST) {
    streak = lastCompletedDate === yesterdayOf(todayAEST) ? streak + 1 : 1
    lastCompletedDate = todayAEST
  }

  const next: DrawTheCurveProgress = {
    records: { ...progress.records, [puzzleId]: record },
    streak,
    lastCompletedDate,
  }
  saveProgress(next)
  return next
}

/** Clear one puzzle's saved result — admin/testing only, so it can be replayed. */
export function resetRecord(puzzleId: string): void {
  const progress = loadProgress()
  if (!progress.records[puzzleId]) return
  const records = { ...progress.records }
  delete records[puzzleId]
  saveProgress({ ...progress, records })
}

/** Clear everything — admin/testing only. */
export function resetAllProgress(): void {
  saveProgress(defaultProgress())
}

function yesterdayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// --- sketch (de)compression ---------------------------------------------
// Resample the drawn line to a fixed grid and encode each y as one base64url
// character (64 levels) — enough to redraw the sketch recognisably in a
// small string that fits comfortably inside the signed JSON blob above.

const GRID = 64
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export function compressLine(
  line: { x: number; y: number }[],
  xStart: number,
  xEnd: number,
  yMin: number,
  yMax: number,
): string {
  if (line.length === 0) return ''
  const span = xEnd - xStart || 1
  const yRange = yMax - yMin || 1
  let out = ''
  for (let i = 0; i < GRID; i++) {
    const x = xStart + (i / (GRID - 1)) * span
    const y = sampleLine(line, x)
    const level = Math.max(0, Math.min(63, Math.round(((y - yMin) / yRange) * 63)))
    out += ALPHABET[level]
  }
  return out
}

export function decompressLine(
  s: string,
  xStart: number,
  xEnd: number,
  yMin: number,
  yMax: number,
): { x: number; y: number }[] {
  if (!s) return []
  const span = xEnd - xStart || 1
  const yRange = yMax - yMin || 1
  return Array.from(s, (ch, i) => ({
    x: xStart + (i / (s.length - 1 || 1)) * span,
    y: yMin + (ALPHABET.indexOf(ch) / 63) * yRange,
  }))
}

function sampleLine(line: { x: number; y: number }[], x: number): number {
  if (x <= line[0].x) return line[0].y
  const last = line[line.length - 1]
  if (x >= last.x) return last.y
  for (let i = 0; i < line.length - 1; i++) {
    if (x <= line[i + 1].x) {
      const a = line[i]
      const b = line[i + 1]
      const t = (x - a.x) / (b.x - a.x || 1)
      return a.y + t * (b.y - a.y)
    }
  }
  return last.y
}
