// Shark AI. Fully deterministic:
//
//  1. BFS from the shark to find the distance to every reachable fish and
//     every reachable edge tile (rocks block movement).
//  2. The target is whichever is closer — the nearest fish or the nearest
//     edge tile. On a distance tie, fish wins (hungry > free).
//  3. The shark steps one tile along a shortest path to the target set.
//     When several shortest paths exist, the FIRST step is chosen in the
//     fixed order up, right, down, left (DIRECTION_ORDER) — this is the
//     only tie-break and makes every game replayable.
//  4. A shark standing ON an edge tile whose chosen target is the edge
//     (distance 0) steps off the grid — that step is the escape/loss.

import {
  DIRECTION_DELTAS,
  DIRECTION_ORDER,
  inBounds,
  neighbors,
  posKey,
  rockSet,
} from './board'
import { distanceField, distAt, edgeTiles, tracePath } from './pathfinding'
import type { GameState, Position } from './types'

export interface SharkPlan {
  /** null → shark is fully contained (no reachable fish, no reachable edge). */
  target: 'fish' | 'edge' | null
  /** Next tile; null when contained. `offGrid: true` means the escape step. */
  next: Position | null
  offGrid: boolean
  /** Intended path (shark tile → target tile) for the hint overlay. */
  path: Position[]
  /** Fish currently reachable by the shark (for danger highlighting). */
  reachableFish: Position[]
  /** True while the shark stands on an edge tile with the edge as target. */
  aboutToEscape: boolean
}

/**
 * Decide the shark's next move for the current board. Pure — no mutation.
 */
export function getSharkNextMove(state: GameState): SharkPlan {
  const size = state.puzzle.size
  const rocks = rockSet(state.rocks)
  const { sharkPos, fish } = state

  // Step 1: single BFS from the shark gives the distance to everything.
  const fromShark = distanceField([sharkPos], rocks, size)

  const reachableFish = fish.filter((f) => distAt(fromShark, f, size) >= 0)
  const fishDist = reachableFish.length
    ? Math.min(...reachableFish.map((f) => distAt(fromShark, f, size)))
    : -1

  const reachableEdges = edgeTiles(size).filter(
    (e) => !rocks.has(posKey(e)) && distAt(fromShark, e, size) >= 0,
  )
  const edgeDist = reachableEdges.length
    ? Math.min(...reachableEdges.map((e) => distAt(fromShark, e, size)))
    : -1

  // Contained: nothing reachable — the player has won.
  if (fishDist < 0 && edgeDist < 0) {
    return { target: null, next: null, offGrid: false, path: [], reachableFish, aboutToEscape: false }
  }

  // Step 2: pick the target set. Fish wins ties.
  const preferFish = fishDist >= 0 && (edgeDist < 0 || fishDist <= edgeDist)
  const targetDist = preferFish ? fishDist : edgeDist
  const targets = preferFish
    ? reachableFish.filter((f) => distAt(fromShark, f, size) === fishDist)
    : reachableEdges.filter((e) => distAt(fromShark, e, size) === edgeDist)

  // Step 4: already on the target edge tile → escape off-grid.
  if (!preferFish && targetDist === 0) {
    for (const dir of DIRECTION_ORDER) {
      const d = DIRECTION_DELTAS[dir]
      const out = { row: sharkPos.row + d.row, col: sharkPos.col + d.col }
      if (!inBounds(out, size)) {
        return {
          target: 'edge',
          next: out,
          offGrid: true,
          path: [sharkPos],
          reachableFish,
          aboutToEscape: true,
        }
      }
    }
  }

  // Step 3: multi-source BFS from the tied targets, then take the first
  // neighbor (in tie-break order) that strictly decreases the distance.
  const toTargets = distanceField(targets, rocks, size)
  const myDist = distAt(toTargets, sharkPos, size)
  let next: Position | null = null
  for (const n of neighbors(sharkPos, size)) {
    if (rocks.has(posKey(n))) continue
    if (distAt(toTargets, n, size) === myDist - 1) {
      next = n
      break
    }
  }

  const path = tracePath(sharkPos, toTargets, rocks, size) ?? [sharkPos]
  const aboutToEscape =
    !preferFish && targetDist <= 1 && edgeDist >= 0 // on or beside the escape edge

  return {
    target: preferFish ? 'fish' : 'edge',
    next,
    offGrid: false,
    path,
    reachableFish,
    aboutToEscape,
  }
}
