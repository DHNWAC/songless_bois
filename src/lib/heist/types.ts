// Shared types for the Heist game.

export interface Position {
  row: number
  col: number
}

export type Direction = 'up' | 'right' | 'down' | 'left'

/** One player action per turn: step one tile or stay put. */
export type Move = Direction | 'wait'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Guard {
  /**
   * Patrol cycle — the guard stands on loop[turn % loop.length].
   * Consecutive tiles must be identical (a pause) or one step apart.
   * Author ping-pong routes as [a, b, c, b] so the cycle wraps cleanly.
   */
  loop: Position[]
  /** Facing for single-tile loops (sentries). Moving guards face their travel direction. */
  facing?: Direction
}

export interface Puzzle {
  id: number
  title: string
  size: number
  walls: Position[]
  /** Entrance AND exit — the getaway tile. */
  start: Position
  vault: Position
  guards: Guard[]
  /** Minimum turns to win — computed by the CLI solver (npm run solve:heist). */
  optimalTurns: number
  difficulty: Difficulty
}

export type GameStatus = 'playing' | 'won' | 'spotted' | 'caught'

export interface GameState {
  puzzle: Puzzle
  playerPos: Position
  /** Completed turns; guards stand on loop[turn % length]. */
  turn: number
  hasLoot: boolean
  status: GameStatus
}

export type Rating = 'Perfect' | 'Sharp' | 'Safe' | 'Messy'
