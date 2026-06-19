'use client';

import { useState, useMemo, useCallback } from 'react';
import { PUZZLE_GRID, MAX_ROCKS, PUZZLE_ID, posKey, isPlaceable } from '@/lib/fish/puzzle';
import { calculateScore, getSharkReachable, ScoreResult } from '@/lib/fish/scoring';
import GameBoard from './GameBoard';
import { TileHighlight } from './Tile';

const BEST_KEY = `save-the-fish-${PUZZLE_ID}-best`;

function loadBest(): number {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch { /* storage blocked */ }
}

export default function FishGame() {
  const [rocks, setRocks] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [bestScore, setBestScore] = useState(loadBest);
  const [copied, setCopied] = useState(false);

  const rockCount = rocks.size;

  // Live BFS for preview mode — recomputes whenever rocks change
  const previewReachable = useMemo(() => {
    if (!previewMode || submitted) return null;
    return getSharkReachable(rocks);
  }, [previewMode, rocks, submitted]);

  const handleTileClick = useCallback(
    (row: number, col: number) => {
      if (submitted || !isPlaceable(row, col)) return;
      const key = posKey(row, col);
      setRocks(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (next.size >= MAX_ROCKS) return prev;
          next.add(key);
        }
        return next;
      });
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    const result = calculateScore(rocks);
    setScoreResult(result);
    setSubmitted(true);
    setPreviewMode(false);
    if (result.total > bestScore) {
      setBestScore(result.total);
      saveBest(result.total);
    }
  }, [rocks, submitted, bestScore]);

  const handleReset = useCallback(() => {
    setRocks(new Set());
    setSubmitted(false);
    setScoreResult(null);
    setPreviewMode(false);
    setCopied(false);
  }, []);

  const handleShare = useCallback(async () => {
    if (!scoreResult) return;
    const text = [
      `Save the Fish #${PUZZLE_ID}`,
      `🐟 Score: ${scoreResult.total}`,
      `🪨 Rocks used: ${rockCount}/${MAX_ROCKS}`,
      `🦈 Shark blocked: ${scoreResult.sharkReached ? 'No' : 'Yes'}`,
      `Can you beat me?`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(text);
    }
  }, [scoreResult, rockCount]);

  const getTileHighlight = useCallback(
    (row: number, col: number): TileHighlight => {
      const key = posKey(row, col);
      const tile = PUZZLE_GRID[row][col];

      if (submitted && scoreResult) {
        if (scoreResult.sharkReached) {
          if (scoreResult.sharkReachable.has(key) && tile !== 'coral') return 'post-danger';
        } else {
          if (scoreResult.region.has(key)) return 'post-safe';
        }
      } else if (previewReachable) {
        if (previewReachable.has(key) && tile !== 'coral') return 'preview-danger';
      }

      return 'none';
    },
    [submitted, scoreResult, previewReachable],
  );

  return (
    <div className="fish-app">
      <header className="fish-header">
        <h1 className="fish-title">
          Save the Fish <span className="fish-puzzle-num">#{PUZZLE_ID}</span>
        </h1>
        <p className="fish-subtitle">Place rocks to protect 🐟 from 🦈</p>
      </header>

      <div className="fish-stats">
        <div className="fish-stat">
          <span className="fish-stat-icon">🪨</span>
          <span className="fish-stat-label">Rocks</span>
          <span className="fish-stat-value">{rockCount}/{MAX_ROCKS}</span>
        </div>
        <div className="fish-stat-divider" />
        <div className="fish-stat">
          <span className="fish-stat-icon">⭐</span>
          <span className="fish-stat-label">Score</span>
          <span className="fish-stat-value">{scoreResult?.total ?? 0}</span>
        </div>
        <div className="fish-stat-divider" />
        <div className="fish-stat">
          <span className="fish-stat-icon">🏆</span>
          <span className="fish-stat-label">Best</span>
          <span className="fish-stat-value">{bestScore}</span>
        </div>
      </div>

      <div className="fish-board-wrap">
        <GameBoard
          grid={PUZZLE_GRID}
          rocks={rocks}
          submitted={submitted}
          canPlaceMore={rockCount < MAX_ROCKS}
          getTileHighlight={getTileHighlight}
          onTileClick={handleTileClick}
        />
      </div>

      {scoreResult && (
        <div className={`fish-result ${scoreResult.sharkReached ? 'fish-result-fail' : 'fish-result-win'}`}>
          <div className="fish-result-icon">{scoreResult.sharkReached ? '🦈' : '🎉'}</div>
          <h2 className="fish-result-title">
            {scoreResult.sharkReached ? 'The shark got in!' : 'The fish is safe!'}
          </h2>
          <div className="fish-breakdown">
            <div className="fish-breakdown-row">
              <span>Enclosed tiles</span>
              <span>+{scoreResult.regionSize}</span>
            </div>
            {scoreResult.bonusFishCount > 0 && (
              <div className="fish-breakdown-row">
                <span>Bonus fish 🐠 × {scoreResult.bonusFishCount}</span>
                <span>+{scoreResult.bonusFishCount * 3}</span>
              </div>
            )}
            {scoreResult.hasTreasure && (
              <div className="fish-breakdown-row">
                <span>Treasure 🐚</span>
                <span>+10</span>
              </div>
            )}
            {scoreResult.hasJellyfish && (
              <div className="fish-breakdown-row fish-breakdown-penalty">
                <span>Jellyfish 🪼</span>
                <span>−5</span>
              </div>
            )}
            {scoreResult.sharkReached && (
              <div className="fish-breakdown-row fish-breakdown-penalty">
                <span>Shark penalty (÷2)</span>
                <span></span>
              </div>
            )}
            <div className="fish-breakdown-total">
              <span>Total</span>
              <span>{scoreResult.total}</span>
            </div>
          </div>
        </div>
      )}

      <div className="fish-controls">
        {!submitted ? (
          <>
            <button
              className={`fish-btn fish-btn-preview${previewMode ? ' active' : ''}`}
              onClick={() => setPreviewMode(p => !p)}
            >
              {previewMode ? '🦈 Hide Danger' : '🦈 Preview Danger'}
            </button>
            <button className="fish-btn fish-btn-submit" onClick={handleSubmit}>
              Submit
            </button>
            <button className="fish-btn fish-btn-reset" onClick={handleReset}>
              Reset
            </button>
          </>
        ) : (
          <>
            <button className="fish-btn fish-btn-reset" onClick={handleReset}>
              Play Again
            </button>
            <button className="fish-btn fish-btn-share" onClick={handleShare}>
              {copied ? '✓ Copied!' : '📋 Share'}
            </button>
          </>
        )}
      </div>

      <div className="fish-legend">
        <div className="fish-legend-item"><span>🐟</span> Fish (protect!)</div>
        <div className="fish-legend-item"><span>🦈</span> Shark</div>
        <div className="fish-legend-item"><span>🪸</span> Coral (wall)</div>
        <div className="fish-legend-item"><span>🪨</span> Rock (you)</div>
        <div className="fish-legend-item"><span>🐠</span> Bonus +3</div>
        <div className="fish-legend-item"><span>🐚</span> Treasure +10</div>
        <div className="fish-legend-item"><span>🪼</span> Jellyfish −5</div>
      </div>
    </div>
  );
}
