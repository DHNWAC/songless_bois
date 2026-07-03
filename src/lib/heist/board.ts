// Board helpers — same conventions as src/lib/contain/board.ts.

import type { Direction, GameState, Position, Puzzle } from './types'

export const DIRECTION_DELTAS: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
}

export function posKey(p: Position): number {
  return p.row * 256 + p.col
}

export function samePos(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col
}

export function inBounds(p: Position, size: number): boolean {
  return p.row >= 0 && p.row < size && p.col >= 0 && p.col < size
}

export function wallSet(puzzle: Puzzle): Set<number> {
  return new Set(puzzle.walls.map(posKey))
}

export function createGameState(puzzle: Puzzle): GameState {
  return {
    puzzle,
    playerPos: { ...puzzle.start },
    turn: 0,
    hasLoot: false,
    status: 'playing',
  }
}
