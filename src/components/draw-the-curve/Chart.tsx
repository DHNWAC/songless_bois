'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { fmtValue, makePlot, niceTicks, polyPath, smoothPath, xTicks } from '@/lib/draw-the-curve/chart'
import { buildErrorPatches } from '@/lib/draw-the-curve/reveal'
import { SketchPad } from '@/lib/draw-the-curve/sketch-pad'
import type { Point, Puzzle, ScoreBreakdown } from '@/lib/draw-the-curve/types'

/** Imperative surface the parent page uses to drive the sketch pad. */
export interface ChartHandle {
  clear: () => void
  toPoints: () => Point[]
}

interface ChartProps {
  puzzle: Puzzle
  /** null while drawing; once set, the chart locks and shows the reveal. */
  breakdown: ScoreBreakdown | null
  /** Sketch to preload — used when restoring an already-completed puzzle. */
  initialLine?: Point[]
  onSketchChange: (pad: { isEmpty: boolean; coverage: number; largestGap: number }) => void
}

const HEIGHT_RATIO = 0.66
const MIN_HEIGHT = 240
const MAX_HEIGHT = 380

function Chart({ puzzle, breakdown, initialLine, onSketchChange }: ChartProps, ref: React.Ref<ChartHandle>) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const padRef = useRef<SketchPad | null>(null)
  const [size, setSize] = useState({ w: 320, h: 240 })
  const [revealProgress, setRevealProgress] = useState(() => {
    if (!breakdown) return 0
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reduced ? 1 : 0
  })
  const rafRef = useRef(0)

  // Rendered sketch state, kept in React state rather than read off the ref
  // during render (reading a ref's .current value while rendering is unsafe
  // under the React Compiler this app uses).
  const [guessSegments, setGuessSegments] = useState<{ x: number; y: number }[][]>([])
  const [isEmpty, setIsEmpty] = useState(true)

  const plot = useMemo(() => makePlot(puzzle, size.w, size.h), [puzzle, size.w, size.h])

  const syncFromPad = useCallback(() => {
    const pad = padRef.current
    if (!pad) return
    setGuessSegments(pad.toPixelSegments())
    setIsEmpty(pad.isEmpty)
  }, [])

  // Set up (or resize) the sketch pad.
  useEffect(() => {
    if (!padRef.current) {
      padRef.current = new SketchPad(puzzle.xStart, puzzle.xEnd, puzzle.yMin, puzzle.yMax, plot)
      if (initialLine?.length) padRef.current.loadPoints(initialLine)
    } else {
      padRef.current.setPlot(plot)
    }
    syncFromPad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plot])

  // initialLine can arrive a render *after* mount (it depends on a
  // localStorage read that only resolves client-side, to avoid a hydration
  // mismatch — see the page component). Load it into an already-created pad
  // if it shows up late, but only while the pad is still empty so it never
  // overwrites an in-progress sketch.
  useEffect(() => {
    if (!initialLine?.length) return
    const pad = padRef.current
    if (pad && pad.isEmpty) {
      pad.loadPoints(initialLine)
      syncFromPad()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLine])

  // Track container width responsively.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, w * HEIGHT_RATIO)))
      setSize({ w, h })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Animate the reveal draw-on when a breakdown arrives. Chart remounts (via
  // its `key` on puzzle id) on every puzzle switch, so breakdown never flips
  // from set back to null within one mounted instance — nothing to reset here.
  // Reduced-motion is handled by the initializer above (revealProgress starts
  // at 1 already), so this effect only needs to run the animated case.
  useEffect(() => {
    if (!breakdown) return
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    cancelAnimationFrame(rafRef.current)
    const duration = 900
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setRevealProgress(eased)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [breakdown])

  const notifyChange = useCallback(() => {
    const pad = padRef.current
    if (!pad) return
    onSketchChange({ isEmpty: pad.isEmpty, coverage: pad.coverage, largestGap: pad.largestGap })
    syncFromPad()
  }, [onSketchChange, syncFromPad])

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        padRef.current?.clear()
        syncFromPad()
      },
      toPoints: () => padRef.current?.toPoints() ?? [],
    }),
    [syncFromPad],
  )

  // --- pointer handling -----------------------------------------------------
  const drawingLocked = breakdown !== null

  useEffect(() => {
    const svg = svgRef.current
    const pad = padRef.current
    if (!svg || !pad) return

    const local = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const down = (e: PointerEvent) => {
      if (drawingLocked) return
      e.preventDefault()
      svg.setPointerCapture(e.pointerId)
      pad.beginStroke()
      const p = local(e)
      pad.addSample(p.x, p.y)
      notifyChange()
    }
    const move = (e: PointerEvent) => {
      if (!pad.isDrawing || drawingLocked) return
      e.preventDefault()
      const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e]
      for (const ev of events.length ? events : [e]) {
        const p = local(ev as PointerEvent)
        pad.addSample(p.x, p.y)
      }
      notifyChange()
    }
    const up = (e: PointerEvent) => {
      if (!pad.isDrawing) return
      e.preventDefault()
      pad.endStroke()
      try {
        svg.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }

    svg.addEventListener('pointerdown', down)
    svg.addEventListener('pointermove', move)
    svg.addEventListener('pointerup', up)
    svg.addEventListener('pointercancel', up)
    svg.addEventListener('pointerleave', up)
    return () => {
      svg.removeEventListener('pointerdown', down)
      svg.removeEventListener('pointermove', move)
      svg.removeEventListener('pointerup', up)
      svg.removeEventListener('pointercancel', up)
      svg.removeEventListener('pointerleave', up)
    }
  }, [drawingLocked, notifyChange])

  const realPx = puzzle.series.map((p) => plot.toPx(p))
  const patches = breakdown ? buildErrorPatches(breakdown, plot) : []

  return (
    <div ref={wrapRef} className="relative rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.w} ${size.h}`}
        width={size.w}
        height={size.h}
        role="img"
        aria-label="Drawing area for your guess"
        className={['block w-full h-auto touch-none', drawingLocked ? 'cursor-default' : 'cursor-crosshair'].join(' ')}
      >
        {/* axes */}
        <g>
          {niceTicks(puzzle.yMin, puzzle.yMax).map((t) => {
            const y = plot.toPx({ x: puzzle.xStart, y: t }).y
            return (
              <g key={t}>
                <line x1={plot.left} y1={y} x2={plot.left + plot.width} y2={y} stroke="#27272a" strokeWidth={1} />
                <text x={plot.left - 8} y={y} fontSize={10.5} fill="#71717a" textAnchor="end" dominantBaseline="middle">
                  {fmtValue(t, puzzle.unit)}
                </text>
              </g>
            )
          })}
          {xTicks(puzzle).map((t) => {
            const x = plot.toPx({ x: t, y: puzzle.yMin }).x
            return (
              <text key={t} x={x} y={plot.top + plot.height + 22} fontSize={10.5} fill="#71717a" textAnchor="middle">
                {t}
              </text>
            )
          })}
          <line
            x1={plot.left}
            y1={plot.top + plot.height}
            x2={plot.left + plot.width}
            y2={plot.top + plot.height}
            stroke="#3f3f46"
            strokeWidth={1}
          />
          {puzzle.unit !== '%' && (
            <text x={plot.left} y={plot.top - 9} fontSize={10.5} fontWeight={600} fill="#a1a1aa" textAnchor="start">
              {puzzle.unit}
            </text>
          )}
        </g>

        {/* mismatch shading (reveal only) */}
        {patches.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} pointerEvents="none" />
        ))}

        {/* the player's sketch */}
        <g>
          {guessSegments.map((seg, i) =>
            seg.length >= 2 ? (
              <path key={i} d={polyPath(seg)} fill="none" stroke="#60a5fa" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" />
            ) : null,
          )}
        </g>

        {/* the real curve (reveal only), drawn on with a dash offset */}
        {breakdown && (
          <g>
            <RealCurve d={smoothPath(realPx)} progress={revealProgress} />
            {puzzle.series.map((_p, i) => {
              if (i / Math.max(1, puzzle.series.length - 1) > revealProgress + 0.02) return null
              const px = realPx[i]
              return <circle key={i} cx={px.x} cy={px.y} r={2.6} fill="#fb923c" />
            })}
          </g>
        )}
      </svg>

      {!drawingLocked && isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 text-sm">
          Draw your guess here
        </div>
      )}
    </div>
  )
}

export default forwardRef(Chart)

function RealCurve({ d, progress }: { d: string; progress: number }) {
  const ref = useRef<SVGPathElement>(null)
  const [len, setLen] = useState(1000)

  useEffect(() => {
    if (ref.current) setLen(ref.current.getTotalLength())
  }, [d])

  const dashProps =
    progress < 1
      ? { strokeDasharray: len, strokeDashoffset: len * (1 - progress) }
      : {}

  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke="#fb923c"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...dashProps}
    />
  )
}
