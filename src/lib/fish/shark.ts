import { hexNeighbors, isBorder, posKey, Position } from './hex';
import { TileType } from './puzzle';

export function getSharkReachable(
  grid: TileType[][],
  rocks: Set<string>,
  sharkPos: Position,
): Set<string> {
  const visited = new Set<string>();
  const queue: Position[] = [{ ...sharkPos }];
  visited.add(posKey(sharkPos.row, sharkPos.col));

  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    for (const n of hexNeighbors(row, col)) {
      const key = posKey(n.row, n.col);
      if (visited.has(key)) continue;
      if (rocks.has(key)) continue;
      if (grid[n.row][n.col] === 'coral') continue;
      visited.add(key);
      queue.push(n);
    }
  }
  return visited;
}

// Returns the next position for the shark, or 'trapped' if no escape exists.
// Caller is responsible for checking isBorder(result) to detect escape.
export function sharkNextMove(
  grid: TileType[][],
  rocks: Set<string>,
  sharkPos: Position,
): Position | 'trapped' {
  const startKey = posKey(sharkPos.row, sharkPos.col);
  const dist = new Map<string, number>([[startKey, 0]]);
  const parent = new Map<string, string>();
  const queue: Position[] = [{ ...sharkPos }];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curKey = posKey(cur.row, cur.col);
    for (const n of hexNeighbors(cur.row, cur.col)) {
      const key = posKey(n.row, n.col);
      if (dist.has(key)) continue;
      if (rocks.has(key)) continue;
      if (grid[n.row][n.col] === 'coral') continue;
      dist.set(key, dist.get(curKey)! + 1);
      parent.set(key, curKey);
      queue.push(n);
    }
  }

  let bestKey: string | null = null;
  let bestDist = Infinity;
  for (const [key, d] of dist) {
    const [r, c] = key.split(',').map(Number);
    if (isBorder(r, c) && d < bestDist) {
      bestDist = d;
      bestKey = key;
    }
  }

  if (bestKey === null) return 'trapped';
  if (bestDist === 0) return { row: sharkPos.row, col: sharkPos.col };

  // Trace path back to find the first step from startKey
  let cur = bestKey;
  while (parent.get(cur) !== startKey) {
    cur = parent.get(cur)!;
  }
  const [nr, nc] = cur.split(',').map(Number);
  return { row: nr, col: nc };
}
