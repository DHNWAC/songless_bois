// Public CLI solver for Heist puzzles.
//
//   npm run solve:heist          solve all puzzles
//   npm run solve:heist -- 3     solve puzzle id 3 only
//
// Validates puzzle authoring (loops walkable and contiguous, start safe at
// turn 0), prints the exact minimum turn count and one optimal move line,
// and flags any mismatch with the stored optimalTurns.

import { inBounds, posKey, samePos, wallSet } from '../src/lib/heist/board'
import { dangerAt } from '../src/lib/heist/guards'
import { PUZZLES } from '../src/lib/heist/puzzles'
import { solve } from '../src/lib/heist/solver'
import type { Puzzle } from '../src/lib/heist/types'

const ARROWS: Record<string, string> = { up: '↑', right: '→', down: '↓', left: '←', wait: '·' }

function validate(puzzle: Puzzle): string[] {
  const errors: string[] = []
  const walls = wallSet(puzzle)
  if (samePos(puzzle.start, puzzle.vault)) errors.push('start equals vault')
  for (const p of [puzzle.start, puzzle.vault]) {
    if (!inBounds(p, puzzle.size) || walls.has(posKey(p))) errors.push(`bad tile (${p.row},${p.col})`)
  }
  puzzle.guards.forEach((g, gi) => {
    g.loop.forEach((t, i) => {
      if (!inBounds(t, puzzle.size)) errors.push(`guard ${gi} loop tile ${i} out of bounds`)
      if (walls.has(posKey(t))) errors.push(`guard ${gi} loop tile ${i} on a wall`)
      const next = g.loop[(i + 1) % g.loop.length]
      const dist = Math.abs(next.row - t.row) + Math.abs(next.col - t.col)
      if (dist > 1) errors.push(`guard ${gi} loop breaks between tiles ${i} and ${i + 1}`)
    })
  })
  const t0 = dangerAt(puzzle, 0, walls)
  const k = posKey(puzzle.start)
  if (t0.guardKeys.has(k)) errors.push('a guard starts on the start tile')
  if (t0.sightKeys.has(k)) errors.push('start tile is in sight at turn 0')
  return errors
}

function run(puzzle: Puzzle): boolean {
  const errors = validate(puzzle)
  if (errors.length) {
    console.log(`#${puzzle.id} ${puzzle.title}: INVALID — ${errors.join('; ')}`)
    return false
  }

  const started = Date.now()
  const result = solve(puzzle)
  const ms = Date.now() - started

  if (!result.solvable) {
    console.log(`#${puzzle.id} ${puzzle.title}: UNSOLVABLE  (${result.statesSearched} states, ${ms}ms)`)
    return false
  }

  const bad = result.minTurns !== puzzle.optimalTurns
  console.log(
    `#${puzzle.id} ${puzzle.title} [${puzzle.difficulty}]: min ${result.minTurns} turns ` +
      `(stored ${puzzle.optimalTurns}${bad ? ' ✗ MISMATCH' : ' ✓'})  ` +
      `line: ${result.solution.map((m) => ARROWS[m]).join('')}  ` +
      `(${result.statesSearched} states, ${ms}ms)`,
  )
  return !bad
}

const [, , idArg] = process.argv
const targets = idArg && idArg !== 'all' ? PUZZLES.filter((p) => p.id === Number(idArg)) : PUZZLES

if (targets.length === 0) {
  console.error(`No puzzle with id ${idArg}`)
  process.exit(1)
}

let allMatch = true
for (const puzzle of targets) {
  if (!run(puzzle)) allMatch = false
}
process.exit(allMatch ? 0 : 1)
