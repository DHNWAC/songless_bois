// Scoring engine for Draw the Curve.
//
// Deliberately NOT plain average-distance: that over-rewards a flat, hedged
// line through the middle of the range. The score blends two independent,
// equally-weighted components — see scoreDrawing() below.

import type { Point, Puzzle, Residual, SegmentMatch, ScoreBreakdown } from './types'

/**
 * Sample the drawn polyline at an arbitrary x by linear interpolation.
 * The line is a function of x, so we can binary-search the x-ordered points.
 */
export function sampleAt(line: Point[], x: number): number {
  if (line.length === 0) return NaN
  if (x <= line[0].x) return line[0].y
  if (x >= line[line.length - 1].x) return line[line.length - 1].y

  let lo = 0
  let hi = line.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (line[mid].x <= x) lo = mid
    else hi = mid
  }
  const a = line[lo]
  const b = line[hi]
  const span = b.x - a.x
  if (span === 0) return a.y
  return a.y + ((x - a.x) / span) * (b.y - a.y)
}

/**
 * A slope reads as "flat" when it moves less than this fraction of the y-range
 * across the segment. Keeps wobble in a sketch from registering as a trend.
 */
const FLAT_THRESHOLD = 0.03

function direction(deltaY: number, yRange: number): -1 | 0 | 1 {
  const rel = deltaY / yRange
  if (rel > FLAT_THRESHOLD) return 1
  if (rel < -FLAT_THRESHOLD) return -1
  return 0
}

/**
 * Magnitude component: mean normalised distance at each real data point,
 * inverted to 0-1. The exponent softens the curve so that being 10% off still
 * scores meaningfully better than being 30% off.
 */
function magnitudeScore(meanNormError: number): number {
  return Math.max(0, 1 - Math.pow(meanNormError * 2.4, 1.35))
}

export function scoreDrawing(puzzle: Puzzle, drawn: Point[]): ScoreBreakdown {
  const yRange = puzzle.yMax - puzzle.yMin
  const series = puzzle.series

  // --- Magnitude: compare at every real data point -------------------------
  const residuals: Residual[] = series.map((p) => {
    const guessY = sampleAt(drawn, p.x)
    const delta = guessY - p.y
    return { x: p.x, realY: p.y, guessY, delta, normError: Math.abs(delta) / yRange }
  })

  const meanNormError =
    residuals.reduce((sum, r) => sum + r.normError, 0) / Math.max(1, residuals.length)
  const magnitude = magnitudeScore(meanNormError)

  // --- Shape: compare direction of change over each real interval ----------
  const rawSegments = series.slice(0, -1).map((p, i) => {
    const q = series[i + 1]
    const realDelta = q.y - p.y
    const guessDelta = sampleAt(drawn, q.x) - sampleAt(drawn, p.x)
    const dx = q.x - p.x || 1

    const realDir = direction(realDelta, yRange)
    const guessDir = direction(guessDelta, yRange)

    // Full credit for a matching direction, half for a near-miss involving a
    // flat call, none for getting the sign backwards.
    let credit: number
    if (realDir === guessDir) credit = 1
    else if (realDir === 0 || guessDir === 0) credit = 0.5
    else credit = 0

    // Steep real segments matter more: one that moves 40% of the axis is a
    // genuine feature of the curve, one that moves 1% is noise.
    const steepness = Math.abs(realDelta) / yRange
    return { x0: p.x, x1: q.x, realSlope: realDelta / dx, guessSlope: guessDelta / dx, realDir, guessDir, steepness, credit }
  })

  // Normalise weights. Every segment keeps a floor weight so a long genuinely
  // flat plateau still counts for something.
  const FLOOR = 0.15
  const rawWeights = rawSegments.map((s) => FLOOR + s.steepness)
  const weightSum = rawWeights.reduce((a, b) => a + b, 0) || 1

  const segments: SegmentMatch[] = rawSegments.map((s, i) => ({
    x0: s.x0,
    x1: s.x1,
    realSlope: s.realSlope,
    guessSlope: s.guessSlope,
    realDir: s.realDir,
    guessDir: s.guessDir,
    weight: rawWeights[i] / weightSum,
    credit: s.credit,
  }))

  const shape = segments.reduce((sum, s) => sum + s.weight * s.credit, 0)
  const total = Math.round(100 * (0.5 * magnitude + 0.5 * shape))
  const worstThird = findWorstThird(residuals, segments, puzzle)

  return {
    total,
    magnitude: Math.round(magnitude * 100),
    shape: Math.round(shape * 100),
    residuals,
    segments,
    meanNormError,
    verdict: buildVerdict({ total, magnitude: Math.round(magnitude * 100), shape: Math.round(shape * 100), residuals, segments, worstThird, puzzle }),
    worstThird,
  }
}

