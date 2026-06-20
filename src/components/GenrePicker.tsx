'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SongGame from './SongGame'
import FinalScore from './FinalScore'

interface Challenge {
  id: string
  genre: string
  trackName: string
  artistName: string
  previewUrl: string
  spotifyTrackId: string
}

interface GameResult {
  guesses: string[]
  solved: boolean
  attemptsUsed: number
  timeTakenMs?: number | null
}

interface GenreData {
  challenge: Challenge | null
  result: GameResult | null
}

interface GenrePickerProps {
  genreData: Record<string, GenreData>
  dailyGenres: string[]
  isAdmin?: boolean
}

export default function GenrePicker({ genreData, dailyGenres, isAdmin }: GenrePickerProps) {
  const router = useRouter()
  const firstUnplayed = dailyGenres.find((g) => !genreData[g]?.result) ?? dailyGenres[0]
  const [activeGenre, setActiveGenre] = useState<string>(firstUnplayed)

  const allComplete = dailyGenres.every((g) => !!genreData[g]?.result)

  const handleComplete = () => {
    router.refresh()
    const next = dailyGenres.find((g) => g !== activeGenre && !genreData[g]?.result)
    if (next) setTimeout(() => setActiveGenre(next), 1800)
  }

  if (allComplete) {
    const results = dailyGenres
      .filter((g) => genreData[g]?.result)
      .map((g) => ({
        genre: g,
        solved: genreData[g].result!.solved,
        attemptsUsed: genreData[g].result!.attemptsUsed,
        guesses: genreData[g].result!.guesses,
        timeTakenMs: genreData[g].result!.timeTakenMs ?? null,
      }))

    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
        <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 w-full">
          {dailyGenres.map((genre) => {
            const result = genreData[genre]?.result
            return (
              <button
                key={genre}
                disabled
                className="flex-1 py-2 rounded-xl text-xs font-medium text-zinc-600 cursor-default tracking-wide"
              >
                {result?.solved ? '✓' : '✗'} {genre}
              </button>
            )
          })}
        </div>
        <FinalScore results={results} isAdmin={isAdmin} />
      </div>
    )
  }

  const data = genreData[activeGenre]

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-6 w-full max-w-lg mx-auto">
      {/* Genre tabs */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 w-full">
        {dailyGenres.map((genre, i) => {
          const result = genreData[genre]?.result
          const prevCompleted = i === 0 || !!genreData[dailyGenres[i - 1]]?.result
          const locked = !isAdmin && !prevCompleted && !result
          const isActive = activeGenre === genre && !locked

          const tabStyle = !locked
            ? isActive
              ? { backgroundColor: 'var(--accent)', color: 'rgba(0,0,0,0.75)' }
              : result?.solved
              ? { color: 'var(--accent)' }
              : undefined
            : undefined

          return (
            <button
              key={genre}
              onClick={() => !locked && setActiveGenre(genre)}
              disabled={locked}
              title={locked ? 'Complete the previous genre first' : undefined}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                locked
                  ? 'text-zinc-800 cursor-not-allowed'
                  : isActive
                  ? ''
                  : result
                  ? result.solved
                    ? 'hover:opacity-80'
                    : 'text-red-500 hover:text-red-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={tabStyle}
            >
              {locked ? '🔒' : genre}
            </button>
          )
        })}
      </div>

      {data?.challenge ? (
        <SongGame
          key={activeGenre}
          challenge={data.challenge}
          existingResult={data.result}
          onComplete={handleComplete}
        />
      ) : (
        <p className="text-zinc-600 text-sm">{activeGenre} not seeded today.</p>
      )}
    </div>
  )
}
