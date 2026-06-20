import { GRID_SIZE, SHARK_START, hexNeighbors, isBorder, posKey, Position } from './hex';
import { TileType } from './puzzle';
import { getSharkReachable } from './shark';
import { solveGame } from './solver';

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BoardState {
  grid: TileType[][];
  sharkPos: Position;
  items: Record<string, 'bonus_fish' | 'treasure' | 'jellyfish'>;
}

function tryGenerate(seed: number): BoardState | null {
  const rng = mulberry32(seed);

  const grid: TileType[][] = Array.from({ length: GRID_SIZE }, () =>
    Array<TileType>(GRID_SIZE).fill('water'),
  );

  const sharkPos = { ...SHARK_START };
  const sharkKey = posKey(sharkPos.row, sharkPos.col);
  const sharkAdjacentKeys = new Set(
    hexNeighbors(sharkPos.row, sharkPos.col).map(p => posKey(p.row, p.col)),
  );
  sharkAdjacentKeys.add(sharkKey);

  const coralCount = 6 + Math.floor(rng() * 4);
  let placed = 0;
  let attempts = 0;

  while (placed < coralCount && attempts < 800) {
    attempts++;
    const r = Math.floor(rng() * GRID_SIZE);
    const c = Math.floor(rng() * GRID_SIZE);
    const key = posKey(r, c);
    if (sharkAdjacentKeys.has(key)) continue;
    if (grid[r][c] !== 'water') continue;
    if (isBorder(r, c)) continue;
    if (hexNeighbors(r, c).some(n => grid[n.row][n.col] === 'coral')) continue;
    grid[r][c] = 'coral';
    placed++;
  }

  const reachable = getSharkReachable(grid, new Set<string>(), sharkPos);
  const hasEscape = [...reachable].some(k => {
    const [r, c] = k.split(',').map(Number);
    return isBorder(r, c);
  });
  if (!hasEscape) return null;

  const items: Record<string, 'bonus_fish' | 'treasure' | 'jellyfish'> = {};
  const itemTypes: Array<'bonus_fish' | 'treasure' | 'jellyfish'> = [
    'bonus_fish', 'bonus_fish', 'bonus_fish', 'treasure', 'jellyfish',
  ];

  for (const itemType of itemTypes) {
    let ok = false;
    for (let i = 0; i < 400; i++) {
      const r = Math.floor(rng() * GRID_SIZE);
      const c = Math.floor(rng() * GRID_SIZE);
      const key = posKey(r, c);
      if (grid[r][c] !== 'water') continue;
      if (items[key]) continue;
      if (key === sharkKey) continue;
      if (Math.abs(r - sharkPos.row) + Math.abs(c - sharkPos.col) < 3) continue;
      items[key] = itemType;
      ok = true;
      break;
    }
    if (!ok) return null;
  }

  // Validate the puzzle is actually solvable (with fish placement rules)
  const solution = solveGame(grid, sharkPos, items);
  if (!solution) return null;

  return { grid, sharkPos, items };
}

export function generateBoard(seed: number): BoardState {
  for (let i = 0; i < 60; i++) {
    const result = tryGenerate(seed + i);
    if (result) return result;
  }
  // Fallback: bare board, no coral
  const grid: TileType[][] = Array.from({ length: GRID_SIZE }, () =>
    Array<TileType>(GRID_SIZE).fill('water'),
  );
  return { grid, sharkPos: { ...SHARK_START }, items: {} };
}
