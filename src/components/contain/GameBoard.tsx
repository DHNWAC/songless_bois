'use client'

import { canPlaceRock, isEdge, posKey, samePos } from '@/lib/contain/board'
import type { SharkPlan } from '@/lib/contain/shark'
import type { GameState, Position } from '@/lib/contain/types'
import Tile from './Tile'

interface GameBoardProps {
  state: GameState
  plan: SharkPlan
  showPath: boolean
  onPlace: (pos: Position) => void
}

export default function GameBoard({ state, plan, showPath, onPlace }: GameBoardProps) {
  const size = state.puzzle.size
  const rockKeys = new Set(state.rocks.map(posKey))
  const playerRockKeys = new Set(state.playerRocks.map(posKey))
  const threatenedKeys = new Set(plan.reachableFish.map(posKey))
  const pathKeys = showPath ? new Set(plan.path.slice(1).map(posKey)) : new Set<number>()
  const sharkOnEdge = isEdge(state.sharkPos, size)
  const lost = state.status === 'ate-fish' || state.status === 'escaped'

  const rows: Position[][] = []
  for (let row = 0; row < size; row++) {
    const cols: Position[] = []
    for (let col = 0; col < size; col++) cols.push({ row, col })
    rows.push(cols)
  }

  return (
    <div
      className="relative rounded-2xl border border-sky-800/50 bg-sky-950/40 p-1.5"
      role="grid"
      aria-label="Game board"
    >
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {rows.flat().map((pos) => {
          const k = posKey(pos)
          return (
            <Tile
              key={k}
              pos={pos}
              hasRock={rockKeys.has(k)}
              isPlayerRock={playerRockKeys.has(k)}
              hasFish={state.fish.some((f) => samePos(f, pos))}
              fishThreatened={threatenedKeys.has(k) && state.status === 'playing'}
              onPath={pathKeys.has(k) && state.status === 'playing'}
              isEdge={isEdge(pos, size)}
              canPlace={canPlaceRock(state, pos)}
              onPlace={onPlace}
            />
          )
        })}
      </div>

      {/* Shark overlay — animates between tiles on the compositor (transform only). */}
      <div
        className="absolute pointer-events-none flex items-center justify-center transition-transform duration-300 ease-out motion-reduce:transition-none"
        aria-label="Shark"
        style={{
          // Tile size = (inner width − gaps) / size; each step = own size + 2px gap.
          top: 0,
          left: 0,
          width: `calc((100% - 0.75rem - ${(size - 1) * 2}px) / ${size})`,
          height: `calc((100% - 0.75rem - ${(size - 1) * 2}px) / ${size})`,
          margin: '0.375rem',
          transform: `translate(calc(${state.sharkPos.col * 100}% + ${state.sharkPos.col * 2}px), calc(${state.sharkPos.row * 100}% + ${state.sharkPos.row * 2}px))`,
        }}
      >
        <span
          className={[
            'text-lg sm:text-2xl drop-shadow-lg',
            state.status === 'won' ? 'grayscale opacity-70' : '',
            lost ? 'scale-125' : '',
            sharkOnEdge && plan.aboutToEscape && state.status === 'playing' ? 'animate-pulse' : '',
          ].join(' ')}
        >
          🦈
        </span>
        {sharkOnEdge && plan.aboutToEscape && state.status === 'playing' && (
          <span className="absolute -top-2 text-[10px] font-bold text-red-400 whitespace-nowrap bg-zinc-950/80 px-1 rounded">
            escaping!
          </span>
        )}
      </div>
    </div>
  )
}
