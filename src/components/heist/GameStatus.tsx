'use client'

import type { GameState } from '@/lib/heist/types'

interface GameStatusProps {
  state: GameState
  puzzleNumber: number
  isDaily: boolean
}

export default function GameStatus({ state, puzzleNumber, isDaily }: GameStatusProps) {
  const { puzzle, turn, hasLoot, status } = state

  const banner =
    status === 'won'
      ? { text: '🎉 Clean getaway! The loot is yours.', cls: 'text-emerald-400 font-bold' }
      : status === 'spotted'
        ? { text: '🚨 A guard spotted you. Try again!', cls: 'text-red-400 font-bold' }
        : status === 'caught'
          ? { text: '🚔 A guard walked right into you. Try again!', cls: 'text-red-400 font-bold' }
          : hasLoot
            ? { text: '💰 Loot secured — now get back to the exit 🚪!', cls: 'text-amber-300 font-semibold' }
            : { text: 'Reach the vault without being seen', cls: 'text-zinc-400' }

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
          Turns: <span className="font-bold text-white">{turn}</span>
        </span>
        <span className="text-zinc-300">
          Loot: <span className="font-bold text-white">{hasLoot ? '💰 secured' : '— in the vault'}</span>
        </span>
      </div>

      <p aria-live="polite" className={['text-sm', banner.cls].join(' ')}>{banner.text}</p>
    </div>
  )
}
