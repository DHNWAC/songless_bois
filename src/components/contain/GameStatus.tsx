'use client'

import type { GameState } from '@/lib/contain/types'

const STATUS_TEXT: Record<GameState['status'], { text: string; cls: string }> = {
  playing: { text: 'Trap the shark before it eats a fish or escapes', cls: 'text-zinc-400' },
  won: { text: '🎉 Contained! The shark is trapped.', cls: 'text-emerald-400 font-bold' },
  'ate-fish': { text: '💀 The shark ate a fish. Try again!', cls: 'text-red-400 font-bold' },
  escaped: { text: '🌊 The shark escaped off the map. Try again!', cls: 'text-red-400 font-bold' },
}

interface GameStatusProps {
  state: GameState
  puzzleNumber: number
  isDaily: boolean
}

export default function GameStatus({ state, puzzleNumber, isDaily }: GameStatusProps) {
  const { puzzle, playerRocks, status } = state
  const banner = STATUS_TEXT[status]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">
            {isDaily ? `Daily #${puzzleNumber}` : `Puzzle ${puzzle.id}`}
          </span>
          <span className="text-zinc-500 text-sm">{puzzle.title}</span>
        </div>
        <span
          className={[
            'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
            puzzle.difficulty === 'easy'
              ? 'bg-emerald-500/15 text-emerald-400'
              : puzzle.difficulty === 'medium'
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-red-500/15 text-red-400',
          ].join(' ')}
        >
          {puzzle.difficulty}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">
          Rocks: <span className="font-bold text-white">{playerRocks.length}</span>
        </span>
        <span className="text-zinc-300">
          Fish: <span className="font-bold text-white">{state.fish.length}</span>
          <span className="text-zinc-500">/{puzzle.fish.length}</span>
        </span>
      </div>

      <p aria-live="polite" className={['text-sm', banner.cls].join(' ')}>{banner.text}</p>
    </div>
  )
}
