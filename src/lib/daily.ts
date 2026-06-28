// Daily game state persisted in localStorage.
// Day 1 epoch: 2026-06-29. Resets at midnight AEST (UTC+10).

export const SONGS_PER_DAY = 3

const EPOCH_DATE = '2026-06-29'
const STORAGE_KEY = 'jimsongdle_daily'

// ── Multiplier contribution registry ────────────────────────────────────────
// Each game writes its own entry here. The case-open multiplier is the product
// of all contributions. To add a future game: call saveGameContribution() with
// a unique gameId and a pct in [0, 1] representing performance.
//
// Multiplier formula: 1 + sum(pct_i * maxBoost_i)
// Currently: Jimsongdle contributes up to +2x (so range is 1x–3x).
// Future games extend the upper bound by their maxBoost.

export interface GameContribution {
  gameId: string
  label: string          // human-readable, shown in breakdown
  score: number
  maxScore: number
  pct: number            // score / maxScore
  maxBoost: number       // how much this game can add to the multiplier
  boost: number          // actual boost = pct * maxBoost
}

const CONTRIBUTIONS_KEY = 'jimsongdle_contributions'

export function loadGameContributions(): Record<string, GameContribution> {
  if (typeof window === 'undefined') return {}
  const today = getAESTDateString()
  try {
    const raw = localStorage.getItem(CONTRIBUTIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { date: string; games: Record<string, GameContribution> }
    if (parsed.date !== today) return {}
    return parsed.games
  } catch { return {} }
}

export function saveGameContribution(contribution: GameContribution): void {
  if (typeof window === 'undefined') return
  const today = getAESTDateString()
  const current = loadGameContributions()
  current[contribution.gameId] = contribution
  localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify({ date: today, games: current }))
}

export function resetGameContributions(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CONTRIBUTIONS_KEY)
}

export function contributionsToMultiplier(contributions: Record<string, GameContribution>): number {
  const totalBoost = Object.values(contributions).reduce((sum, c) => sum + c.boost, 0)
  return 1 + totalBoost
}

// Convenience: compute multiplier from current localStorage state
export function loadMultiplier(): number {
  return contributionsToMultiplier(loadGameContributions())
}

function getAESTDateString(): string {
  // AEST = UTC+10, no DST
  const now = new Date()
  const aestOffset = 10 * 60 // minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const aestMs = utcMs + aestOffset * 60_000
  const aest = new Date(aestMs)
  const y = aest.getFullYear()
  const m = String(aest.getMonth() + 1).padStart(2, '0')
  const d = String(aest.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getDayNumber(): number {
  const today = getAESTDateString()
  const epoch = new Date(EPOCH_DATE + 'T00:00:00')
  const current = new Date(today + 'T00:00:00')
  const diffMs = current.getTime() - epoch.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

export interface DailyState {
  date: string
  songsCompleted: number
  done: boolean
}

function defaultState(date: string): DailyState {
  return { date, songsCompleted: 0, done: false }
}

export function loadDailyState(): DailyState {
  if (typeof window === 'undefined') return defaultState(getAESTDateString())
  const today = getAESTDateString()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState(today)
    const parsed = JSON.parse(raw) as DailyState
    // Reset if it's a new day
    if (parsed.date !== today) return defaultState(today)
    return parsed
  } catch {
    return defaultState(today)
  }
}

export function saveDailyState(state: DailyState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetDailyState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

const CASE_KEY = 'jimsongdle_case'

// Score 0–18 → contribution pct for Jimsongdle (maxBoost = 2, so range 1x–3x)
export const JIMSONGDLE_MAX_BOOST = 2

export function scoreToMultiplier(score: number, maxScore: number): number {
  const pct = maxScore > 0 ? score / maxScore : 0
  return 1 + pct * JIMSONGDLE_MAX_BOOST
}

export interface CaseState {
  date: string
  multiplier: number
  spinsUsed: number
  results: string[]  // rarity names
}

export function saveCaseState(state: CaseState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CASE_KEY, JSON.stringify(state))
}

export function loadCaseState(): CaseState | null {
  if (typeof window === 'undefined') return null
  const today = (() => {
    const now = new Date()
    const aestOffset = 10 * 60
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
    const aestMs = utcMs + aestOffset * 60_000
    const d = new Date(aestMs)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()
  try {
    const raw = localStorage.getItem(CASE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CaseState
    if (parsed.date !== today) return null
    return parsed
  } catch { return null }
}

export function resetCaseState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CASE_KEY)
}

export function incrementSongsCompleted(state: DailyState): DailyState {
  const next = state.songsCompleted + 1
  const done = next >= SONGS_PER_DAY
  return { ...state, songsCompleted: next, done }
}

// ms until next midnight AEST
export function msUntilAESTMidnight(): number {
  const aestOffset = 10 * 60 // minutes
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const aestMs = utcMs + aestOffset * 60_000
  const aest = new Date(aestMs)
  const midnight = new Date(aestMs)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - aest.getTime()
}
