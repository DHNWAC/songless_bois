// Public CLI solver for OMERDLE puzzles.
//
//   npm run solve:omerdle          verify all puzzles
//   npm run solve:omerdle -- 3     verify puzzle id 3 only
//
// BFS from OMER over the one-letter-diff graph of 4-letter words. Prints the
// exact minimum step count and one optimal ladder for each start word, and
// flags any mismatch with the stored optimalSteps.

import { ANSWER, WORD_LENGTH } from '../src/lib/omerdle/game'
import { PUZZLES } from '../src/lib/omerdle/puzzles'
import { WORDS, WORD_SET } from '../src/lib/omerdle/words'

/** BFS from ANSWER: distance and parent (toward OMER) for every reachable word. */
function bfs(): Map<string, { dist: number; next: string | null }> {
  const seen = new Map<string, { dist: number; next: string | null }>()
  seen.set(ANSWER, { dist: 0, next: null })
  let frontier = [ANSWER]
  while (frontier.length) {
    const nextFrontier: string[] = []
    for (const word of frontier) {
      const d = seen.get(word)!.dist
      for (let i = 0; i < WORD_LENGTH; i++) {
        for (let c = 97; c < 123; c++) {
          const n = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1)
          if (n === word || !WORD_SET.has(n) || seen.has(n)) continue
          seen.set(n, { dist: d + 1, next: word })
          nextFrontier.push(n)
        }
      }
    }
    frontier = nextFrontier
  }
  return seen
}

function ladder(seen: ReturnType<typeof bfs>, from: string): string[] {
  const out = [from]
  let cur = seen.get(from)?.next ?? null
  while (cur) {
    out.push(cur)
    cur = seen.get(cur)?.next ?? null
  }
  return out
}

const seen = bfs()
console.log(`Graph: ${seen.size} of ${WORDS.length} four-letter words reach ${ANSWER.toUpperCase()}\n`)

const [, , idArg] = process.argv
const targets = idArg && idArg !== 'all' ? PUZZLES.filter((p) => p.id === Number(idArg)) : PUZZLES

if (targets.length === 0) {
  console.error(`No puzzle with id ${idArg}`)
  process.exit(1)
}

let allMatch = true
for (const p of targets) {
  const entry = seen.get(p.startWord)
  if (!entry) {
    console.log(`#${p.id} ${p.startWord.toUpperCase()}: UNSOLVABLE — no path to ${ANSWER.toUpperCase()}`)
    allMatch = false
    continue
  }
  const bad = entry.dist !== p.optimalSteps
  console.log(
    `#${p.id} ${p.startWord.toUpperCase()} [${p.difficulty}]: min ${entry.dist} steps ` +
      `(stored ${p.optimalSteps}${bad ? ' ✗ MISMATCH' : ' ✓'})  ` +
      `ladder: ${ladder(seen, p.startWord).join(' → ')}`,
  )
  if (bad) allMatch = false
}
process.exit(allMatch ? 0 : 1)
