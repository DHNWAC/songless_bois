'use client'

import { useRouter } from 'next/navigation'
import { CLIP_DURATIONS } from '@/lib/deezer'
import CountdownTimer from './CountdownTimer'

interface GenreResult {
  genre: string
  solved: boolean
  attemptsUsed: number
  guesses: string[]
  timeTakenMs: number | null
}

interface FinalScoreProps {
  results: GenreResult[]
  isAdmin?: boolean
}

const EMOJIS = {
  solved: ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩'],
  skip: '⬛',
  wrong: '🟥',
}

function buildEmojiGrid(guesses: string[], solved: boolean): string {
  return guesses.map((g, i) => {
    if (solved && i === guesses.length - 1) return '🟩'
    if (g === '') return EMOJIS.skip
    return EMOJIS.wrong
  }).join('')
}

function scoreForResult(r: GenreResult): number {
  if (!r.solved) return 0
  return CLIP_DURATIONS.length - r.attemptsUsed + 1
}

function formatTime(ms: number | null): string {
  if (!ms) return '--'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

export default function FinalScore({ results, isAdmin }: FinalScoreProps) {
  const router = useRouter()
  const totalScore = results.reduce((acc, r) => acc + scoreForResult(r), 0)
  const maxScore = CLIP_DURATIONS.length * results.length
  const totalTimeMs = results.reduce((acc, r) => acc + (r.timeTakenMs ?? 0), 0)
  const timeStr = formatTime(totalTimeMs || null)

  const shareText = [
    `Jimsengdle ${new Date().toLocaleDateString('en-AU')}`,
    `Score: ${totalScore}/${maxScore} · Time: ${timeStr}`,
    '',
    ...results.map((r) => `${r.genre}: ${buildEmojiGrid(r.guesses, r.solved)}`),
  ].join('\n')

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
        .then(() => alert('Copied to clipboard!'))
        .catch(() => alert(shareText))
    } else {
      alert(shareText)
    }
  }

  const handleAdminReset = async () => {
    await fetch('/api/admin/reset-today', { method: 'POST' })
    window.location.href = '/play'
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
        {totalTimeMs > 0 && (
          <p className="text-zinc-600 text-sm mt-2 font-mono">{timeStr}</p>
        )}
      </div>

      {/* Genre result cards */}
      <div className="w-full flex flex-col gap-2">
        {results.map((r) => (
          <div
            key={r.genre}
            className="w-full rounded-2xl border p-4 flex items-center justify-between"
            style={r.solved ? {
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--accent-dim)',
            } : {
              borderColor: '#262626',
              backgroundColor: 'rgba(24,24,27,0.5)',
            }}
          >
            <div>
              <p className="text-white font-semibold text-sm">{r.genre}</p>
              <p
                className="text-xs mt-0.5"
                style={r.solved ? { color: 'var(--accent)' } : { color: '#525252' }}
              >
                {r.solved ? `Got it in ${r.attemptsUsed}` : 'Not solved'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base tracking-wider">{buildEmojiGrid(r.guesses, r.solved)}</span>
              {r.solved && (
                <span className="font-bold text-sm tabular-nums" style={{ color: 'var(--accent)' }}>
                  +{scoreForResult(r)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Share */}
      <button
        onClick={handleShare}
        className="w-full py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: 'var(--accent)', color: 'rgba(0,0,0,0.75)' }}
      >
        Share results
      </button>

      <CountdownTimer />

      {isAdmin && (
        <button
          onClick={handleAdminReset}
          className="text-xs text-zinc-700 hover:text-red-500 transition-colors border border-zinc-800 hover:border-red-900 rounded-lg px-3 py-1.5"
        >
          🔄 Admin: reset today&apos;s results
        </button>
      )}
    </div>
  )
}
