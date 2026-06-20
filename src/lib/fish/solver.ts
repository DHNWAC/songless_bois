import { Position, posKey, isBorder } from './hex';
import { TileType } from './puzzle';
import { sharkNextMove } from './shark';

// Best chokepoint to block: shark's next intended step, skipping fish tiles (can't place there).
export function getHint(
  grid: TileType[][],
  rocks: Set<string>,
  sharkPos: Position,
  items: Record<string, 'bonus_fish' | 'treasure' | 'jellyfish'>,
): Position | null {
  const next = sharkNextMove(grid, rocks, sharkPos);
  if (next === 'trapped') return null;
  // Don't suggest a fish tile — player can't place there
  if (items[posKey(next.row, next.col)] === 'bonus_fish') return null;
  return next;
}

// Greedy solver: each turn block the shark's intended next step.
// Returns ordered rock placements, or null if unsolvable within maxMoves.
export function solveGame(
  grid: TileType[][],
  sharkPos: Position,
  items: Record<string, 'bonus_fish' | 'treasure' | 'jellyfish'>,
  maxMoves = 30,
): Position[] | null {
  let pos = { ...sharkPos };
  const rocks = new Set<string>();
  const moves: Position[] = [];

  for (let i = 0; i < maxMoves; i++) {
    const intended = sharkNextMove(grid, rocks, pos);
    if (intended === 'trapped') return moves;

    const blockKey = posKey(intended.row, intended.col);

    // Can't place on a fish tile — shark will eat it next step → fail
    if (items[blockKey] === 'bonus_fish') return null;

    rocks.add(blockKey);
    moves.push(intended);

    const afterBlock = sharkNextMove(grid, rocks, pos);
    if (afterBlock === 'trapped') return moves;

    pos = afterBlock;
    if (isBorder(pos.row, pos.col)) return null;
    if (items[posKey(pos.row, pos.col)] === 'bonus_fish') return null; // shark ate fish
  }

  return null;
}
