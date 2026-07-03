'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDayNumber } from '@/lib/daily'
import { createGameState, samePos } from '@/lib/heist/board'
import { applyMove } from '@/lib/heist/game'
import { getDailyPuzzle, getPuzzleById } from '@/lib/heist/puzzles'
import {
  getAESTDateString,
  loadProgress,
  recordAttempt,
  recordWin,
  type HeistProgress,
} from '@/lib/heist/storage'
import type { GameState, Move, Position } from '@/lib/heist/types'
import GameBoard from '@/components/heist/GameBoard'
import GameStatus from '@/components/heist/GameStatus'
import Controls from '@/components/heist/Controls'
import PuzzleSelector from '@/components/heist/PuzzleSelector'
import ShareResult from '@/components/heist/ShareResult'

const KEY_MOVES: Record<string, Move> = {
  ArrowUp: 'up',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ' ': 'wait',
}

export default function HeistPage() {
  const dayNumber = getDayNumber()
  const dailyPuzzle = useMemo(() => getDailyPuzzle(dayNumber), [dayNumber])

  const [puzzleId, setPuzzleId] = useState(dailyPuzzle.id)
  const puzzle = getPuzzleById(puzzleId) ?? dailyPuzzle
  const isDaily = puzzle.id === dailyPuzzle.id

  const [history, setHistory] = useState<GameState[]>(() => [createGameState(dailyPuzzle)])
  const [attemptCounted, setAttemptCounted] = useState(false)
  const [showVision, setShowVision] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const [progress, setProgress] = useState<HeistProgress | null>(null)

  const state = history[history.length - 1]

  const resetTo = useCallback((id: number) => {
    const p = getPuzzleById(id)
    if (!p) return
    setPuzzleId(id)
    setHistory([createGameState(p)])
    setAttemptCounted(false)
    setShowResult(false)
  }, [])

  const handleMove = useCallback(
    (move: Move) => {
      const next = applyMove(state, move)
      if (next === state) return

      let prog = progress
      if (!attemptCounted) {
        prog = recordAttempt(puzzle.id)
        setAttemptCounted(true)
      }
      if (next.status === 'won') {
        prog = recordWin(puzzle.id, next.turn, getAESTDateString(), isDaily)
        setShowResult(true)
      }
      if (prog) setProgress(prog)
      setHistory((h) => [...h, next])
    },
    [state, progress, attemptCounted, puzzle.id, isDaily],
  )

  const handleTileTap = useCallback(
    (pos: Position) => {
      const { playerPos } = state
      if (samePos(pos, playerPos)) return handleMove('wait')
      if (pos.row === playerPos.row - 1 && pos.col === playerPos.col) return handleMove('up')
      if (pos.row === playerPos.row + 1 && pos.col === playerPos.col) return handleMove('down')
      if (pos.col === playerPos.col - 1 && pos.row === playerPos.row) return handleMove('left')
      if (pos.col === playerPos.col + 1 && pos.row === playerPos.row) return handleMove('right')
    },
    [state, handleMove],
  )

  const handleUndo = useCallback(() => {
    // Undo is free while playing; a finished game must be restarted.
    if (state.status !== 'playing') return
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
  }, [state.status])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const move = KEY_MOVES[e.key]
      if (!move) return
      e.preventDefault()
      handleMove(move)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

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
          Heist <span className="text-xl">🕵️</span>
        </h1>

        <GameStatus state={state} puzzleNumber={dayNumber} isDaily={isDaily} />

        <GameBoard state={state} showVision={showVision} onTileTap={handleTileTap} />

        <Controls
          canUndo={history.length > 1 && state.status === 'playing'}
          canWait={state.status === 'playing'}
          showVision={showVision}
          onUndo={handleUndo}
          onRestart={() => resetTo(puzzle.id)}
          onWait={() => handleMove('wait')}
          onToggleVision={() => setShowVision((v) => !v)}
        />

        {(state.status === 'spotted' || state.status === 'caught') && (
          <button
            onClick={() => resetTo(puzzle.id)}
            className="py-3 rounded-2xl font-bold text-sm bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 active:scale-[0.98] transition-all"
          >
            Try again
          </button>
        )}

        <p className="text-zinc-600 text-xs leading-relaxed">
          Tap an adjacent tile to move (or your own tile to wait) — arrow keys and space work too.
          After each move, every guard takes one step along its patrol. Red tiles show where the
          guards will look next: never end your move on red. Grab the loot 💰, return to the exit
          🚪 — in as few turns as you can.
        </p>
      </div>

      {showResult && state.status === 'won' && (
        <ShareResult
          data={{
            puzzleNumber: dayNumber,
            turnsUsed: state.turn,
            optimal: puzzle.optimalTurns,
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
