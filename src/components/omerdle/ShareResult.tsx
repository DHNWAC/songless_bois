'use client'

import { useState } from 'react'
import { calculateRating, generateShareText, type ShareData } from '@/lib/omerdle/scoring'

interface ShareResultProps {
  data: ShareData
  bestScore: number
  onClose: () => void
}

export default function ShareResult({ data, bestScore, onClose }: ShareResultProps) {
  const [copied, setCopied] = useState(false)
  const rating = calculateRating(data.stepsUsed, data.optimal)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText(data))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (permissions/insecure context) — leave button as-is.
    }
  }

  const stat = (label: string, value: string) => (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4">
        <div className="text-center">
          <p className="text-4xl mb-1">🪜✨</p>
          <p className="text-white font-black text-xl">You reached OMER!</p>
          <p
            className={[
              'font-bold text-sm mt-1',
              rating === 'Perfect'
                ? 'text-emerald-400'
                : rating === 'Sharp'
                  ? 'text-orange-400'
                  : rating === 'Safe'
                    ? 'text-amber-400'
                    : 'text-zinc-400',
            ].join(' ')}
          >
            {rating}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 bg-zinc-900/60 rounded-2xl p-4">
          {stat('Steps', String(data.stepsUsed))}
          {stat('Optimal', String(data.optimal))}
          {stat('Best score', bestScore === -1 ? '—' : String(bestScore))}
          {stat('Attempts', String(data.attempts))}
          {stat('Streak', `${data.streak} 🔥`)}
        </div>

        <button
          onClick={handleCopy}
          className="py-3 rounded-2xl font-bold text-sm bg-orange-500/15 border border-orange-500/50 text-orange-300 hover:bg-orange-500/25 active:scale-[0.98] transition-all"
        >
          {copied ? '✓ Copied!' : '📋 Share result'}
        </button>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}