/**
 * Split the x-range into thirds and find which the player did worst on,
 * blending magnitude error with shape misses so the verdict points somewhere real.
 */
function findWorstThird(
  residuals: Residual[],
  segments: SegmentMatch[],
  puzzle: Puzzle,
): 'start' | 'middle' | 'end' {
  const span = puzzle.xEnd - puzzle.xStart || 1
  const thirdOf = (x: number): 0 | 1 | 2 => {
    const t = (x - puzzle.xStart) / span
    return t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2
  }

  const err = [0, 0, 0]
  const count = [0, 0, 0]
  for (const r of residuals) {
    const t = thirdOf(r.x)
    err[t] += r.normError
    count[t] += 1
  }
  for (const s of segments) {
    const t = thirdOf((s.x0 + s.x1) / 2)
    err[t] += (1 - s.credit) * 0.6
    count[t] += 0.6
  }

  const avg = err.map((e, i) => (count[i] > 0 ? e / count[i] : 0))
  return (['start', 'middle', 'end'] as const)[avg.indexOf(Math.max(...avg))]
}

interface VerdictInput {
  total: number
  magnitude: number
  shape: number
  residuals: Residual[]
  segments: SegmentMatch[]
  worstThird: 'start' | 'middle' | 'end'
  puzzle: Puzzle
}

const THIRD_LABEL = {
  start: 'the early years',
  middle: 'the middle stretch',
  end: 'the recent end',
} as const

/**
 * Picks the most interesting true thing to say: a shape insight where shape and
 * magnitude diverge, otherwise a magnitude note, always anchored to a specific
 * part of the curve.
 */
function buildVerdict(v: VerdictInput): string {
  const where = THIRD_LABEL[v.worstThird]
  const gap = v.shape - v.magnitude
  const yRange = v.puzzle.yMax - v.puzzle.yMin

  // Systematic bias: did they sit consistently above or below the truth?
  const signedMean = v.residuals.reduce((s, r) => s + r.delta, 0) / Math.max(1, v.residuals.length)
  const bias = signedMean / yRange

  // The steepest real segment they got backwards, if any.
  const flipped = v.segments
    .filter((s) => s.credit === 0)
    .sort((a, b) => Math.abs(b.realSlope) - Math.abs(a.realSlope))[0]

  const opener =
    v.total >= 85 ? 'Excellent read.'
    : v.total >= 70 ? 'Solid read.'
    : v.total >= 50 ? 'Roughly there.'
    : v.total >= 30 ? 'Some of it landed.'
    : 'Not this time.'

  if (flipped) {
    const dir = flipped.realDir === 1 ? 'rising' : 'falling'
    return `${opener} You had the curve going the wrong way around ${Math.round(flipped.x0)}–${Math.round(flipped.x1)} — it was ${dir} there.`
  }
  if (gap > 22 && v.shape >= 70) {
    return `${opener} You read the shape well but sat ${bias > 0 ? 'too high' : 'too low'} throughout — the gap was widest across ${where}.`
  }
  if (v.shape < 55 && v.magnitude < 55) {
    return `${opener} The line stayed too level — the real curve moves a lot more than that, especially across ${where}.`
  }
  if (gap < -22) {
    return `${opener} Your levels were close, but the trend itself wandered — mostly across ${where}.`
  }
  if (Math.abs(bias) > 0.14) {
    const amount = Math.abs(signedMean) >= 10 ? Math.round(Math.abs(signedMean)) : Math.abs(signedMean).toFixed(1)
    return `${opener} The overall arc was right, but you ${bias > 0 ? 'overestimated' : 'underestimated'} by about ${amount}${v.puzzle.unit === '%' ? ' points' : ` ${v.puzzle.unit}`} on average, most of all in ${where}.`
  }
  if (v.total >= 85) {
    return `${opener} You tracked the whole curve closely — only ${where} drifted at all.`
  }
  return `${opener} ${where.charAt(0).toUpperCase()}${where.slice(1)} is where you drifted furthest from the real line.`
}
