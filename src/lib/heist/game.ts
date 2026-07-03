// Turn resolution. A turn is: player steps (or waits) → guards advance one
// step along their loops → check outcome.
//
// WIN     — standing on the start tile while holding the loot.
// SPOTTED — after guards advance, the player is in a sight ray.
// CAUGHT  — after guards advance, a guard stands on the player.
//
// A tile currently occupied by a guard cannot be entered — the move is
// rejected as illegal, not punished as a loss (mis-taps are forgiven; only
// the guards' own movement and vision kill you).
//
// The core `step` function is shared verbatim by the UI (via applyMove) and
// the solver, so the optimal turn counts are exact by construction.

import { DIRECTION_DELTAS, inBounds, posKey, samePos, wallSet } from './board'
import { dangerAt, guardPos } from './guards'
import type { GameState, GameStatus, Move, Position, Puzzle } from './types'

export interface StepResult {
  playerPos: Position
  turn: number
  hasLoot: boolean
  status: GameStatus
}

/** Resolve one turn from raw state. Returns null if the move is illegal. */
export function step(
  puzzle: Puzzle,
  playerPos: Position,
  turn: number,
  hasLoot: boolean,
  move: Move,
  walls: Set<number>,
): StepResult | null {
  let next = playerPos
  if (move !== 'wait') {
    const d = DIRECTION_DELTAS[move]
    next = { row: playerPos.row + d.row, col: playerPos.col + d.col }
    if (!inBounds(next, puzzle.size) || walls.has(posKey(next))) return null
    if (puzzle.guards.some((g) => samePos(guardPos(g, turn), next))) return null
  }

  const t2 = turn + 1
  const loot = hasLoot || samePos(next, puzzle.vault)
  const danger = dangerAt(puzzle, t2, walls)
  const k = posKey(next)

  let status: GameStatus = 'playing'
  if (danger.guardKeys.has(k)) status = 'caught'
  else if (danger.sightKeys.has(k)) status = 'spotted'
  else if (loot && samePos(next, puzzle.start)) status = 'won'

  return { playerPos: next, turn: t2, hasLoot: loot, status }
}

/** UI wrapper. Pure — returns the input state unchanged if the move is illegal. */
export function applyMove(state: GameState, move: Move): GameState {
  if (state.status !== 'playing') return state
  const result = step(
    state.puzzle,
    state.playerPos,
    state.turn,
    state.hasLoot,
    move,
    wallSet(state.puzzle),
  )
  if (!result) return state
  return { ...state, ...result }
}
