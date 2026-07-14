// Core rules. A step is: type a real 4-letter word differing from the last
// rung by exactly one letter. Reaching OMER wins. Steps are unlimited;
// invalid guesses are rejected with a reason, never penalised.

import type { GameState, Puzzle } from './types'
import { WORD_SET } from './words'

export const ANSWER = 'omer'
export const WORD_LENGTH = 4

export function createGameState(puzzle: Puzzle): GameState {
  return { puzzle, chain: [puzzle.startWord], status: 'playing' }
}

export function oneLetterDiff(a: string, b: string): boolean {
  let diff = 0
  for (let i = 0; i < WORD_LENGTH; i++) if (a[i] !== b[i]) diff++
  return diff === 1
}

/** Human-readable rejection reason, or null if the guess is legal. */
export function validateGuess(state: GameState, guess: string): string | null {
  const word = guess.toLowerCase()
  const last = state.chain[state.chain.length - 1]
  if (word.length !== WORD_LENGTH) return 'Word must be 4 letters'
  if (!oneLetterDiff(last, word)) return `Change exactly one letter of ${last.toUpperCase()}`
  if (state.chain.includes(word)) return 'Already used in this ladder'
  if (word !== ANSWER && !WORD_SET.has(word)) return 'Not in the word list'
  return null
}

/** Pure — returns the input state unchanged if the guess is invalid. */
export function submitGuess(state: GameState, guess: string): GameState {
  if (state.status !== 'playing') return state
  const word = guess.toLowerCase()
  if (validateGuess(state, word) !== null) return state
  return {
    ...state,
    chain: [...state.chain, word],
    status: word === ANSWER ? 'won' : 'playing',
  }
}

/** Remove the last rung. Free while playing; a won game must be restarted. */
export function undo(state: GameState): GameState {
  if (state.status !== 'playing' || state.chain.length <= 1) return state
  return { ...state, chain: state.chain.slice(0, -1) }
}

export function stepsUsed(state: GameState): number {
  return state.chain.length - 1
}
