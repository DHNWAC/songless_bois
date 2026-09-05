// Captures a sketch as a function of x: exactly one y per x-slot. Dragging
// back over an earlier x overwrites it, so the line can never fold back on
// itself. Framework-agnostic — used from a React component via useRef so its
// mutable per-sample state doesn't fight React's render cycle.
//
// The line lives on a fixed grid of x-slots across the plot width. Pointer
// moves are interpolated across every slot they span, so a fast flick still
// fills in the intermediate columns instead of leaving a gap.

import type { Point } from './types'

export interface PlotGeometry {
  left: number
  top: number
  width: number
  height: number
}

export class SketchPad {
  private slots: Float32Array
  private filled: Uint8Array
  private readonly n: number
  private lastSlot: number | null = null
  private drawingNow = false

  constructor(
    private xStart: number,
    private xEnd: number,
    private yMin: number,
    private yMax: number,
    private plot: PlotGeometry,
    resolution = 220,
  ) {
    this.n = resolution
    this.slots = new Float32Array(this.n)
    this.filled = new Uint8Array(this.n)
  }

  setPlot(plot: PlotGeometry): void {
    this.plot = plot
  }

  get isEmpty(): boolean {
    return !this.filled.some((f) => f === 1)
  }

  /** Fraction of the x-range that has been drawn, 0-1. */
  get coverage(): number {
    let count = 0
    for (let i = 0; i < this.n; i++) if (this.filled[i]) count++
    return count / this.n
  }

  /** The largest gap between drawn slots, as a fraction of the width. */
  get largestGap(): number {
    let gap = 0
    let run = 0
    for (let i = 0; i < this.n; i++) {
      if (this.filled[i]) run = 0
      else {
        run++
        if (run > gap) gap = run
      }
    }
    return gap / this.n
  }

  get isDrawing(): boolean {
    return this.drawingNow
  }

  clear(): void {
    this.filled.fill(0)
    this.lastSlot = null
  }

  beginStroke(): void {
    this.drawingNow = true
    this.lastSlot = null
  }

  endStroke(): void {
    this.drawingNow = false
    this.lastSlot = null
  }

  private slotFor(px: number): number {
    const t = (px - this.plot.left) / this.plot.width
    return Math.max(0, Math.min(this.n - 1, Math.round(t * (this.n - 1))))
  }

  private yFor(py: number): number {
    const clamped = Math.max(this.plot.top, Math.min(this.plot.top + this.plot.height, py))
    const t = (this.plot.top + this.plot.height - clamped) / this.plot.height
    return this.yMin + t * (this.yMax - this.yMin)
  }

  /**
   * Add a pointer sample. Interpolates from the previous sample so that fast
   * drags fill every x-slot in between rather than skipping columns.
   */
  addSample(px: number, py: number): void {
    const slot = this.slotFor(px)
    const y = this.yFor(py)

    if (this.lastSlot === null || this.lastSlot === slot) {
      this.slots[slot] = y
      this.filled[slot] = 1
    } else {
      const from = this.lastSlot
      const fromY = this.slots[from]
      const step = slot > from ? 1 : -1
      const span = Math.abs(slot - from)
      for (let k = 1; k <= span; k++) {
        const i = from + k * step
        const t = k / span
        this.slots[i] = fromY + (y - fromY) * t
        this.filled[i] = 1
      }
    }
    this.lastSlot = slot
  }

  /** The sketch in data space, x-ascending, only where actually drawn. */
  toPoints(): Point[] {
    const xSpan = this.xEnd - this.xStart
    const out: Point[] = []
    for (let i = 0; i < this.n; i++) {
      if (!this.filled[i]) continue
      out.push({ x: this.xStart + (i / (this.n - 1)) * xSpan, y: this.slots[i] })
    }
    return out
  }

  /** Screen-space path segments, split at gaps so undrawn regions stay blank. */
  toPixelSegments(): { x: number; y: number }[][] {
    const xSpan = this.xEnd - this.xStart
    const yRange = this.yMax - this.yMin || 1
    const toPx = (x: number, y: number) => ({
      x: this.plot.left + ((x - this.xStart) / xSpan) * this.plot.width,
      y: this.plot.top + this.plot.height - ((y - this.yMin) / yRange) * this.plot.height,
    })
    const segs: { x: number; y: number }[][] = []
    let cur: { x: number; y: number }[] = []
    for (let i = 0; i < this.n; i++) {
      if (!this.filled[i]) {
        if (cur.length) {
          segs.push(cur)
          cur = []
        }
        continue
      }
      const x = this.xStart + (i / (this.n - 1)) * xSpan
      cur.push(toPx(x, this.slots[i]))
    }
    if (cur.length) segs.push(cur)
    return segs
  }

  /** Restore a previously stored sketch (revisiting a completed puzzle). */
  loadPoints(points: Point[]): void {
    this.filled.fill(0)
    if (points.length === 0) return
    const xSpan = this.xEnd - this.xStart || 1
    for (const p of points) {
      const t = (p.x - this.xStart) / xSpan
      const i = Math.max(0, Math.min(this.n - 1, Math.round(t * (this.n - 1))))
      this.slots[i] = p.y
      this.filled[i] = 1
    }
    // Fill the gaps between stored samples so the restored line is continuous.
    let prev = -1
    for (let i = 0; i < this.n; i++) {
      if (!this.filled[i]) continue
      if (prev >= 0 && i - prev > 1) {
        for (let k = prev + 1; k < i; k++) {
          const t = (k - prev) / (i - prev)
          this.slots[k] = this.slots[prev] + (this.slots[i] - this.slots[prev]) * t
          this.filled[k] = 1
        }
      }
      prev = i
    }
  }
}
