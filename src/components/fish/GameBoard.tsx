'use client';

import { TileType, posKey, isPlaceable } from '@/lib/fish/puzzle';
import Tile, { TileHighlight } from './Tile';

interface GameBoardProps {
  grid: TileType[][];
  rocks: Set<string>;
  submitted: boolean;
  canPlaceMore: boolean;
  getTileHighlight: (row: number, col: number) => TileHighlight;
  onTileClick: (row: number, col: number) => void;
}

export default function GameBoard({
  grid,
  rocks,
  submitted,
  canPlaceMore,
  getTileHighlight,
  onTileClick,
}: GameBoardProps) {
  return (
    <div className="fish-board">
      {grid.map((row, r) =>
        row.map((type, c) => {
          const key = posKey(r, c);
          const hasRock = rocks.has(key);
          const placeable = isPlaceable(r, c);
          const canInteract = !submitted && placeable && (hasRock || canPlaceMore);

          return (
            <Tile
              key={key}
              type={type}
              hasRock={hasRock}
              highlight={getTileHighlight(r, c)}
              canInteract={canInteract}
              onClick={() => onTileClick(r, c)}
            />
          );
        }),
      )}
    </div>
  );
}
