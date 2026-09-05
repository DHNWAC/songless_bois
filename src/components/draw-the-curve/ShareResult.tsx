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

  const isFirstPlay = bestScore < 0 || bestScore === breakdown.total

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-white font-black text-lg">Share your result</p>
          <button onClick={onClose} aria-label="Close" className="text-zinc-600 hover:text-zinc-300 text-xl leading-none transition-colors">
            ×
          </button>
        </div>

        {!isFirstPlay && (
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-400">
            <span>Best <span className="text-white font-bold">{bestScore}</span></span>
            <span className="text-zinc-700">·</span>
            <span>Streak <span className="text-white font-bold">{streak}</span> 🔥</span>
          </div>
        )}

        <pre
          className="w-full whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs leading-relaxed p-4"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
        >
          {shareText}
        </pre>
        {/* Off-screen but laid-out (not clip-hidden) — execCommand('copy')
            needs a real, selectable textarea; the <pre> above is what's
            shown, in a font we know renders the block-drawing glyphs
            correctly (Geist Mono's subset drops them, rendering as broken
            tofu boxes). Positioned like the hidden-textarea fallback in
            share.ts, which this codebase already found execCommand needs. */}
        <textarea
          ref={textareaRef}
          readOnly
          value={shareText}
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, padding: 0, border: 'none', opacity: 0.01 }}
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
      </div>
    </div>
  )
}
