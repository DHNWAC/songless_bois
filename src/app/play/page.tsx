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
    <main className="min-h-screen pt-12 sm:pt-20 pb-8 sm:pb-16 px-4 relative overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora absolute -top-1/4 left-1/2 w-[80vmax] h-[80vmax] -translate-x-1/2 rounded-full blur-[120px] opacity-[0.08]" style={{ background: 'radial-gradient(circle, var(--accent), transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="max-w-lg mx-auto mb-6 flex items-center justify-between relative z-10 fade-up">
        <div className="flex items-center gap-3">
          {/* mini animated waveform */}
          <div className="flex items-end gap-0.5 h-6">
            {[5, 9, 4, 11, 6].map((h, i) => (
              <div
                key={i}
                className="eq-bar w-0.5 rounded-full"
                style={{ height: `${h * 2}px`, background: 'var(--accent)', ['--eq-dur' as string]: `${0.5 + i * 0.1}s`, ['--eq-delay' as string]: `${i * 0.08}s`, opacity: 0.7 }}
              />
            ))}
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight">Jimsongdle</h1>
            <p className="text-zinc-600 text-xs font-semibold tracking-widest uppercase">#{dayNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/jimsongdle" className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors">← Back</Link>
          <Link href="/" className="text-zinc-700 hover:text-zinc-400 text-sm transition-colors">All games</Link>
        </div>
      </div>

      <div className="relative z-10">

      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-4 pt-20 text-center">
          <div className="flex items-end gap-1 h-10">
            {[0,1,2,3,4,5,6].map((i) => (
              <div
                key={i}
                className="eq-bar w-1.5 rounded-full"
                style={{ height: '70%', background: 'var(--accent)', ['--eq-dur' as string]: `${0.5 + (i % 3) * 0.15}s`, ['--eq-delay' as string]: `${i * 0.07}s` }}
              />
            ))}
          </div>
          <p className="text-zinc-500 text-sm">Tuning the clips…</p>
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
        <div className="flex flex-col items-center gap-4 pt-20 text-center fade-up">
          <div className="relative">
            <div className="halo-pulse absolute inset-0 rounded-full blur-xl" style={{ background: 'var(--accent)', opacity: 0.3 }} />
            <p className="relative text-5xl">🎵</p>
          </div>
          <p className="text-white font-black text-xl">You&apos;re done for today!</p>
          <p className="text-zinc-500 text-sm max-w-xs">You played all {SONGS_PER_DAY} songs for Jimsongdle #{dayNumber}.</p>
          <p className="text-zinc-600 text-xs">Come back tomorrow for new songs.</p>
          <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
            <Link
              href="/case-open"
              className="cta-pulse px-5 py-3 rounded-xl text-sm font-black transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #f5d572, #e4ae39)', color: 'rgba(0,0,0,0.85)' }}
            >
              📦 Open your cases
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
            >
              ← Home
            </Link>
          </div>
        </div>
      )}
      </div>
    </main>
  )
}
