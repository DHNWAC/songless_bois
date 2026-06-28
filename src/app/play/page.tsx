'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { buildRound, type Song } from '@/lib/songs'
import {
  getDayNumber,
  loadDailyState,
  saveDailyState,
  incrementSongsCompleted,
  SONGS_PER_DAY,
} from '@/lib/daily'
import SongGame, { type SongResult } from '@/components/SongGame'
import FinalScore from '@/components/FinalScore'

type Phase = 'loading' | 'error' | 'playing' | 'done' | 'daily-limit'

export default function PlayPage() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [songs, setSongs] = useState<Song[]>([])
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<SongResult[]>([])
  const [dayNumber, setDayNumber] = useState(1)

  const start = useCallback(async () => {
    setPhase('loading')
    setSongs([])
    setResults([])
    setCurrent(0)

    const day = getDayNumber()
    setDayNumber(day)

    const dailyState = loadDailyState()

    if (dailyState.done) {
      setPhase('daily-limit')
      return
    }

    try {
      const round = await buildRound(SONGS_PER_DAY, day)
      if (round.length === 0) { setPhase('error'); return }
      setSongs(round)
      setPhase('playing')
    } catch {
      setPhase('error')
    }
  }, [])

  useEffect(() => { void start() }, [start])

  const handleResult = (result: SongResult) => {
    const next = [...results, result]
    setResults(next)

    const dailyState = loadDailyState()
    const updated = incrementSongsCompleted(dailyState)
    saveDailyState(updated)

    if (current + 1 >= SONGS_PER_DAY) {
      setPhase('done')
    } else {
      setCurrent(current + 1)
      // stay in 'playing' — SongGame remounts via key={current+1}
    }
  }

  return (
    <main className="min-h-screen pt-12 sm:pt-20 pb-8 sm:pb-16 px-4">
      <div className="max-w-lg mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-xl tracking-tight">Jimsongdle</h1>
          <p className="text-zinc-600 text-xs font-semibold tracking-widest uppercase">#{dayNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/jimsongdle" className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors">← Back</Link>
          <Link href="/" className="text-zinc-700 hover:text-zinc-400 text-sm transition-colors">All games</Link>
        </div>
      </div>

      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-3 pt-20 text-center">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
          <p className="text-zinc-600 text-sm">Loading songs…</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-4 pt-20 text-center">
          <p className="text-zinc-400 text-sm">Couldn&apos;t load songs. Check your connection.</p>
          <button
            onClick={() => void start()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: 'rgba(0,0,0,0.75)' }}
          >
            Try again
          </button>
        </div>
      )}

      {phase === 'playing' && songs[current] && (
        <SongGame
          key={current}
          song={songs[current]}
          index={current}
          total={SONGS_PER_DAY}
          onResult={handleResult}
        />
      )}

      {phase === 'done' && (
        <FinalScore
          results={results}
          dayNumber={dayNumber}
        />
      )}

      {phase === 'daily-limit' && (
        <div className="flex flex-col items-center gap-4 pt-20 text-center">
          <p className="text-4xl">🎵</p>
          <p className="text-white font-bold text-lg">You&apos;re done for today!</p>
          <p className="text-zinc-500 text-sm">You played all {SONGS_PER_DAY} songs for Jimsongdle #{dayNumber}.</p>
          <p className="text-zinc-600 text-xs">Come back tomorrow at midnight AEST for new songs.</p>
          <Link
            href="/"
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
          >
            ← Home
          </Link>
        </div>
      )}
    </main>
  )
}
