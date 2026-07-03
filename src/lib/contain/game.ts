// Turn resolution and win/loss detection.
//
// A turn is: player places one rock → shark moves one tile → re-check state.
//
// WIN   — the shark can reach no fish and no edge tile (fully contained).
// LOSS  — the shark moves onto a fish tile ('ate-fish'), or steps off the
//         grid from an edge tile ('escaped'). Standing on an edge tile is
//         only a warning; the loss is the off-grid step itself.
//
// Rocks are unlimited: the game is a race. The score is how few rocks the
// player needed, rated against the puzzle's optimalRockCount.

import { canPlaceRock, samePos } from './board'
import { getSharkNextMove } from './shark'
import type { GameState, GameStatus, Position } from './types'

/** Current status of a board without advancing it (used on load/restart). */
export function checkGameState(state: GameState): GameStatus {
  if (state.status !== 'playing') return state.status
  const plan = getSharkNextMove(state)
  return plan.target === null ? 'won' : 'playing'
}

/**
 * Resolve one full turn. Pure — returns a new state, never mutates.
 * Returns the input state unchanged if the placement is invalid.
 */
export function applyPlayerMove(state: GameState, rockPos: Position): GameState {
  if (!canPlaceRock(state, rockPos)) return state

  const withRock: GameState = {
    ...state,
    rocks: [...state.rocks, rockPos],
    playerRocks: [...state.playerRocks, rockPos],
  }

  // Shark reacts to the new rock.
  const plan = getSharkNextMove(withRock)

  // Contained before it can move — the rock just placed sealed it in.
  if (plan.target === null || plan.next === null) {
    return { ...withRock, status: 'won' }
  }

  // Escape step: off the grid, game over.
  if (plan.offGrid) {
    return { ...withRock, status: 'escaped' }
  }

  const nextPos = plan.next
  const eaten = withRock.fish.find((f) => samePos(f, nextPos))
  if (eaten) {
    return {
      ...withRock,
      sharkPos: nextPos,
      fish: withRock.fish.filter((f) => f !== eaten),
      status: 'ate-fish',
    }
  }

  const moved: GameState = { ...withRock, sharkPos: nextPos }

  // The shark may have swum into a pocket the player already sealed.
  return { ...moved, status: checkGameState(moved) }
}
