export type TileType =
  | 'water'
  | 'coral'
  | 'fish'
  | 'shark'
  | 'bonus_fish'
  | 'treasure'
  | 'jellyfish';

export interface Position {
  row: number;
  col: number;
}

export const GRID_SIZE = 10;
export const MAX_ROCKS = 10;
export const PUZZLE_ID = '001';

// Puzzle #001 — 10×10 grid, row 0 = top, col 0 = left
export const PUZZLE_GRID: TileType[][] = [
  ['water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'shark'],
  ['water', 'water', 'water', 'coral', 'water', 'water', 'water', 'water', 'water', 'water'],
  ['water', 'coral', 'water', 'coral', 'water', 'water', 'bonus_fish', 'water', 'water', 'water'],
  ['water', 'coral', 'water', 'water', 'water', 'water', 'water', 'water', 'coral', 'water'],
  ['water', 'water', 'water', 'water', 'fish', 'water', 'water', 'water', 'coral', 'water'],
  ['water', 'water', 'bonus_fish', 'water', 'water', 'water', 'water', 'water', 'coral', 'water'],
  ['water', 'water', 'water', 'water', 'coral', 'coral', 'water', 'water', 'water', 'water'],
  ['water', 'water', 'treasure', 'water', 'water', 'water', 'water', 'bonus_fish', 'water', 'water'],
  ['water', 'water', 'water', 'water', 'water', 'jellyfish', 'water', 'water', 'water', 'water'],
  ['water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water'],
];

export const SHARK_POS: Position = { row: 0, col: 9 };
export const FISH_POS: Position = { row: 4, col: 4 };

export function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function isPlaceable(row: number, col: number): boolean {
  return PUZZLE_GRID[row]?.[col] === 'water';
}
