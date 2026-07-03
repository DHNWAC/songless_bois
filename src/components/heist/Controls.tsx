'use client'

interface ControlsProps {
  canUndo: boolean
  canWait: boolean
  showVision: boolean
  onUndo: () => void
  onRestart: () => void
  onWait: () => void
  onToggleVision: () => void
}

const btn =
  'px-3 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100'

export default function Controls({
  canUndo,
  canWait,
  showVision,
  onUndo,
  onRestart,
  onWait,
  onToggleVision,
}: ControlsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={onWait}
        disabled={!canWait}
        className={`${btn} border-violet-500/50 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20`}
      >
        ⏸ Wait
      </button>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`${btn} border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800`}
      >
        ↩ Undo
      </button>
      <button
        onClick={onRestart}
        className={`${btn} border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800`}
      >
        ⟳ Restart
      </button>
      <button
        onClick={onToggleVision}
        aria-pressed={showVision}
        className={`${btn} ${
          showVision
            ? 'border-red-500/60 bg-red-500/15 text-red-300'
            : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
        }`}
      >
        👁 Vision
      </button>
    </div>
  )
}
