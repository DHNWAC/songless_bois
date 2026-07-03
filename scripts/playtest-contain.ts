// Engine smoke test:
//   npx tsx scripts/playtest-contain.ts
//
// 1. Replays each puzzle's solver solution through the real game engine and
//    asserts a win in exactly minRocks with every fish alive.
// 2. Forces a loss (useless rock placements) and asserts the game ends.

import { createGameState } from '../src/lib/contain/board'
import { applyPlayerMove } from '../src/lib/contain/game'
import { PUZZLES } from '../src/lib/contain/puzzles'
import { solve } from '../src/lib/contain/solver'

let failures = 0

for (const puzzle of PUZZLES) {
  const result = solve(puzzle, 10, false)
  let state = createGameState(puzzle)
  for (const move of result.solution) {
    state = applyPlayerMove(state, move)
  }
  const ok = state.status === 'won' && state.playerRocks.length === result.minRocks
  const fishSaved = state.fish.length === puzzle.fish.length
  if (!ok || !fishSaved) {
    failures++
    console.log(
      `#${puzzle.id} FAIL: status=${state.status} rocks=${state.playerRocks.length} fish=${state.fish.length}/${puzzle.fish.length}`,
    )
  } else {
    console.log(`#${puzzle.id} win in ${state.playerRocks.length} rocks, all fish saved ✓`)
  }
}

// Loss path: waste turns on far-corner rocks until the shark gets out or eats.
{
  let state = createGameState(PUZZLES[9]) // Deep End — sparse walls
  const useless = [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 7, col: 7 }, { row: 7, col: 6 },
    { row: 0, col: 7 }, { row: 7, col: 0 }, { row: 1, col: 7 }, { row: 6, col: 7 },
    { row: 1, col: 0 }, { row: 6, col: 0 },
  ]
  for (const move of useless) {
    if (state.status !== 'playing') break
    state = applyPlayerMove(state, move)
  }
  if (state.status === 'escaped' || state.status === 'ate-fish') {
    console.log(`loss path works: ${state.status} ✓`)
  } else {
    failures++
    console.log(`LOSS PATH FAIL: status=${state.status} shark=(${state.sharkPos.row},${state.sharkPos.col})`)
  }
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed')
process.exit(failures ? 1 : 0)
