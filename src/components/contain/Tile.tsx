'use client'

import type { Position } from '@/lib/contain/types'

interface TileProps {
  pos: Position
  hasRock: boolean
  isPlayerRock: boolean
  hasFish: boolean
  fishThreatened: boolean
  onPath: boolean
  isEdge: boolean
  canPlace: boolean
  onPlace: (pos: Position) => void
}

export default function Tile({
  pos,
  hasRock,
  isPlayerRock,
  hasFish,
  fishThreatened,
  onPath,
  isEdge,
  canPlace,
  onPlace,
}: TileProps) {
  const content = hasRock ? '🪨' : hasFish ? '🐟' : ''

  return (
    <button
      onClick={() => onPlace(pos)}
      disabled={!canPlace}
      aria-label={
        hasRock ? 'Rock' : hasFish ? (fishThreatened ? 'Fish in danger' : 'Fish') : `Place rock at row ${pos.row + 1}, column ${pos.col + 1}`
      }
      className={[
        'relative aspect-square flex items-center justify-center select-none rounded-[4px] text-base sm:text-xl transition-colors duration-150',
        isEdge ? 'bg-sky-950/70' : 'bg-sky-900/50',
        canPlace ? 'cursor-pointer hover:bg-sky-700/60 active:bg-sky-600/60' : 'cursor-default',
        fishThreatened ? 'ring-2 ring-red-500/80 animate-pulse' : '',
        isPlayerRock ? 'bg-zinc-700/60' : '',
      ].join(' ')}
    >
      {content}
      {fishThreatened && (
        <span className="absolute -top-1 -right-1 text-[10px]" aria-hidden="true">⚠️</span>
      )}
      {onPath && !hasRock && !hasFish && (
        <span className="absolute w-1.5 h-1.5 rounded-full bg-red-400/70 pointer-events-none" aria-hidden="true" />
      )}
    </button>
  )
}
