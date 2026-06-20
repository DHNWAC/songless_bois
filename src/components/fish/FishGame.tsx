'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { posKey, isBorder, Position } from '@/lib/fish/hex';
import { isPlaceable } from '@/lib/fish/puzzle';
import { generateBoard, BoardState } from '@/lib/fish/generate';
import { sharkNextMove } from '@/lib/fish/shark';
import { scoreWin, ScoreResult } from '@/lib/fish/scoring';
import { getHint, solveGame } from '@/lib/fish/solver';
import GameBoard from './GameBoard';

const LIVES_PER_DAY = 3;

function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function livesKey(seed: number) { return `cage-shark-${seed}-lives`; }
function bestKey(seed: number)  { return `cage-shark-${seed}-best`; }
function wonKey(seed: number)   { return `cage-shark-${seed}-won`; }

function loadLives(seed: number): number {
  try {
    const v = localStorage.getItem(livesKey(seed));
    if (v === null) return LIVES_PER_DAY;
    return Math.max(0, parseInt(v, 10) || 0);
  } catch { return LIVES_PER_DAY; }
}
function saveLives(seed: number, v: number) {
  try { localStorage.setItem(livesKey(seed), String(v)); } catch { /* blocked */ }
}
function loadBest(seed: number): number {
  try { return parseInt(localStorage.getItem(bestKey(seed)) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(seed: number, score: number) {
  try { localStorage.setItem(bestKey(seed), String(score)); } catch { /* blocked */ }
}
function loadWon(seed: number): boolean {
  try { return localStorage.getItem(wonKey(seed)) === 'true'; } catch { return false; }
}
function saveWon(seed: number) {
  try { localStorage.setItem(wonKey(seed), 'true'); } catch { /* blocked */ }
}

type GameStatus = 'playing' | 'won' | 'lost' | 'game_over';

type LoseReason = 'escaped' | 'ate_fish';

interface GameState extends BoardState {
  seed: number;
  rocks: Set<string>;
  moves: number;
  status: GameStatus;
  scoreResult: ScoreResult | null;
  loseReason: LoseReason | null;
}

function initState(seed: number): GameState {
  const board = generateBoard(seed);
  return { ...board, seed, rocks: new Set(), moves: 0, status: 'playing', scoreResult: null, loseReason: null };
}

interface FishGameProps {
  initialSeed: number;
  isAdmin?: boolean;
}

export default function FishGame({ initialSeed, isAdmin = false }: FishGameProps) {
  const [game, setGame] = useState<GameState>(() => initState(initialSeed));
  const [lives, setLives] = useState(LIVES_PER_DAY);
  const [bestScore, setBestScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hintCell, setHintCell] = useState<Position | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharkAnimKey, setSharkAnimKey] = useState(0);

  // Auto-solve (admin)
  const [autoPlayMoves, setAutoPlayMoves] = useState<Position[]>([]);
  const [autoPlayIdx, setAutoPlayIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [solveMsg, setSolveMsg] = useState<string | null>(null);
  const autoPlayRef = useRef(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setLives(loadLives(initialSeed));
    setBestScore(loadBest(initialSeed));
    if (loadWon(initialSeed)) {
      setGame(prev => ({ ...prev, status: 'won' }));
    }
  }, [initialSeed]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const resetCurrentGame = useCallback(() => {
    const currentLives = loadLives(game.seed);
    if (currentLives <= 0) return;
    stopTimer();
    startTimeRef.current = null;
    setElapsed(0);
    setGame(initState(game.seed));
    setHintCell(null);
    setShowHint(false);
    setAutoPlayMoves([]);
    setAutoPlayIdx(0);
    setIsAutoPlaying(false);
    setSolveMsg(null);
    autoPlayRef.current = false;
  }, [game.seed, stopTimer]);

  const adminFullReset = useCallback(() => {
    const seed = game.seed;
    try {
      localStorage.removeItem(livesKey(seed));
      localStorage.removeItem(bestKey(seed));
      localStorage.removeItem(wonKey(seed));
    } catch { /* blocked */ }
    stopTimer();
    startTimeRef.current = null;
    setElapsed(0);
    setLives(LIVES_PER_DAY);
    setBestScore(0);
    setGame(initState(seed));
    setHintCell(null);
    setShowHint(false);
    setAutoPlayMoves([]);
    setAutoPlayIdx(0);
    setIsAutoPlaying(false);
    setSolveMsg(null);
    autoPlayRef.current = false;
  }, [game.seed, stopTimer]);

  const applyMove = useCallback((row: number, col: number) => {
    // Start timer on first move
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
    }

    setGame(prev => {
      if (prev.status !== 'playing') return prev;
      const sharkK = posKey(prev.sharkPos.row, prev.sharkPos.col);
      if (!isPlaceable(prev.grid, prev.rocks, sharkK, prev.items, row, col)) return prev;

      const newRocks = new Set(prev.rocks);
      newRocks.add(posKey(row, col));
      const newMoves = prev.moves + 1;

      const next = sharkNextMove(prev.grid, newRocks, prev.sharkPos);

      if (next === 'trapped') {
        const scoreResult = scoreWin(newMoves, prev.sharkPos, prev.grid, newRocks, prev.items);
        stopTimer();
        const timeTakenMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        if (scoreResult.total > loadBest(prev.seed)) {
          saveBest(prev.seed, scoreResult.total);
          setBestScore(scoreResult.total);
        }
        saveWon(prev.seed);
        fetch('/api/fish/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: prev.seed, score: scoreResult.total, moves: newMoves, time_ms: timeTakenMs }),
        }).catch(() => {});
        return { ...prev, rocks: newRocks, moves: newMoves, status: 'won', scoreResult, loseReason: null };
      }

      const newSharkPos = next;
      const newSharkKey = posKey(newSharkPos.row, newSharkPos.col);

      // Shark eats a fish
      if (prev.items[newSharkKey] === 'bonus_fish') {
        stopTimer();
        setSharkAnimKey(k => k + 1);
        const newLives = Math.max(0, loadLives(prev.seed) - 1);
        saveLives(prev.seed, newLives);
        setLives(newLives);
        return {
          ...prev,
          rocks: newRocks,
          moves: newMoves,
          sharkPos: newSharkPos,
          status: newLives === 0 ? 'game_over' : 'lost',
          loseReason: 'ate_fish',
        };
      }

      // Shark reaches border
      if (isBorder(newSharkPos.row, newSharkPos.col)) {
        stopTimer();
        setSharkAnimKey(k => k + 1);
        const newLives = Math.max(0, loadLives(prev.seed) - 1);
        saveLives(prev.seed, newLives);
        setLives(newLives);
        return {
          ...prev,
          rocks: newRocks,
          moves: newMoves,
          sharkPos: newSharkPos,
          status: newLives === 0 ? 'game_over' : 'lost',
          loseReason: 'escaped',
        };
      }

      setSharkAnimKey(k => k + 1);
      setShowHint(false);
      setHintCell(null);
      return { ...prev, rocks: newRocks, moves: newMoves, sharkPos: newSharkPos };
    });
  }, []);

  const handleTileClick = useCallback((row: number, col: number) => {
    if (isAutoPlaying) return;
    applyMove(row, col);
  }, [isAutoPlaying, applyMove]);

  useEffect(() => {
    if (!isAutoPlaying || autoPlayIdx >= autoPlayMoves.length) {
      if (isAutoPlaying && autoPlayIdx >= autoPlayMoves.length) {
        setIsAutoPlaying(false);
        autoPlayRef.current = false;
      }
      return;
    }
    if (!autoPlayRef.current) return;
    const timer = setTimeout(() => {
      if (!autoPlayRef.current) return;
      applyMove(autoPlayMoves[autoPlayIdx].row, autoPlayMoves[autoPlayIdx].col);
      setAutoPlayIdx(i => i + 1);
    }, 450);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, autoPlayIdx, autoPlayMoves, applyMove]);

  useEffect(() => {
    if (game.status !== 'playing' && isAutoPlaying) {
      setIsAutoPlaying(false);
      autoPlayRef.current = false;
    }
  }, [game.status, isAutoPlaying]);

  const handleAISolve = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      autoPlayRef.current = false;
      return;
    }
    const solution = solveGame(game.grid, game.sharkPos, game.items);
    if (!solution || solution.length === 0) {
      setSolveMsg('🤖 No solution found from current state.');
      return;
    }
    setSolveMsg(`🤖 Solution: ${solution.length} moves`);
    setAutoPlayMoves(solution);
    setAutoPlayIdx(0);
    setIsAutoPlaying(true);
    autoPlayRef.current = true;
    setShowHint(false);
  }, [game, isAutoPlaying]);

  const handleHint = useCallback(() => {
    if (game.status !== 'playing') return;
    if (showHint) { setShowHint(false); return; }
    const hint = getHint(game.grid, game.rocks, game.sharkPos, game.items);
    setHintCell(hint);
    setShowHint(true);
  }, [game, showHint]);

  const handleShare = useCallback(async () => {
    if (!game.scoreResult) return;
    const livesUsed = LIVES_PER_DAY - lives;
    const hearts = '❤️'.repeat(lives) + '🖤'.repeat(livesUsed);
    const text = [
      `Cage the Shark 🦈 (daily)`,
      hearts,
      `⭐ Score: ${game.scoreResult.total}`,
      `🪨 Moves: ${game.moves}`,
      `⏱ Time: ${fmtTime(Math.floor(elapsed))}`,
      `Can you beat me?`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert(text); }
  }, [game, lives]);

  const hintKey = showHint && hintCell ? posKey(hintCell.row, hintCell.col) : null;

  const livesDisplay = Array.from({ length: LIVES_PER_DAY }, (_, i) =>
    i < lives ? '❤️' : '🖤',
  ).join(' ');

  function fmtTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  return (
    <div className="fish-app">
      <header className="fish-header">
        <h1 className="fish-title">Cage the Shark</h1>
        <p className="fish-subtitle">Block escapes — trap 🦈 before it reaches the border</p>
      </header>

      <div className="fish-stats">
        <div className="fish-stat">
          <span className="fish-stat-icon">🪨</span>
          <span className="fish-stat-label">Moves</span>
          <span className="fish-stat-value">{game.moves}</span>
        </div>
        <div className="fish-stat-divider" />
        <div className="fish-stat">
          <span className="fish-stat-icon">❤️</span>
          <span className="fish-stat-label">Lives</span>
          <span className="fish-stat-value fish-stat-lives">{livesDisplay}</span>
        </div>
        <div className="fish-stat-divider" />
        <div className="fish-stat">
          <span className="fish-stat-icon">⏱</span>
          <span className="fish-stat-label">Time</span>
          <span className="fish-stat-value">{elapsed > 0 ? fmtTime(elapsed) : '—'}</span>
        </div>
        <div className="fish-stat-divider" />
        <div className="fish-stat">
          <span className="fish-stat-icon">🏆</span>
          <span className="fish-stat-label">Best</span>
          <span className="fish-stat-value">{bestScore || '—'}</span>
        </div>
      </div>

      {solveMsg && isAdmin && (
        <div className="fish-solve-banner">{solveMsg}</div>
      )}

      <div className="fish-board-wrap">
        <GameBoard
          grid={game.grid}
          rocks={game.rocks}
          items={game.items}
          sharkPos={game.sharkPos}
          sharkAnimKey={sharkAnimKey}
          hintKey={hintKey}
          status={game.status}
          scoreResult={game.scoreResult}
          onTileClick={handleTileClick}
        />
      </div>

      {game.status === 'won' && game.scoreResult && (
        <div className="fish-result fish-result-win">
          <div className="fish-result-icon">🎉</div>
          <h2 className="fish-result-title">Shark trapped!</h2>
          <div className="fish-breakdown">
            <div className="fish-breakdown-row">
              <span>Base ({game.moves} moves)</span>
              <span>+{Math.max(50, 600 - game.moves * 25)}</span>
            </div>
            {game.scoreResult.fishSaved > 0 && (
              <div className="fish-breakdown-row">
                <span>Fish saved 🐠 × {game.scoreResult.fishSaved}</span>
                <span>+{game.scoreResult.fishSaved * 3}</span>
              </div>
            )}
            {game.scoreResult.treasureSaved && (
              <div className="fish-breakdown-row">
                <span>Treasure safe 🐚</span>
                <span>+10</span>
              </div>
            )}
            {game.scoreResult.jellyfishLoose && (
              <div className="fish-breakdown-row fish-breakdown-penalty">
                <span>Jellyfish loose 🪼</span>
                <span>−5</span>
              </div>
            )}
            <div className="fish-breakdown-total">
              <span>Total</span>
              <span>{game.scoreResult.total}</span>
            </div>
          </div>
        </div>
      )}

      {game.status === 'lost' && (
        <div className="fish-result fish-result-fail">
          <div className="fish-result-icon">{game.loseReason === 'ate_fish' ? '🐠' : '🦈'}</div>
          <h2 className="fish-result-title">
            {game.loseReason === 'ate_fish'
              ? 'Shark ate a fish!'
              : 'Shark escaped!'}
            {' '}({game.moves} moves)
          </h2>
          <p className="fish-result-lives">{livesDisplay} {lives} {lives === 1 ? 'life' : 'lives'} left</p>
        </div>
      )}

      {game.status === 'game_over' && (
        <div className="fish-result fish-result-fail">
          <div className="fish-result-icon">💀</div>
          <h2 className="fish-result-title">Game Over! Come back tomorrow.</h2>
          <p className="fish-result-lives">No lives remaining</p>
        </div>
      )}

      <div className="fish-controls">
        {game.status === 'playing' && (
          <>
            {isAdmin && (
              <button
                className={`fish-btn fish-btn-hint${showHint ? ' active' : ''}`}
                onClick={handleHint}
                disabled={isAutoPlaying}
              >
                {showHint ? '💡 Hide' : '💡 Hint'}
              </button>
            )}
            <button className="fish-btn fish-btn-reset" onClick={resetCurrentGame} disabled={isAutoPlaying}>
              Reset
            </button>
            {isAdmin && (
              <button
                className={`fish-btn fish-btn-ai${isAutoPlaying ? ' active' : ''}`}
                onClick={handleAISolve}
              >
                {isAutoPlaying ? '⏹ Stop' : '🤖 AI'}
              </button>
            )}
          </>
        )}

        {game.status === 'lost' && (
          <button className="fish-btn fish-btn-reset" onClick={resetCurrentGame}>
            Try Again ({lives} left)
          </button>
        )}

        {game.status === 'won' && (
          <button className="fish-btn fish-btn-share" onClick={handleShare}>
            {copied ? '✓ Copied!' : '📋 Share'}
          </button>
        )}

        {/* Always-visible admin controls regardless of game status */}
        {isAdmin && (
          <button className="fish-btn fish-btn-admin-reset" onClick={adminFullReset}>
            🔄 Reset Fish
          </button>
        )}
      </div>

      <div className="fish-legend">
        <div className="fish-legend-item"><span>🦈</span> Shark (trap it!)</div>
        <div className="fish-legend-item"><span>🪨</span> Rock (you place)</div>
        <div className="fish-legend-item"><span>🪸</span> Coral (wall)</div>
        <div className="fish-legend-item"><span>🐠</span> Fish — shark eats!</div>
        <div className="fish-legend-item"><span>🐚</span> Treasure +10</div>
        <div className="fish-legend-item"><span>🪼</span> Jelly loose −5</div>
        {isAdmin && <div className="fish-legend-item"><span>🤖</span> AI auto-solve</div>}
      </div>
    </div>
  );
}
