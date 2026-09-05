'use client'

import { useRef, useState } from 'react'
import { copyShare } from '@/lib/draw-the-curve/share'
import type { ScoreBreakdown } from '@/lib/draw-the-curve/types'

interface ShareResultProps {
  shareText: string
  breakdown: ScoreBreakdown
  bestScore: number
  streak: number
  sourceName: string
  sourceUrl: string
  onClose: () => void
}

export default function ShareResult({
  shareText,
  breakdown,
  bestScore,
  streak,
  sourceName,
  sourceUrl,
  onClose,
}: ShareResultProps) {
  const [buttonLabel, setButtonLabel] = useState('📋 Copy result')
  const [copyFailed, setCopyFailed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleCopy = async () => {
    const ok = await copyShare(shareText, textareaRef.current ?? undefined)
    // Always leave the text selected, so even a silently-failed clipboard
    // write leaves the player a visible block of text to copy themselves.
    textareaRef.current?.focus()
    textareaRef.current?.select()
    setButtonLabel(ok ? '✓ Copied!' : 'Selected — press Ctrl/Cmd+C')
    setCopyFailed(!ok)
    setTimeout(() => {
      setButtonLabel('📋 Copy result')
      setCopyFailed(false)
    }, 2600)
  }

  const stat = (label: string, value: string) => (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <p className="text-4xl font-black text-white">
            {breakdown.total}
            <span className="text-lg text-zinc-500 font-medium"> / 100</span>
          </p>
          <p className="text-zinc-300 text-sm mt-2 leading-relaxed">{breakdown.verdict}</p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Magnitude</p>
            <p className="text-xl font-bold text-white mt-0.5">{breakdown.magnitude}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Shape</p>
            <p className="text-xl font-bold text-white mt-0.5">{breakdown.shape}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 bg-zinc-900/60 rounded-2xl p-4">
          {stat('Best score', bestScore < 0 ? '—' : String(bestScore))}
          {stat('Streak', `${streak} 🔥`)}
        </div>

        <textarea
          ref={textareaRef}
          readOnly
          rows={7}
          value={shareText}
          aria-label="Shareable result text"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs font-mono leading-relaxed p-3 resize-none outline-none focus:border-blue-500"
        />

        <button
          onClick={handleCopy}
          className={[
            'py-3 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98]',
            copyFailed
              ? 'bg-red-500/10 border-red-500/50 text-red-300'
              : 'bg-blue-500/15 border-blue-500/50 text-blue-300 hover:bg-blue-500/25',
          ].join(' ')}
        >
          {buttonLabel}
        </button>

        <p className="text-center text-xs text-zinc-600">
          Source:{' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 underline">
            {sourceName}
          </a>
        </p>

        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}
