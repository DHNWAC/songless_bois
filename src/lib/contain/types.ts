// Shared types for the Contain game.

export interface Position {
  row: number
  col: number
}

export type TileType = 'water' | 'rock' | 'shark' | 'fish'

export type Direction = 'up' | 'right' | 'down' | 'left'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Puzzle {
  id: number
  title: string
  size: number
  sharkStart: Position
  fish: Position[]
  rocks: Position[]
  /** Minimum rocks needed to win — computed by the CLI solver (npm run solve). */
  optimalRockCount: number
  /** One known optimal placement sequence (never shown to players). */
  optimalSolution?: Position[]
  difficulty: Difficulty
}

export type GameStatus = 'playing' | 'won' | 'ate-fish' | 'escaped'

export interface GameState {
  puzzle: Puzzle
  /** All rocks currently on the board (starting rocks + player rocks). */
  rocks: Position[]
  /** Rocks the player has placed this attempt. */
  playerRocks: Position[]
  sharkPos: Position
  /** Fish still alive (a fish dies only on the losing move). */
  fish: Position[]
  status: GameStatus
}

export type Rating = 'Perfect' | 'Sharp' | 'Safe' | 'Messy'
