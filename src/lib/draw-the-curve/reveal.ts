// Pure geometry for the reveal: colored patches for the mismatch region
// between the guess and the real curve. Rendered declaratively by
// components/draw-the-curve/Chart.tsx — no direct DOM manipulation here.

import type { Plot } from './chart'
import type { ScoreBreakdown } from './types'

export interface ErrorPatch {
  d: string
  color: string
}

/**
 * Colors to blend toward as the normalized error grows. Above-real (guess too
 * high) tints toward the guess line's blue; below-real (guess too low) tints
 * toward the real line's orange — so the shading itself hints at which way you
 * missed, without a separate legend to learn.
 */
const ABOVE_RGB: [number, number, number] = [96, 165, 250] // matches the guess line
const BELOW_RGB: [number, number, number] = [251, 146, 60] // matches the real line

/**
 * One filled quad per interval between consecutive real data points, each
 * colored by that interval's average signed error. Small quads (rather than
 * one path with a gradient) keep the color mapping exact and legible even
 * where the error swings from positive to negative between points.
 */
export function buildErrorPatches(s: ScoreBreakdown, plot: Plot): ErrorPatch[] {
  const usable = s.residuals.filter((r) => Number.isFinite(r.guessY))
  if (usable.length < 2) return []

  const patches: ErrorPatch[] = []

  for (let i = 0; i < usable.length - 1; i++) {
    const a = usable[i]
    const b = usable[i + 1]
    const aTop = plot.toPx({ x: a.x, y: a.realY })
    const aBot = plot.toPx({ x: a.x, y: a.guessY })
    const bTop = plot.toPx({ x: b.x, y: b.realY })
    const bBot = plot.toPx({ x: b.x, y: b.guessY })

    // Average signed error across the two endpoints of this stretch.
    const avgDelta = (a.delta + b.delta) / 2
    const avgErr = (a.normError + b.normError) / 2
    const rgb = avgDelta >= 0 ? ABOVE_RGB : BELOW_RGB
    // Scale opacity with error size: near-zero error fades to almost nothing,
    // large error (>=35% of the axis range) reaches full intensity.
    const alpha = Math.min(0.85, 0.06 + (avgErr / 0.35) * 0.7)

    const d = `M${aTop.x.toFixed(1)},${aTop.y.toFixed(1)} L${bTop.x.toFixed(1)},${bTop.y.toFixed(1)} L${bBot.x.toFixed(1)},${bBot.y.toFixed(1)} L${aBot.x.toFixed(1)},${aBot.y.toFixed(1)} Z`
    patches.push({ d, color: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})` })
  }

  return patches
}
