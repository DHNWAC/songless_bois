// Guard patrols and line of sight. Fully deterministic: a guard's position
// is a pure function of the turn number, so the whole future is knowable —
// that determinism is what makes puzzles exactly solvable.

import { DIRECTION_DELTAS, inBounds, posKey } from './board'
import type { Direction, Guard, Position, Puzzle } from './types'

export function guardPos(guard: Guard, turn: number): Position {
  return guard.loop[turn % guard.loop.length]
}

/**
 * Direction the guard faces on this turn: toward the next *different* tile in
 * its loop (pauses keep the guard looking where it is headed). Sentries
 * (single-tile loops) use their fixed facing.
 */
export function guardFacing(guard: Guard, turn: number): Direction {
  const len = guard.loop.length
  if (len === 1) return guard.facing ?? 'down'
  const cur = guardPos(guard, turn)
  for (let i = 1; i < len; i++) {
    const next = guard.loop[(turn + i) % len]
    if (next.row < cur.row) return 'up'
    if (next.row > cur.row) return 'down'
    if (next.col < cur.col) return 'left'
    if (next.col > cur.col) return 'right'
  }
  return guard.facing ?? 'down'
}

/**
 * Tiles a guard sees on this turn: a straight ray from its tile (exclusive)
 * in its facing direction, stopped by walls or the board edge.
 */
export function sightTiles(
  guard: Guard,
  turn: number,
  walls: Set<number>,
  size: number,
): Position[] {
  const d = DIRECTION_DELTAS[guardFacing(guard, turn)]
  const out: Position[] = []
  let p = guardPos(guard, turn)
  for (;;) {
    p = { row: p.row + d.row, col: p.col + d.col }
    if (!inBounds(p, size) || walls.has(posKey(p))) return out
    out.push(p)
  }
}

export interface DangerField {
  /** Tiles occupied by a guard on this turn. */
  guardKeys: Set<number>
  /** Tiles in any guard's sight ray on this turn. */
  sightKeys: Set<number>
}

/** All guard tiles and sight tiles for a given turn. */
export function dangerAt(puzzle: Puzzle, turn: number, walls: Set<number>): DangerField {
  const guardKeys = new Set<number>()
  const sightKeys = new Set<number>()
  for (const g of puzzle.guards) {
    guardKeys.add(posKey(guardPos(g, turn)))
    for (const t of sightTiles(g, turn, walls, puzzle.size)) sightKeys.add(posKey(t))
  }
  return { guardKeys, sightKeys }
}
