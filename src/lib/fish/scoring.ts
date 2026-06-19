import { GRID_SIZE, PUZZLE_GRID, SHARK_POS, FISH_POS, posKey } from './puzzle';

type RockSet = Set<string>;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

function isBlocked(row: number, col: number, rocks: RockSet): boolean {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return true;
  if (rocks.has(posKey(row, col))) return true;
  return PUZZLE_GRID[row][col] === 'coral';
}

// BFS from shark — returns all cells the shark can reach with current rocks
export function getSharkReachable(rocks: RockSet): Set<string> {
  const visited = new Set<string>();
  const queue: [number, number][] = [[SHARK_POS.row, SHARK_POS.col]];
  visited.add(posKey(SHARK_POS.row, SHARK_POS.col));

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    for (const [dr, dc] of DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      const key = posKey(nr, nc);
      if (!visited.has(key) && !isBlocked(nr, nc, rocks)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return visited;
}

// Flood-fill from fish — returns the connected region the fish lives in
export function getFishRegion(rocks: RockSet): Set<string> {
  const visited = new Set<string>();
  const queue: [number, number][] = [[FISH_POS.row, FISH_POS.col]];
  visited.add(posKey(FISH_POS.row, FISH_POS.col));

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    for (const [dr, dc] of DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      const key = posKey(nr, nc);
      if (!visited.has(key) && !isBlocked(nr, nc, rocks)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return visited;
}

export interface ScoreResult {
  sharkReached: boolean;
  regionSize: number;
  bonusFishCount: number;
  hasTreasure: boolean;
  hasJellyfish: boolean;
  total: number;
  region: Set<string>;
  sharkReachable: Set<string>;
}

export function calculateScore(rocks: RockSet): ScoreResult {
  const sharkReachable = getSharkReachable(rocks);
  const sharkReached = sharkReachable.has(posKey(FISH_POS.row, FISH_POS.col));

  const region = getFishRegion(rocks);
  const regionSize = region.size;

  let bonusFishCount = 0;
  let hasTreasure = false;
  let hasJellyfish = false;

  for (const key of region) {
    const [r, c] = key.split(',').map(Number);
    const tile = PUZZLE_GRID[r][c];
    if (tile === 'bonus_fish') bonusFishCount++;
    if (tile === 'treasure') hasTreasure = true;
    if (tile === 'jellyfish') hasJellyfish = true;
  }

  // Shark blocked → +1/tile +3/bonus_fish +10/treasure -5/jellyfish
  // Shark reached → floor(regionSize / 2) consolation
  const total = sharkReached
    ? Math.floor(regionSize / 2)
    : regionSize + bonusFishCount * 3 + (hasTreasure ? 10 : 0) + (hasJellyfish ? -5 : 0);

  return { sharkReached, regionSize, bonusFishCount, hasTreasure, hasJellyfish, total, region, sharkReachable };
}
