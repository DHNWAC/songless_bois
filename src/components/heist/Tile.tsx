'use client'

import type { Position } from '@/lib/heist/types'

interface TileProps {
  pos: Position
  isWall: boolean
  isVault: boolean
  looted: boolean
  isStart: boolean
  /** Unsafe to end this turn on: next-tick guard tile or sight ray. */
  danger: boolean
  canMove: boolean
  onTap: (pos: Position) => void
}

export default function Tile({ pos, isWall, isVault, looted, isStart, danger, canMove, onTap }: TileProps) {
  const content = isWall ? '' : isVault ? '💰' : isStart ? '🚪' : ''

  return (
    <button
      onClick={() => onTap(pos)}
      disabled={isWall}
      aria-label={
        isWall
          ? 'Wall'
          : isVault
            ? looted
              ? 'Vault (emptied)'
              : 'Vault'
            : isStart
              ? 'Exit'
              : `Tile row ${pos.row + 1}, column ${pos.col + 1}${danger ? ', watched' : ''}`
      }
      className={[
        'relative aspect-square flex items-center justify-center select-none rounded-[4px] text-base sm:text-xl transition-colors duration-150',
        isWall ? 'bg-zinc-700/90 border border-zinc-600/40' : 'bg-violet-950/50',
        danger && !isWall ? 'bg-red-900/60' : '',
        canMove ? 'cursor-pointer hover:bg-violet-700/60 active:bg-violet-600/60 ring-1 ring-violet-400/30' : '',
        isVault && looted ? 'opacity-40 grayscale' : '',
      ].join(' ')}
    >
      <span className={looted && isVault ? 'opacity-50' : ''}>{content}</span>
      {danger && !isWall && (
        <span className="absolute inset-0 rounded-[4px] bg-red-500/15 pointer-events-none" aria-hidden="true" />
      )}
    </button>
  )
}
