'use client'

import { inBounds, posKey, samePos, wallSet } from '@/lib/heist/board'
import { dangerAt, guardFacing, guardPos } from '@/lib/heist/guards'
import type { GameState, Position } from '@/lib/heist/types'
import Tile from './Tile'

const FACING_ARROW = { up: '↑', right: '→', down: '↓', left: '←' } as const

interface GameBoardProps {
  state: GameState
  showVision: boolean
  onTileTap: (pos: Position) => void
}

/** Overlay geometry shared by the player and guard sprites (Contain's shark trick). */
function overlayStyle(pos: Position, size: number): React.CSSProperties {
  return {
    top: 0,
    left: 0,
    width: `calc((100% - 0.75rem - ${(size - 1) * 2}px) / ${size})`,
    height: `calc((100% - 0.75rem - ${(size - 1) * 2}px) / ${size})`,
    margin: '0.375rem',
    transform: `translate(calc(${pos.col * 100}% + ${pos.col * 2}px), calc(${pos.row * 100}% + ${pos.row * 2}px))`,
  }
}

export default function GameBoard({ state, showVision, onTileTap }: GameBoardProps) {
  const { puzzle, playerPos, turn, hasLoot, status } = state
  const size = puzzle.size
  const walls = wallSet(puzzle)
  const vaultLooted = hasLoot

  // Red wash = tiles that are lethal to END your next move on.
  const danger = dangerAt(puzzle, turn + 1, walls)
  const guardNow = new Set(puzzle.guards.map((g) => posKey(guardPos(g, turn))))

  const canMoveTo = (p: Position): boolean => {
    if (status !== 'playing') return false
    const dist = Math.abs(p.row - playerPos.row) + Math.abs(p.col - playerPos.col)
    if (dist > 1) return false // dist 0 = wait, dist 1 = step
    if (!inBounds(p, size) || walls.has(posKey(p))) return false
    if (dist === 1 && guardNow.has(posKey(p))) return false
    return true
  }

  const tiles: Position[] = []
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) tiles.push({ row, col })

  return (
    <div
      className="relative rounded-2xl border border-violet-800/50 bg-violet-950/40 p-1.5"
      role="grid"
      aria-label="Heist board"
    >
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {tiles.map((pos) => {
          const k = posKey(pos)
          return (
            <Tile
              key={k}
              pos={pos}
              isWall={walls.has(k)}
              isVault={samePos(pos, puzzle.vault)}
              looted={vaultLooted}
              isStart={samePos(pos, puzzle.start)}
              danger={showVision && status === 'playing' && (danger.sightKeys.has(k) || danger.guardKeys.has(k))}
              canMove={canMoveTo(pos)}
              onTap={onTileTap}
            />
          )
        })}
      </div>

      {/* Guards — one animated overlay each. */}
      {puzzle.guards.map((g, i) => {
        const pos = guardPos(g, turn)
        return (
          <div
            key={i}
            className="absolute pointer-events-none flex items-center justify-center transition-transform duration-300 ease-out motion-reduce:transition-none"
            aria-label="Guard"
            style={overlayStyle(pos, size)}
          >
            <span className="text-lg sm:text-2xl drop-shadow-lg">👮</span>
            <span className="absolute -top-1 -right-0.5 text-[10px] font-black text-red-300 bg-zinc-950/70 rounded px-0.5" aria-hidden="true">
              {FACING_ARROW[guardFacing(g, turn)]}
            </span>
          </div>
        )
      })}

      {/* Player. */}
      <div
        className="absolute pointer-events-none flex items-center justify-center transition-transform duration-300 ease-out motion-reduce:transition-none"
        aria-label="You"
        style={overlayStyle(playerPos, size)}
      >
        <span
          className={[
            'text-lg sm:text-2xl drop-shadow-lg',
            status === 'spotted' || status === 'caught' ? 'grayscale' : '',
            status === 'won' ? 'scale-125' : '',
          ].join(' ')}
        >
          🕵️
        </span>
        {hasLoot && status === 'playing' && (
          <span className="absolute -top-1.5 -right-1 text-[11px]" aria-hidden="true">💰</span>
        )}
        {(status === 'spotted' || status === 'caught') && (
          <span className="absolute -top-2 text-[10px] font-bold text-red-400 whitespace-nowrap bg-zinc-950/80 px-1 rounded">
            {status === 'spotted' ? 'spotted!' : 'caught!'}
          </span>
        )}
      </div>
    </div>
  )
}
