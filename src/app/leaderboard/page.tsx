import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getDayNumber, CLIP_DURATIONS } from '@/lib/deezer'
import Header from '@/components/Header'
import LeaderboardView from '@/components/LeaderboardView'

const MAX_PER_GENRE = CLIP_DURATIONS.length

function scorePoints(attemptsUsed: number): number {
  return MAX_PER_GENRE - attemptsUsed + 1
}

function calcStreak(dates: string[], today: string): number {
  const dateSet = new Set(dates)
  let streak = 0
  const d = new Date(today + 'T00:00:00Z')
  while (true) {
    const s = d.toISOString().slice(0, 10)
    if (!dateSet.has(s)) break
    streak++
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return streak
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: results }, { data: challenges }, { data: profiles }] = await Promise.all([
    admin.from('game_results').select('user_id, solved, attempts_used, challenge_id, time_taken_ms'),
    admin.from('daily_challenges').select('id, challenge_date, genre'),
    admin.from('profiles').select('id, display_name, avatar_url'),
  ])

  const challengeMap = Object.fromEntries((challenges ?? []).map((c) => [c.id, c]))
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  // Per-user aggregation
  type UserStats = {
    totalScore: number
    totalGames: number
    totalSolved: number
    timeSamples: number[]
    datesPlayed: string[]
    today: { score: number; genres: { genre: string; solved: boolean; attemptsUsed: number; timeTakenMs: number | null }[] } | null
  }

  const statsMap: Record<string, UserStats> = {}

  for (const r of results ?? []) {
    const challenge = challengeMap[r.challenge_id]
    if (!challenge) continue

    if (!statsMap[r.user_id]) {
      statsMap[r.user_id] = { totalScore: 0, totalGames: 0, totalSolved: 0, timeSamples: [], datesPlayed: [], today: null }
    }
    const s = statsMap[r.user_id]
    const pts = r.solved ? scorePoints(r.attempts_used) : 0

    s.totalScore += pts
    s.totalGames++
    if (r.solved) s.totalSolved++
    if (r.time_taken_ms) s.timeSamples.push(r.time_taken_ms)
    if (!s.datesPlayed.includes(challenge.challenge_date)) {
      s.datesPlayed.push(challenge.challenge_date)
    }

    if (challenge.challenge_date === today) {
      if (!s.today) s.today = { score: 0, genres: [] }
      s.today.score += pts
      s.today.genres.push({
        genre: challenge.genre,
        solved: r.solved,
        attemptsUsed: r.attempts_used,
        timeTakenMs: r.time_taken_ms ?? null,
      })
    }
  }

  const todayEntries = Object.entries(statsMap)
    .filter(([, s]) => s.today !== null)
    .map(([userId, s]) => {
      const avgTime = s.today!.genres.reduce((acc, g) => acc + (g.timeTakenMs ?? 0), 0)
      return {
        userId,
        name: profileMap[userId]?.display_name ?? 'Player',
        avatarUrl: (profileMap[userId]?.avatar_url as string | null) ?? null,
        score: s.today!.score,
        maxScore: MAX_PER_GENRE * s.today!.genres.length,
        genres: s.today!.genres,
        totalTimeMs: avgTime,
      }
    })
    .sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)

  const allTimeEntries = Object.entries(statsMap)
    .map(([userId, s]) => {
      const avgTimeMs = s.timeSamples.length
        ? Math.round(s.timeSamples.reduce((a, b) => a + b, 0) / s.timeSamples.length)
        : null
      const streak = calcStreak(s.datesPlayed, today)
      return {
        userId,
        name: profileMap[userId]?.display_name ?? 'Player',
        avatarUrl: (profileMap[userId]?.avatar_url as string | null) ?? null,
        totalScore: s.totalScore,
        totalGames: s.totalGames,
        winRate: s.totalGames > 0 ? Math.round((s.totalSolved / s.totalGames) * 100) : 0,
        avgTimeMs,
        streak,
        daysPlayed: s.datesPlayed.length,
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4">
        <LeaderboardView
          todayEntries={todayEntries}
          allTimeEntries={allTimeEntries}
          dayNumber={getDayNumber(today)}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
