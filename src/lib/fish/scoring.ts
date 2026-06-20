import { posKey, Position } from './hex';
import { TileType } from './puzzle';
import { getSharkReachable } from './shark';

export interface ScoreResult {
  moves: number;
  fishSaved: number;
  treasureSaved: boolean;
  jellyfishLoose: boolean;
  total: number;
  sharkReachable: Set<string>;
}

export function scoreWin(
  moves: number,
  sharkPos: Position,
  grid: TileType[][],
  rocks: Set<string>,
  items: Record<string, 'bonus_fish' | 'treasure' | 'jellyfish'>,
): ScoreResult {
  const sharkReachable = getSharkReachable(grid, rocks, sharkPos);

  let fishSaved = 0;
  let treasureSaved = false;
  let jellyfishLoose = false;

  for (const [key, type] of Object.entries(items)) {
    if (sharkReachable.has(key)) {
      if (type === 'jellyfish') jellyfishLoose = true;
    } else {
      if (type === 'bonus_fish') fishSaved++;
      if (type === 'treasure') treasureSaved = true;
    }
  }

  const base = Math.max(50, 600 - moves * 25);
  const total = base + fishSaved * 3 + (treasureSaved ? 10 : 0) - (jellyfishLoose ? 5 : 0);

  return { moves, fishSaved, treasureSaved, jellyfishLoose, total, sharkReachable };
}
