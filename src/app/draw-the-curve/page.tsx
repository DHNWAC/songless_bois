'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import AdminPanel from '@/components/draw-the-curve/AdminPanel'
import Chart, { type ChartHandle } from '@/components/draw-the-curve/Chart'
import ShareResult from '@/components/draw-the-curve/ShareResult'
import { getDayNumber, getDailyPuzzle, getPuzzleAtIndex, msUntilAESTMidnight } from '@/lib/draw-the-curve/puzzles'
import { scoreDrawing } from '@/lib/draw-the-curve/scoring'
import { buildShareText } from '@/lib/draw-the-curve/share'
import { compressLine, decompressLine, getRecord, loadProgress, recordResult } from '@/lib/draw-the-curve/storage'
import type { Puzzle } from '@/lib/draw-the-curve/types'

const REQUIRED_COVERAGE = 0.92
const MAX_GAP = 0.06

function getAESTDateString(): string {
  const now = new Date()
  const aestOffset = 10 * 60
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const aestMs = utcMs + aestOffset * 60_000
  const aest = new Date(aestMs)
  const y = aest.getFullYear()
  const m = String(aest.getMonth() + 1).padStart(2, '0')
  const d = String(aest.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function DrawTheCurvePage() {
  const dayNumber = getDayNumber()
  const dailyPuzzle = useMemo(() => getDailyPuzzle(dayNumber), [dayNumber])

  const [adminOpen, setAdminOpen] = useState(false)
  const [adminIndex, setAdminIndex] = useState<number | null>(null)
  const puzzle = adminIndex !== null ? getPuzzleAtIndex(adminIndex) : dailyPuzzle
  const isDaily = puzzle.id === dailyPuzzle.id
  const isPreview = adminIndex !== null

  return (
    <>
      {/* key={puzzle.id} remounts the whole round on every puzzle switch, so
          all puzzle-scoped state (sketch, breakdown, share text) starts fresh
          automatically — no manual reset effect needed. */}
      <PuzzleRound
        key={puzzle.id}
        puzzle={puzzle}
        dayNumber={dayNumber}
        isDaily={isDaily}
        isPreview={isPreview}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {adminOpen && (
        <AdminPanel
          currentPuzzleId={puzzle.id}
          onClose={() => setAdminOpen(false)}
          onJump={(index) => setAdminIndex(index)}
        />
      )}
    </>
  )
}

interface PuzzleRoundProps {
  puzzle: Puzzle
  dayNumber: number
  isDaily: boolean
  isPreview: boolean
  onOpenAdmin: () => void
}

function PuzzleRound({ puzzle, dayNumber, isDaily, isPreview, onOpenAdmin }: PuzzleRoundProps) {
  const chartRef = useRef<ChartHandle>(null)
  const [sketchState, setSketchState] = useState({ isEmpty: true, coverage: 0, largestGap: 0 })
  const [message, setMessage] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [streak, setStreak] = useState(() => loadProgress().streak)

  // Restore an already-completed puzzle (not applicable to admin previews,
  // which always start fresh regardless of any real saved result). This can
  // only be known client-side (it reads localStorage), so it MUST start null
  // — matching what the server always renders with no localStorage — and be
  // filled in only after hydration finishes, via an effect. Computing it
  // eagerly (even in a lazy useState initializer) runs during the hydrate
  // pass itself, while `window` already exists on the client, which is what
  // caused the mismatch this comment is warning against — verified by
  // reintroducing it and watching React error #418 come back on reload.
  // This is the textbook exception to "don't setState in an effect": syncing
  // in state that is genuinely unavailable during SSR.
  const [restored, setRestored] = useState<{
    line: ReturnType<typeof decompressLine>
    breakdown: ReturnType<typeof scoreDrawing>
    shareText: string
  } | null>(null)

  useEffect(() => {
    if (isPreview) return
    const existing = getRecord(puzzle.id)
    if (!existing) return
    const line = decompressLine(existing.line, puzzle.xStart, puzzle.xEnd, puzzle.yMin, puzzle.yMax)
    const scored = scoreDrawing(puzzle, line)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above `restored`
    setRestored({ line, breakdown: scored, shareText: buildShareText(puzzle, line, scored, dayNumber) })
  }, [puzzle, isPreview, dayNumber])

  const [submitted, setSubmitted] = useState<{ breakdown: ReturnType<typeof scoreDrawing>; shareText: string } | null>(null)

  const effectiveBreakdown = submitted?.breakdown ?? restored?.breakdown ?? null
  const shareText = submitted?.shareText ?? restored?.shareText ?? ''
  const locked = effectiveBreakdown !== null

  const handleClear = () => {
    chartRef.current?.clear()
    setSketchState({ isEmpty: true, coverage: 0, largestGap: 0 })
    setMessage('')
  }

  const handleReveal = () => {
    if (sketchState.isEmpty) {
      setMessage('Draw your guess first — drag across the chart from left to right.')
      return
    }
    if (sketchState.coverage < REQUIRED_COVERAGE) {
      setMessage(`Your line covers about ${Math.round(sketchState.coverage * 100)}% of the years. Draw all the way across before revealing.`)
      return
    }
    if (sketchState.largestGap > MAX_GAP) {
      setMessage('There is a gap in your line. Fill it in so the curve is continuous across every year.')
      return
    }

    setMessage('')
    const drawn = chartRef.current?.toPoints() ?? []
    const result = scoreDrawing(puzzle, drawn)
    setSubmitted({ breakdown: result, shareText: buildShareText(puzzle, drawn, result, dayNumber) })

    if (!isPreview) {
      const line = compressLine(drawn, puzzle.xStart, puzzle.xEnd, puzzle.yMin, puzzle.yMax)
      const updated = recordResult(puzzle.id, result.total, line, getAESTDateString(), isDaily)
      setStreak(updated.streak)
    }

    setTimeout(() => setShowResult(true), 950)
  }

  const record = isPreview ? null : getRecord(puzzle.id)

  // Computed client-side only, after mount: this is a live countdown, so its
  // text would always differ between the server-render pass and the moment
  // the client hydrates, causing a hydration mismatch if rendered eagerly.
  const [nextInLabel, setNextInLabel] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => {
      const ms = msUntilAESTMidnight()
      const h = Math.floor(ms / 3.6e6)
      const m = Math.floor((ms % 3.6e6) / 6e4)
      setNextInLabel(`${h}h ${String(m).padStart(2, '0')}m`)
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)', paddingTop: 'max(env(safe-area-inset-top), 2rem)' }}
    >
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-sm">#{isDaily ? dayNumber : 'preview'}</span>
            <button
              onClick={onOpenAdmin}
              className="w-7 h-7 rounded-lg border border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600 transition-colors text-sm"
              aria-label="Admin"
              title="Admin"
            >
              ⚙
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white">
          Draw the Curve <span className="text-xl">📈</span>
        </h1>

        <p className="text-white font-semibold leading-snug">{puzzle.prompt}</p>
        <p className="text-zinc-500 text-sm -mt-2">
          {locked ? 'Here is how your sketch compares.' : 'Drag left to right across the chart to sketch your guess.'}
        </p>

        <Chart
          ref={chartRef}
          puzzle={puzzle}
          breakdown={effectiveBreakdown}
          initialLine={restored?.line}
          onSketchChange={setSketchState}
        />

        {!locked && (
          <>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                Clear
              </button>
              <button
                onClick={handleReveal}
                className="flex-[2] py-3 rounded-2xl font-bold text-sm bg-white text-black hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Reveal
              </button>
            </div>
            {/* Always present (even when empty) so assistive tech is
                subscribed to the live region before content ever appears. */}
            <p role="status" aria-live="polite" className="text-red-400 text-sm min-h-[1.25em]">
              {message}
            </p>
          </>
        )}

        {locked && effectiveBreakdown && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 justify-center text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <i className="w-3.5 h-0.5 rounded-full bg-blue-400 inline-block" /> your sketch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="w-3.5 h-0.5 rounded-full bg-orange-400 inline-block" /> real data
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 text-center">
              <p className="text-4xl font-black text-white">
                {effectiveBreakdown.total}
                <span className="text-lg text-zinc-500 font-medium"> / 100</span>
              </p>
              <p className="text-zinc-300 text-sm mt-2 leading-relaxed">{effectiveBreakdown.verdict}</p>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Magnitude</p>
                  <p className="text-xl font-bold text-white mt-0.5">{effectiveBreakdown.magnitude}</p>
                </div>
                <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Shape</p>
                  <p className="text-xl font-bold text-white mt-0.5">{effectiveBreakdown.shape}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowResult(true)}
              className="py-3 rounded-2xl font-bold text-sm bg-blue-500/15 border border-blue-500/50 text-blue-300 hover:bg-blue-500/25 active:scale-[0.98] transition-all"
            >
              📋 Share result
            </button>

            <p className="text-center text-xs text-zinc-600">
              Source:{' '}
              <a href={puzzle.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 underline">
                {puzzle.sourceName}
              </a>
            </p>
            {isDaily && nextInLabel && <p className="text-center text-xs text-zinc-700">Next curve in {nextInLabel}</p>}
          </div>
        )}

        <p className="text-zinc-600 text-xs leading-relaxed">
          Sketch how you think the real number changed over time, then reveal the actual data. You&apos;re scored on
          both how close your levels were and whether you got the shape of the trend right — a flat guess through the
          middle won&apos;t save you.
        </p>
      </div>

      {showResult && effectiveBreakdown && (
        <ShareResult
          shareText={shareText}
          breakdown={effectiveBreakdown}
          bestScore={record?.bestScore ?? -1}
          streak={streak}
          sourceName={puzzle.sourceName}
          sourceUrl={puzzle.sourceUrl}
          onClose={() => setShowResult(false)}
        />
      )}
    </main>
  )
}
