import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDailyGenres, getDayNumber } from '@/lib/deezer'
import Header from '@/components/Header'
import GenrePicker from '@/components/GenrePicker'
import AdminDateNav from '@/components/AdminDateNav'

const ADMIN_EMAIL = 'daniel4.cordeiro@gmail.com'

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = user.email === ADMIN_EMAIL
  const today = new Date().toISOString().slice(0, 10)
  const params = await searchParams
  const activeDate = isAdmin && params.date ? params.date : today
  const dailyGenres = getDailyGenres(activeDate)
  const dayNumber = getDayNumber(activeDate)

  const { data: challenges } = await supabase
    .from('daily_challenges')
    .select('id, genre, track_name, artist_name, preview_url, spotify_track_id')
    .eq('challenge_date', activeDate)
    .in('genre', dailyGenres)

  const challengeIds = (challenges ?? []).map((c) => c.id)

  const { data: results } = challengeIds.length
    ? await supabase
        .from('game_results')
        .select('challenge_id, guesses, solved, attempts_used, time_taken_ms')
        .eq('user_id', user.id)
        .in('challenge_id', challengeIds)
    : { data: [] }

  // Admin previewing a non-today date: don't load real results (they'd be empty anyway)
  const effectiveResults = isAdmin && activeDate !== today ? [] : (results ?? [])

  const resultMap = Object.fromEntries(
    effectiveResults.map((r) => [r.challenge_id, r])
  )

  const seededGenres = dailyGenres.filter((genre) =>
    (challenges ?? []).some((c) => c.genre === genre)
  )

  const genreData = Object.fromEntries(
    seededGenres.map((genre) => {
      const challenge = (challenges ?? []).find((c) => c.genre === genre)!
      const result = resultMap[challenge.id] ?? null
      return [
        genre,
        {
          challenge: {
            id: challenge.id,
            genre: challenge.genre,
            trackName: challenge.track_name,
            artistName: challenge.artist_name,
            previewUrl: challenge.preview_url,
            spotifyTrackId: challenge.spotify_track_id,
          },
          result: result
            ? {
                guesses: result.guesses as string[],
                solved: result.solved as boolean,
                attemptsUsed: result.attempts_used as number,
                timeTakenMs: result.time_taken_ms as number | null,
              }
            : null,
        },
      ]
    })
  )

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 sm:pt-24 pb-8 sm:pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="mb-3 sm:mb-6 flex items-center justify-between">
            <div>
              <p className="text-zinc-700 text-xs uppercase tracking-[0.2em] mb-0.5">Day {dayNumber}</p>
              <h1 className="text-white font-black text-2xl tracking-tight leading-none">Jimsongdle</h1>
            </div>
            {isAdmin && <AdminDateNav currentDate={activeDate} today={today} />}
          </div>
        </div>
        <GenrePicker genreData={genreData} dailyGenres={seededGenres} isAdmin={isAdmin} />
      </main>
    </>
  )
}
