'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { getDayNumber } from '@/lib/daily'
import { createGameState } from '@/lib/contain/board'
import { applyPlayerMove } from '@/lib/contain/game'
import { getSharkNextMove } from '@/lib/contain/shark'
import { getDailyPuzzle, getPuzzleById } from '@/lib/contain/puzzles'
import {
  getAESTDateString,
  loadProgress,
  recordAttempt,
  recordWin,
  type ContainProgress,
} from '@/lib/contain/storage'
import type { GameState, Position } from '@/lib/contain/types'
import GameBoard from '@/components/contain/GameBoard'
import GameStatus from '@/components/contain/GameStatus'
import Controls from '@/components/contain/Controls'
import PuzzleSelector from '@/components/contain/PuzzleSelector'
import ShareResult from '@/components/contain/ShareResult'

export default function ContainPage() {
  const dayNumber = getDayNumber()
  const dailyPuzzle = useMemo(() => getDailyPuzzle(dayNumber), [dayNumber])

  const [puzzleId, setPuzzleId] = useState(dailyPuzzle.id)
  const puzzle = getPuzzleById(puzzleId) ?? dailyPuzzle
  const isDaily = puzzle.id === dailyPuzzle.id

  const [history, setHistory] = useState<GameState[]>(() => [createGameState(dailyPuzzle)])
  const [attemptCounted, setAttemptCounted] = useState(false)
  const [showPath, setShowPath] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [progress, setProgress] = useState<ContainProgress | null>(null)

  const state = history[history.length - 1]
  const plan = useMemo(() => getSharkNextMove(state), [state])

  const resetTo = useCallback((id: number) => {
    const p = getPuzzleById(id)
    if (!p) return
    setPuzzleId(id)
    setHistory([createGameState(p)])
    setAttemptCounted(false)
    setShowResult(false)
  }, [])

  const handlePlace = useCallback(
    (pos: Position) => {
      const next = applyPlayerMove(state, pos)
      if (next === state) return

      let prog = progress
      if (!attemptCounted) {
        prog = recordAttempt(puzzle.id)
        setAttemptCounted(true)
      }
      if (next.status === 'won') {
        prog = recordWin(puzzle.id, next.playerRocks.length, getAESTDateString(), isDaily)
        setShowResult(true)
      }
      if (prog) setProgress(prog)
      setHistory((h) => [...h, next])
    },
    [state, progress, attemptCounted, puzzle.id, isDaily],
  )

  const handleUndo = useCallback(() => {
    // Undo is free while playing; a finished game must be restarted.
    if (state.status !== 'playing') return
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
  }, [state.status])

  const currentProgress = progress ?? (typeof window !== 'undefined' ? loadProgress() : null)
  const record = currentProgress?.records[puzzle.id]

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
          Contain <span className="text-xl">🦈</span>
        </h1>

        <GameStatus state={state} puzzleNumber={dayNumber} isDaily={isDaily} />

        <GameBoard state={state} plan={plan} showPath={showPath} onPlace={handlePlace} />

        <Controls
          canUndo={history.length > 1 && state.status === 'playing'}
          showPath={showPath}
          onUndo={handleUndo}
          onRestart={() => resetTo(puzzle.id)}
          onTogglePath={() => setShowPath((v) => !v)}
        />

        {state.status !== 'playing' && state.status !== 'won' && (
          <button
            onClick={() => resetTo(puzzle.id)}
            className="py-3 rounded-2xl font-bold text-sm bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 active:scale-[0.98] transition-all"
          >
            Try again
          </button>
        )}

        <p className="text-zinc-600 text-xs leading-relaxed">
          Place one rock per turn. The shark then swims one tile toward the nearest fish or map
          edge. Win by cutting off every fish and every escape route — in as few rocks as you can.
        </p>
      </div>

      {showResult && state.status === 'won' && (
        <ShareResult
          data={{
            puzzleNumber: dayNumber,
            rocksUsed: state.playerRocks.length,
            optimal: puzzle.optimalRockCount,
            fishSaved: state.fish.length,
            fishTotal: puzzle.fish.length,
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
