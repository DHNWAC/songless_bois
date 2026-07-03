// Public CLI solver for Contain puzzles.
//
//   npm run solve            solve all puzzles
//   npm run solve -- 3       solve puzzle id 3 only
//   npm run solve -- 3 wide  exhaustive candidate search (slow, exact)
//   npm run solve -- all wide
//
// Prints the minimum rock count and one optimal placement sequence per
// puzzle, and flags any mismatch with the stored optimalRockCount.

import { PUZZLES } from '../src/lib/contain/puzzles'
import { solve } from '../src/lib/contain/solver'
import type { Position, Puzzle } from '../src/lib/contain/types'

const fmt = (p: Position) => `(${p.row},${p.col})`

function run(puzzle: Puzzle, wide: boolean): boolean {
  const started = Date.now()
  const result = solve(puzzle, 10, wide)
  const ms = Date.now() - started

  if (!result.solvable) {
    console.log(`#${puzzle.id} ${puzzle.title}: UNSOLVABLE within 10 rocks  (${result.nodesSearched} nodes, ${ms}ms)`)
    return false
  }

  // Path-restricted (default) search is an upper bound; only 'wide' is exact.
  // Stored counts come from wide mode, so default results may sit above them.
  const exact = wide
  const bad = exact ? result.minRocks !== puzzle.optimalRockCount : result.minRocks < puzzle.optimalRockCount
  const note = bad
    ? ' ✗ MISMATCH'
    : !exact && result.minRocks > puzzle.optimalRockCount
      ? ` ✓ (wide-mode optimum; run "npm run solve -- ${puzzle.id} wide" to reproduce)`
      : ' ✓'
  console.log(
    `#${puzzle.id} ${puzzle.title} [${puzzle.difficulty}]: ${exact ? 'min' : 'best found'} ${result.minRocks} rocks ` +
      `(stored ${puzzle.optimalRockCount}${note})  ` +
      `solution: ${result.solution.map(fmt).join(' ')}  ` +
      `(${result.nodesSearched} nodes, ${ms}ms)`,
  )
  return !bad
}

const [, , idArg, modeArg] = process.argv
const wide = modeArg === 'wide' || idArg === 'wide'
const targets =
  idArg && idArg !== 'all' && idArg !== 'wide'
    ? PUZZLES.filter((p) => p.id === Number(idArg))
    : PUZZLES

if (targets.length === 0) {
  console.error(`No puzzle with id ${idArg}`)
  process.exit(1)
}

let allMatch = true
for (const puzzle of targets) {
  if (!run(puzzle, wide)) allMatch = false
}
process.exit(allMatch ? 0 : 1)
