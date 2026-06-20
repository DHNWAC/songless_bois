export const GRID_SIZE = 11;
export const SHARK_START = { row: 5, col: 5 };

export interface Position {
  row: number;
  col: number;
}

export function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function isBorder(row: number, col: number): boolean {
  return row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1;
}

// Odd-r offset hex neighbours (6 directions).
// Even rows: NW = (r-1,c-1), NE = (r-1,c)
// Odd  rows: NW = (r-1,c),   NE = (r-1,c+1)
const EVEN_DIRS = [
  [0, 1], [0, -1],
  [-1, -1], [-1, 0],
  [1, -1], [1, 0],
] as const;

const ODD_DIRS = [
  [0, 1], [0, -1],
  [-1, 0], [-1, 1],
  [1, 0], [1, 1],
] as const;

export function hexNeighbors(row: number, col: number): Position[] {
  const dirs = row % 2 === 0 ? EVEN_DIRS : ODD_DIRS;
  const result: Position[] = [];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
      result.push({ row: nr, col: nc });
    }
  }
  return result;
}
