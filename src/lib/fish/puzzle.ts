export type TileType = 'water' | 'coral' | 'bonus_fish' | 'treasure' | 'jellyfish';

export type { Position } from './hex';
export { posKey, GRID_SIZE, SHARK_START, hexNeighbors, isBorder } from './hex';

export function isPlaceable(
  grid: TileType[][],
  rocks: Set<string>,
  sharkKey: string,
  items: Record<string, 'bonus_fish' | 'treasure' | 'jellyfish'>,
  row: number,
  col: number,
): boolean {
  const key = `${row},${col}`;
  if (grid[row]?.[col] !== 'water') return false;
  if (rocks.has(key) || key === sharkKey) return false;
  if (items[key] === 'bonus_fish') return false; // can't place on fish
  return true;
}
