// Minimum-rock solver — the same engine the game runs on (game.ts/shark.ts),
// searched with iterative-deepening DFS. Public and CLI-runnable:
//
//   npm run solve            → solve every puzzle
//   npm run solve -- 3       → solve puzzle id 3
//   npm run solve -- 3 wide  → exhaustive candidates (slow, double-check)
//
// Search notes:
//  * Iterative deepening: try 0 rocks, then 1, then 2… the first depth with
//    a winning line is the minimum for the candidate set searched.
//  * Default candidate moves are tiles lying on ANY shortest shark→target
//    path (distFromShark + distToTarget === pathLength) plus the shark's
//    direct neighbors. Off-path rocks don't change the shark's next step,
//    so blocking moves live on the path in almost all positions. 'wide'
//    mode searches every water tile for a guaranteed exact answer.
//  * Memoized on (rocks, sharkPos): a state already searched with equal or
//    more remaining depth cannot yield a new solution.

import { canPlaceRock, createGameState, posKey, rockSet } from './board'
import { applyPlayerMove } from './game'
import { getSharkNextMove } from './shark'
import { distanceField, distAt } from './pathfinding'
import type { GameState, Position, Puzzle } from './types'

export interface SolveResult {
  puzzleId: number
  solvable: boolean
  minRocks: number
  solution: Position[]
  nodesSearched: number
}

function stateKey(state: GameState): string {
  const rocks = state.rocks.map(posKey).sort((a, b) => a - b).join(',')
  return `${rocks}|${posKey(state.sharkPos)}`
}

/** Candidate rock placements for the current position. */
function candidates(state: GameState, wide: boolean): Position[] {
  const size = state.puzzle.size
  const out: Position[] = []
  const seen = new Set<number>()
  const push = (p: Position) => {
    const k = posKey(p)
    if (!seen.has(k) && canPlaceRock(state, p)) {
      seen.add(k)
      out.push(p)
    }
  }

  if (wide) {
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++) push({ row, col })
    return out
  }

  const plan = getSharkNextMove(state)
  if (plan.target === null) return []

  // Tiles on any tied shortest path: dist(shark→t) + dist(t→targets) = total.
  const rocks = rockSet(state.rocks)
  const fromShark = distanceField([state.sharkPos], rocks, size)
  const pathEnd = plan.path[plan.path.length - 1]
  const toTargets = distanceField(
    plan.target === 'fish'
      ? state.fish.filter((f) => distAt(fromShark, f, size) >= 0)
      : [pathEnd],
    rocks,
    size,
  )
  const total = plan.path.length - 1
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const p = { row, col }
      const a = distAt(fromShark, p, size)
      const b = distAt(toTargets, p, size)
      if (a > 0 && b >= 0 && a + b === total) push(p)
    }
  }
  // Always consider sealing right next to the shark.
  for (const p of plan.path.slice(1)) push(p)
  return out
}

function dfs(
  state: GameState,
  remaining: number,
  wide: boolean,
  memo: Map<string, number>,
  line: Position[],
  counter: { nodes: number },
): Position[] | null {
  counter.nodes++
  if (state.status === 'won') return [...line]
  if (state.status !== 'playing' || remaining === 0) return null

  const key = stateKey(state)
  const seenDepth = memo.get(key)
  if (seenDepth !== undefined && seenDepth >= remaining) return null
  memo.set(key, remaining)

  for (const move of candidates(state, wide)) {
    const next = applyPlayerMove(state, move)
    if (next === state) continue
    line.push(move)
    const solved = dfs(next, remaining - 1, wide, memo, line, counter)
    line.pop()
    if (solved) return solved
  }
  return null
}

export function solve(puzzle: Puzzle, maxDepth = 10, wide = false): SolveResult {
  const start = createGameState(puzzle)
  const counter = { nodes: 0 }

  // Already contained with zero rocks? (authoring mistake, but handle it)
  if (getSharkNextMove(start).target === null) {
    return { puzzleId: puzzle.id, solvable: true, minRocks: 0, solution: [], nodesSearched: 1 }
  }

  for (let depth = 1; depth <= maxDepth; depth++) {
    const memo = new Map<string, number>()
    const solution = dfs(start, depth, wide, memo, [], counter)
    if (solution) {
      return {
        puzzleId: puzzle.id,
        solvable: true,
        minRocks: solution.length,
        solution,
        nodesSearched: counter.nodes,
      }
    }
  }
  return { puzzleId: puzzle.id, solvable: false, minRocks: -1, solution: [], nodesSearched: counter.nodes }
}
