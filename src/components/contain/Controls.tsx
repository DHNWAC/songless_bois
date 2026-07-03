'use client'

interface ControlsProps {
  canUndo: boolean
  showPath: boolean
  onUndo: () => void
  onRestart: () => void
  onTogglePath: () => void
}

const btn =
  'px-3 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100'

export default function Controls({ canUndo, showPath, onUndo, onRestart, onTogglePath }: ControlsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
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
        onClick={onTogglePath}
        aria-pressed={showPath}
        className={`${btn} ${
          showPath
            ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
            : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
        }`}
      >
        👁 Shark path
      </button>
    </div>
  )
}
