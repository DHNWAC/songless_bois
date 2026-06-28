'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CLIP_DURATIONS } from '@/lib/songs'
import {
  SONGS_PER_DAY,
  scoreToMultiplier,
  saveCaseState,
  loadCaseState,
  saveGameContribution,
  JIMSONGDLE_MAX_BOOST,
} from '@/lib/daily'
import type { SongResult } from './SongGame'

interface FinalScoreProps {
  results: SongResult[]
  dayNumber: number
}

function buildEmojiGrid(r: SongResult): string {
  return r.guesses
    .map((g, i) => {
      if (r.solved && i === r.guesses.length - 1) return '🟩'
      if (g === '') return '⬛'
      return '🟥'
    })
    .join('')
}

function scoreFor(r: SongResult): number {
  return r.solved ? CLIP_DURATIONS.length - r.attemptsUsed + 1 : 0
}

function getAESTDateString(): string {
  const now = new Date()
  const aestMs = now.getTime() + now.getTimezoneOffset() * 60_000 + 10 * 60 * 60_000
  const d = new Date(aestMs)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function FinalScore({ results, dayNumber }: FinalScoreProps) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const totalScore = results.reduce((acc, r) => acc + scoreFor(r), 0)
  const maxScore = CLIP_DURATIONS.length * SONGS_PER_DAY
  const solvedCount = results.filter((r) => r.solved).length
  const multiplier = scoreToMultiplier(totalScore, maxScore)

  // Save case state + contribution once on mount
  useEffect(() => {
    const pct = maxScore > 0 ? totalScore / maxScore : 0
    saveGameContribution({
      gameId: 'jimsongdle',
      label: 'Jimsongdle',
      score: totalScore,
      maxScore,
      pct,
      maxBoost: JIMSONGDLE_MAX_BOOST,
      boost: pct * JIMSONGDLE_MAX_BOOST,
    })
    const existing = loadCaseState()
    if (!existing) {
      saveCaseState({
        date: getAESTDateString(),
        multiplier,
        spinsUsed: 0,
        results: [],
      })
    }
  }, [multiplier, totalScore, maxScore])

  const url = typeof window !== 'undefined' ? window.location.origin : ''

  const shareText = [
    `Jimsongdle #${dayNumber} ${totalScore}/${maxScore} (${solvedCount}/${SONGS_PER_DAY} 🎵)`,
    '',
    ...results.map((r) => buildEmojiGrid(r)),
    '',
    url,
  ].join('\n')

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy your results:', shareText)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-4">
      {/* Score hero */}
      <div className="text-center">
        <p className="text-zinc-700 text-xs uppercase tracking-[0.2em] mb-2">Today&apos;s score</p>
        <p className="text-white font-black text-5xl leading-none tabular-nums">
          {totalScore}
          <span className="text-zinc-700 text-3xl font-bold">/{maxScore}</span>
        </p>
        <p className="text-zinc-600 text-sm mt-2">{solvedCount} of {SONGS_PER_DAY} songs solved</p>
      </div>

      {/* Case multiplier preview */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 flex items-center justify-between w-full">
        <div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Case open bonus</p>
          <p className="text-white font-black text-lg tabular-nums">{multiplier.toFixed(2)}x multiplier</p>
        </div>
        <div className="text-3xl">📦</div>
      </div>

      {/* Per-song cards */}
      <div className="w-full flex flex-col gap-2">
        {results.map((r, i) => (
          <div
            key={i}
            className="w-full rounded-2xl border p-4 flex items-center justify-between"
            style={r.solved
              ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
              : { borderColor: '#262626', backgroundColor: 'rgba(24,24,27,0.5)' }}
          >
            <div>
              <p className="text-white font-semibold text-sm">Song {i + 1}</p>
              <p className="text-xs mt-0.5" style={r.solved ? { color: 'var(--accent)' } : { color: '#525252' }}>
                {r.solved ? `Got it in ${r.attemptsUsed}` : 'Not solved'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base tracking-wider">{buildEmojiGrid(r)}</span>
              {r.solved && (
                <span className="font-bold text-sm tabular-nums" style={{ color: 'var(--accent)' }}>
                  +{scoreFor(r)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-2">
        <button
          onClick={() => router.push('/case-open')}
          className="w-full py-3 rounded-2xl font-black text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: '#e4ae39', color: 'rgba(0,0,0,0.8)' }}
        >
          📦 Open Cases ({multiplier.toFixed(2)}x odds)
        </button>
        <button
          onClick={handleShare}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent)', color: 'rgba(0,0,0,0.75)' }}
        >
          {copied ? 'Copied!' : 'Share results'}
        </button>
        <div className="w-full py-3 rounded-2xl font-semibold text-sm text-zinc-600 bg-zinc-900 border border-zinc-800 text-center">
          Come back tomorrow ✓
        </div>
      </div>
    </div>
  )
}
