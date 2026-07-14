// Shared types for OMERDLE.

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Puzzle {
  id: number
  /** Lowercase 4-letter start word, solver-verified to reach OMER. */
  startWord: string
  /** Minimum steps to reach OMER — computed by npm run solve:omerdle. */
  optimalSteps: number
  difficulty: Difficulty
}

export type GameStatus = 'playing' | 'won'

export interface GameState {
  puzzle: Puzzle
  /** Ladder so far, chain[0] === puzzle.startWord. Steps used = chain.length - 1. */
  chain: string[]
  status: GameStatus
}
