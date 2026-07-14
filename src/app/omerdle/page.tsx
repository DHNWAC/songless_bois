'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { getDayNumber } from '@/lib/daily'
import { ANSWER, createGameState, stepsUsed, submitGuess, undo, validateGuess } from '@/lib/omerdle/game'
import { getDailyPuzzle, getPuzzleById } from '@/lib/omerdle/puzzles'
import {
  getAESTDateString,
  loadProgress,
  recordAttempt,
  recordWin,
  type OmerdleProgress,
} from '@/lib/omerdle/storage'
import type { GameState } from '@/lib/omerdle/types'
import PuzzleSelector from '@/components/omerdle/PuzzleSelector'
import ShareResult from '@/components/omerdle/ShareResult'

const TARGET = ANSWER.toUpperCase()

function TileRow({ word, prev, isGoal }: { word: string; prev?: string; isGoal?: boolean }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {word.split('').map((ch, i) => {
        const matches = ch === ANSWER[i]
        const changed = prev !== undefined && ch !== prev[i]
        return (
          <div
            key={i}
            className={[
              'w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black uppercase border transition-colors',
              isGoal
                ? 'bg-orange-500/15 border-orange-500/50 text-orange-300'
                : matches
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-700 text-white',
              changed && !isGoal ? 'ring-1 ring-amber-400/60' : '',
            ].join(' ')}
          >
            {ch}
          </div>
        )
      })}
    </div>
  )
}

export default function OmerdlePage() {
  const dayNumber = getDayNumber()
  const dailyPuzzle = useMemo(() => getDailyPuzzle(dayNumber), [dayNumber])

  const [puzzleId, setPuzzleId] = useState(dailyPuzzle.id)
  const puzzle = getPuzzleById(puzzleId) ?? dailyPuzzle
  const isDaily = puzzle.id === dailyPuzzle.id

  const [state, setState] = useState<GameState>(() => createGameState(dailyPuzzle))
  const [guess, setGuess] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attemptCounted, setAttemptCounted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [progress, setProgress] = useState<OmerdleProgress | null>(null)

  const resetTo = useCallback((id: number) => {
    const p = getPuzzleById(id)
    if (!p) return
    setPuzzleId(id)
    setState(createGameState(p))
    setGuess('')
    setError(null)
    setAttemptCounted(false)
    setShowResult(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (state.status !== 'playing' || guess.length === 0) return
    const reason = validateGuess(state, guess)
    if (reason) {
      setError(reason)
      return
    }
    const next = submitGuess(state, guess)

    let prog = progress
    if (!attemptCounted) {
      prog = recordAttempt(puzzle.id)
      setAttemptCounted(true)
    }
    if (next.status === 'won') {
      prog = recordWin(puzzle.id, stepsUsed(next), getAESTDateString(), isDaily)
      setShowResult(true)
    }
    if (prog) setProgress(prog)
    setState(next)
    setGuess('')
    setError(null)
  }, [state, guess, progress, attemptCounted, puzzle.id, isDaily])

  const handleUndo = useCallback(() => {
    setState((s) => undo(s))
    setError(null)
  }, [])

  const currentProgress = progress ?? (typeof window !== 'undefined' ? loadProgress() : null)
  const record = currentProgress?.records[puzzle.id]
  const last = state.chain[state.chain.length - 1]

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)',
        paddingTop: 'max(env(safe-area-inset-top), 2rem)',
      }}
    >
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            ← Back
          </Link>
          <PuzzleSelector selectedId={puzzle.id} dailyId={dailyPuzzle.id} onSelect={resetTo} />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white">
          Omerdle <span className="text-xl">🪜</span>
        </h1>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">
              {isDaily ? `Daily #${dayNumber}` : `Puzzle ${puzzle.id}`}
            </span>
            <span className="text-zinc-500 text-sm">
              {puzzle.startWord.toUpperCase()} → {TARGET}
            </span>
          </div>
          <span
            className={[
              'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
              puzzle.difficulty === 'easy'
                ? 'bg-emerald-500/15 text-emerald-400'
                : puzzle.difficulty === 'medium'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-red-500/15 text-red-400',
            ].join(' ')}
          >
            {puzzle.difficulty}
          </span>
        </div>

        <p aria-live="polite" className={['text-sm', state.status === 'won' ? 'text-emerald-400 font-bold' : 'text-zinc-300'].join(' ')}>
          {state.status === 'won'
            ? `🎉 Reached ${TARGET} in ${stepsUsed(state)} steps!`
            : <>Steps: <span className="font-bold text-white">{stepsUsed(state)}</span></>}
        </p>

        <div className="flex flex-col gap-1.5">
          {state.chain.map((word, i) => (
            <TileRow key={i} word={word} prev={i > 0 ? state.chain[i - 1] : undefined} />
          ))}
          {state.status !== 'won' && (
            <>
              <div className="text-center text-zinc-600 text-sm leading-none">⋮</div>
              <TileRow word={ANSWER} isGoal />
            </>
          )}
        </div>

        {state.status === 'playing' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                value={guess}
                onChange={(e) => {
                  setGuess(e.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4))
                  setError(null)
                }}
                placeholder={`One letter off ${last.toUpperCase()}`}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Next word"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-white font-bold uppercase tracking-[0.3em] text-center outline-none focus:border-orange-500 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={guess.length !== 4}
                className="px-5 rounded-2xl font-bold text-sm bg-orange-500/15 border border-orange-500/50 text-orange-300 hover:bg-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Go
              </button>
            </div>
            {error && (
              <p aria-live="polite" className="text-red-400 text-sm">
                {error}
              </p>
            )}
          </form>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={state.chain.length <= 1 || state.status !== 'playing'}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↩ Undo
          </button>
          <button
            onClick={() => resetTo(puzzle.id)}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            ⟲ Restart
          </button>
        </div>

        <p className="text-zinc-600 text-xs leading-relaxed">
          Climb down the word ladder to {TARGET}. Each step, type a real 4-letter word that changes
          exactly one letter of the word above it. Green tiles already match {TARGET}. Steps are
          unlimited — but fewer is better.
        </p>
      </div>

      {showResult && state.status === 'won' && (
        <ShareResult
          data={{
            puzzleNumber: dayNumber,
            startWord: puzzle.startWord,
            stepsUsed: stepsUsed(state),
            optimal: puzzle.optimalSteps,
            attempts: record?.attempts ?? 1,
            streak: currentProgress?.streak ?? 0,
          }}
          bestScore={record?.bestScore ?? -1}
          onClose={() => setShowResult(false)}
        />
      )}
    </main>
  )
}
