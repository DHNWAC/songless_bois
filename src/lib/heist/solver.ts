// Exact minimum-turn solver. Guards are periodic with period LCM(loop
// lengths), so the state space (position × turn mod period × hasLoot) is
// finite and a plain BFS gives the true optimum. Runs the SAME `step`
// function as the game — the stored optimalTurns are exact by construction.
//
//   npm run solve:heist            → solve every puzzle
//   npm run solve:heist -- 3       → solve puzzle id 3

import { posKey, wallSet } from './board'
import { step } from './game'
import type { Move, Position, Puzzle } from './types'

const MOVES: Move[] = ['up', 'right', 'down', 'left', 'wait']

export interface SolveResult {
  puzzleId: number
  solvable: boolean
  minTurns: number
  solution: Move[]
  statesSearched: number
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function guardPeriod(puzzle: Puzzle): number {
  return puzzle.guards.reduce((acc, g) => (acc * g.loop.length) / gcd(acc, g.loop.length), 1)
}

interface Node {
  pos: Position
  turn: number
  hasLoot: boolean
  parent: Node | null
  move: Move | null
}

export function solve(puzzle: Puzzle): SolveResult {
  const walls = wallSet(puzzle)
  const period = guardPeriod(puzzle)
  const key = (pos: Position, turn: number, loot: boolean) =>
    `${posKey(pos)}|${turn % period}|${loot ? 1 : 0}`

  const start: Node = { pos: puzzle.start, turn: 0, hasLoot: false, parent: null, move: null }
  const seen = new Set<string>([key(start.pos, 0, false)])
  const queue: Node[] = [start]
  let states = 0

  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]
    states++
    for (const move of MOVES) {
      const r = step(puzzle, cur.pos, cur.turn, cur.hasLoot, move, walls)
      if (!r || r.status === 'caught' || r.status === 'spotted') continue
      if (r.status === 'won') {
        const solution: Move[] = [move]
        for (let n = cur; n.move; n = n.parent!) solution.unshift(n.move)
        return { puzzleId: puzzle.id, solvable: true, minTurns: r.turn, solution, statesSearched: states }
      }
      const k = key(r.playerPos, r.turn, r.hasLoot)
      if (seen.has(k)) continue
      seen.add(k)
      queue.push({ pos: r.playerPos, turn: r.turn, hasLoot: r.hasLoot, parent: cur, move })
    }
  }
  return { puzzleId: puzzle.id, solvable: false, minTurns: -1, solution: [], statesSearched: states }
}
