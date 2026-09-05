// Shared AEST (UTC+10, no DST) date helpers — every daily game resets at
// midnight AEST rather than the player's local midnight, so everyone gets
// the same puzzle/songs on the same day regardless of timezone.

const AEST_OFFSET_MINUTES = 10 * 60

function toAEST(now: Date): Date {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  return new Date(utcMs + AEST_OFFSET_MINUTES * 60_000)
}

export function getAESTDateString(now: Date = new Date()): string {
  const aest = toAEST(now)
  const y = aest.getFullYear()
  const m = String(aest.getMonth() + 1).padStart(2, '0')
  const d = String(aest.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** ms until the next AEST midnight rollover, for "next puzzle in" countdowns. */
export function msUntilAESTMidnight(now: Date = new Date()): number {
  const aest = toAEST(now)
  const midnight = new Date(aest)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - aest.getTime()
}
