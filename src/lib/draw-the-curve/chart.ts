// Chart geometry and axis formatting for Draw the Curve.

import type { Point, Puzzle } from './types'

export interface Plot {
  left: number
  top: number
  width: number
  height: number
  toPx: (p: Point) => { x: number; y: number }
}

export const PAD = { left: 52, right: 14, top: 22, bottom: 34 }

export function makePlot(puzzle: Puzzle, w: number, h: number): Plot {
  const left = PAD.left
  const top = PAD.top
  const width = Math.max(1, w - PAD.left - PAD.right)
  const height = Math.max(1, h - PAD.top - PAD.bottom)
  const xSpan = puzzle.xEnd - puzzle.xStart || 1
  const ySpan = puzzle.yMax - puzzle.yMin || 1

  return {
    left,
    top,
    width,
    height,
    toPx: (p) => ({
      x: left + ((p.x - puzzle.xStart) / xSpan) * width,
      y: top + height - ((p.y - puzzle.yMin) / ySpan) * height,
    }),
  }
}

/** Format an axis value compactly: 1.2k, 3.4M, 12, 0.85. */
export function fmtValue(v: number, unit: string): string {
  const a = Math.abs(v)
  let s: string
  if (a >= 1e9) s = (v / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B'
  else if (a >= 1e6) s = (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M'
  else if (a >= 1e3) s = (v / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k'
  else if (a >= 1) s = v.toFixed(a >= 10 ? 0 : 1)
  else s = v.toFixed(2)
  return unit === '%' ? s + '%' : s
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min
  if (span <= 0) return [min]
  const rough = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= rough) ?? 10 * mag
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max + step * 0.001; t += step) {
    ticks.push(Number(t.toFixed(10)))
  }
  return ticks
}

export function xTicks(puzzle: Puzzle, count = 5): number[] {
  const span = puzzle.xEnd - puzzle.xStart
  const step = Math.max(1, Math.round(span / count))
  const ticks: number[] = []
  for (let t = puzzle.xStart; t <= puzzle.xEnd; t += step) ticks.push(t)
  if (ticks[ticks.length - 1] !== puzzle.xEnd) ticks.push(puzzle.xEnd)
  return ticks
}

/** Catmull-Rom smoothing so the real data line reads as a curve, not a zigzag. */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('')

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

export function polyPath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('')
}
