# OMERDLE — Design

A reverse word-ladder game for the Jimsengdle platform.

## Concept

The answer is always **OMER** and is visible from the start. Each day the player
gets a random 4-letter start word and must transform it into OMER by changing
exactly one letter per step. Every intermediate word must be a real dictionary
word. Steps are unlimited; score is steps used vs. the precomputed optimal.

## Rules

- Fixed answer: OMER (a real word — unit of measure; special-cased into the
  word graph if the source list lacks it).
- One letter changed per step; word length always 4.
- Every rung must be in the dictionary. Invalid guesses are rejected, not
  penalised.
- Unlimited steps. Undo removes the last rung (free while playing).
- Win when the chain reaches OMER.

## Puzzles

- 6 pre-authored start words in `src/lib/omerdle/puzzles.ts`, each
  solver-verified to have a ladder path to OMER, with `optimalSteps` computed
  by `scripts/solve-omerdle.ts` (npm run solve:omerdle).
- Daily rotation by day number modulo 6, same as Heist
  (`getDailyPuzzle(dayNumber)`).

## Word list

- Standard English word list (dev dependency), filtered to 4-letter words and
  baked into `src/lib/omerdle/words.ts` as a `Set<string>` — no runtime
  dependency. Used for guess validation and by the solver.

## Architecture (mirrors Heist)

- `src/lib/omerdle/types.ts` — Puzzle { id, startWord, optimalSteps,
  difficulty }, GameState { puzzle, chain: string[], status: 'playing' | 'won' }.
- `src/lib/omerdle/game.ts` — pure `submitGuess(state, guess)`: validates
  length, dictionary membership, exactly-one-letter diff from the last rung;
  returns unchanged state if invalid; sets status 'won' on OMER.
- `src/lib/omerdle/storage.ts` — Heist-style localStorage progress:
  attempts, firstScore/bestScore per puzzle, daily streak.
- `src/components/omerdle/` — board (chain of Wordle-style tile rows, start
  word pinned top, OMER pinned bottom), ShareResult, PuzzleSelector.
- `src/app/omerdle/page.tsx` — typed input submitted on Enter, inline error
  on invalid guess, Undo, Restart.
- Landing page: replaces one "???" placeholder card.

## Scoring / share

Steps used vs. optimal, attempts, best score, daily streak. ShareResult card
on win ("OMERDLE #N — solved in X steps, optimal Y").
