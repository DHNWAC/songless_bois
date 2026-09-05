// Shared types for Draw the Curve.

export interface Point {
  x: number
  y: number
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Puzzle {
  id: string
  prompt: string
  unit: string
  yMin: number
  yMax: number
  xStart: number
  xEnd: number
  series: Point[]
  sourceName: string
  sourceUrl: string
  category?: string
  difficulty?: Difficulty
}

/** Per-data-point magnitude comparison. */
export interface Residual {
  x: number
  realY: number
  guessY: number
  /** guessY - realY, in the puzzle's own units (signed). */
  delta: number
  /** |delta| / (yMax - yMin), a 0-1 error. */
  normError: number
}

/** Per-interval shape comparison, between consecutive real data points. */
export interface SegmentMatch {
  x0: number
  x1: number
  realSlope: number
  guessSlope: number
  realDir: -1 | 0 | 1
  guessDir: -1 | 0 | 1
  /** How much this segment counts toward the shape score (0-1, relative). */
  weight: number
  /** 1 = same direction, 0.5 = one flat one not, 0 = opposed. */
  credit: number
}

export interface ScoreBreakdown {
  total: number
  magnitude: number
  shape: number
  residuals: Residual[]
  segments: SegmentMatch[]
  meanNormError: number
  verdict: string
  /** Which third of the curve was worst, for the verdict + highlight. */
  worstThird: 'start' | 'middle' | 'end'
}
