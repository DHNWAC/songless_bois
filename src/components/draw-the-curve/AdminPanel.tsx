'use client'

import { useState } from 'react'
import { getDayNumber, listPuzzles, queueLength } from '@/lib/draw-the-curve/puzzles'
import { resetAllProgress, resetRecord } from '@/lib/draw-the-curve/storage'

interface AdminPanelProps {
  currentPuzzleId: string
  onClose: () => void
  onJump: (index: number | null) => void
}

export default function AdminPanel({ currentPuzzleId, onClose, onJump }: AdminPanelProps) {
  // Safe to compute directly: this panel is only ever conditionally mounted
  // after a click, never part of the server-rendered HTML, so there is no
  // hydration mismatch to guard against here.
  const dayNumber = getDayNumber()
  const [resetDone, setResetDone] = useState<'day' | 'all' | null>(null)
  const puzzles = listPuzzles()

  const handleResetThis = () => {
    resetRecord(currentPuzzleId)
    setResetDone('day')
    setTimeout(() => setResetDone(null), 2000)
  }

  const handleResetAll = () => {
    resetAllProgress()
    setResetDone('all')
    setTimeout(() => setResetDone(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-red-900/60 rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-400 text-xs uppercase tracking-widest font-semibold">Admin</p>
            <p className="text-white font-black text-lg">Draw the Curve #{dayNumber}</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white text-xl leading-none transition-colors" aria-label="Close admin panel">
            ✕
          </button>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Puzzles in rotation</span>
            <span className="text-white font-semibold">{queueLength()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Current puzzle id</span>
            <span className="text-white font-mono text-xs truncate max-w-[60%] text-right">{currentPuzzleId}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Jump to puzzle</p>
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              onJump(v === '' ? null : Number(v))
            }}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-zinc-500"
          >
            <option value="">— today&apos;s real puzzle —</option>
            {puzzles.map((p) => (
              <option key={p.index} value={p.index}>
                #{p.index + 1} — {p.prompt.slice(0, 56)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleResetThis}
            className="w-full py-3 rounded-2xl font-semibold text-sm border border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300 transition-all active:scale-[0.98]"
          >
            {resetDone === 'day' ? 'Reset! Reload to replay ✓' : 'Reset this result'}
          </button>
          <button
            onClick={handleResetAll}
            className="w-full py-3 rounded-2xl font-semibold text-sm border border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300 transition-all active:scale-[0.98]"
          >
            {resetDone === 'all' ? 'Reset! Reload to replay ✓' : 'Reset ALL history'}
          </button>
        </div>
      </div>
    </div>
  )
}
