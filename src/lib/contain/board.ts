// Board helpers. A board is represented as a Set of rock keys plus the
// puzzle's fish/shark positions — no 2D array needed for an 8x8 grid.

import type { Direction, GameState, Position, Puzzle } from './types'

/** Deterministic neighbor order — this IS the tie-break order. */
export const DIRECTION_ORDER: Direction[] = ['up', 'right', 'down', 'left']

export const DIRECTION_DELTAS: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
}

export function posKey(p: Position): number {
  // Fits any grid up to 256 wide; fast Set/Map key.
  return p.row * 256 + p.col
}

export function samePos(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col
}

export function inBounds(p: Position, size: number): boolean {
  return p.row >= 0 && p.row < size && p.col >= 0 && p.col < size
}

export function isEdge(p: Position, size: number): boolean {
  return p.row === 0 || p.col === 0 || p.row === size - 1 || p.col === size - 1
}

/** In-bounds neighbors in tie-break order (up, right, down, left). */
export function neighbors(p: Position, size: number): Position[] {
  const out: Position[] = []
  for (const dir of DIRECTION_ORDER) {
    const d = DIRECTION_DELTAS[dir]
    const n = { row: p.row + d.row, col: p.col + d.col }
    if (inBounds(n, size)) out.push(n)
  }
  return out
}

export function rockSet(rocks: Position[]): Set<number> {
  return new Set(rocks.map(posKey))
}

export function createGameState(puzzle: Puzzle): GameState {
  return {
    puzzle,
    rocks: [...puzzle.rocks],
    playerRocks: [],
    sharkPos: { ...puzzle.sharkStart },
    fish: puzzle.fish.map((f) => ({ ...f })),
    status: 'playing',
  }
}

/** True if a rock may be placed here: in-bounds water not occupied by anything. */
export function canPlaceRock(state: GameState, p: Position): boolean {
  if (state.status !== 'playing') return false
  if (!inBounds(p, state.puzzle.size)) return false
  if (samePos(p, state.sharkPos)) return false
  if (state.fish.some((f) => samePos(f, p))) return false
  if (rockSet(state.rocks).has(posKey(p))) return false
  return true
}
