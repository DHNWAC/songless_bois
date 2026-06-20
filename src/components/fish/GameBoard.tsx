'use client';

import { TileType } from '@/lib/fish/puzzle';
import { Position, posKey } from '@/lib/fish/hex';
import { ScoreResult } from '@/lib/fish/scoring';
import Tile from './Tile';

interface GameBoardProps {
  grid: TileType[][];
  rocks: Set<string>;
  items: Record<string, 'bonus_fish' | 'treasure' | 'jellyfish'>;
  sharkPos: Position;
  sharkAnimKey: number;
  hintKey: string | null;
  status: 'playing' | 'won' | 'lost' | 'game_over';
  scoreResult: ScoreResult | null;
  onTileClick: (row: number, col: number) => void;
}

export default function GameBoard({
  grid,
  rocks,
  items,
  sharkPos,
  sharkAnimKey,
  hintKey,
  status,
  scoreResult,
  onTileClick,
}: GameBoardProps) {
  const sharkKey = posKey(sharkPos.row, sharkPos.col);

  return (
    <div className="fish-board">
      {grid.map((row, r) => (
        <div key={r} className={`fish-row${r % 2 === 1 ? ' fish-row-odd' : ''}`}>
          {row.map((tileType, c) => {
            const key = posKey(r, c);
            const isShark = key === sharkKey;
            const hasRock = rocks.has(key);
            const item = items[key] as 'bonus_fish' | 'treasure' | 'jellyfish' | undefined;
            const isHint = key === hintKey;

            let highlight: 'none' | 'hint' | 'post-safe' | 'post-danger' = 'none';
            if (isHint) highlight = 'hint';
            else if (status !== 'playing' && scoreResult) {
              highlight = scoreResult.sharkReachable.has(key) ? 'post-danger' : 'post-safe';
            }

            const canInteract =
              status === 'playing' &&
              tileType === 'water' &&
              !hasRock &&
              !isShark &&
              item !== 'bonus_fish';

            return (
              <Tile
                key={key}
                type={tileType}
                hasRock={hasRock}
                item={item}
                isShark={isShark}
                sharkAnimKey={sharkAnimKey}
                highlight={highlight}
                canInteract={canInteract}
                onClick={() => onTileClick(r, c)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
