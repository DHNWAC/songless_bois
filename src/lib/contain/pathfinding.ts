// BFS pathfinding. All shark decisions derive from the distance fields
// computed here, which keeps movement fully deterministic.

import { neighbors, posKey } from './board'
import type { Position } from './types'

const UNREACHED = -1

/**
 * BFS distance field from a set of source tiles, walking around rocks.
 * Returns a flat Int32Array indexed by row * size + col; -1 = unreachable.
 * Sources standing on rocks are ignored. Fish tiles are walkable — the shark
 * is happy to swim over (i.e. eat) them.
 */
export function distanceField(
  sources: Position[],
  rocks: Set<number>,
  size: number,
): Int32Array {
  const dist = new Int32Array(size * size).fill(UNREACHED)
  const queue: Position[] = []
  for (const s of sources) {
    if (rocks.has(posKey(s))) continue
    const idx = s.row * size + s.col
    if (dist[idx] === UNREACHED) {
      dist[idx] = 0
      queue.push(s)
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]
    const curDist = dist[cur.row * size + cur.col]
    for (const n of neighbors(cur, size)) {
      if (rocks.has(posKey(n))) continue
      const idx = n.row * size + n.col
      if (dist[idx] === UNREACHED) {
        dist[idx] = curDist + 1
        queue.push(n)
      }
    }
  }
  return dist
}

export function distAt(field: Int32Array, p: Position, size: number): number {
  return field[p.row * size + p.col]
}

/** All edge tiles of the grid. */
export function edgeTiles(size: number): Position[] {
  const out: Position[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (row === 0 || col === 0 || row === size - 1 || col === size - 1) {
        out.push({ row, col })
      }
    }
  }
  return out
}

/**
 * Reconstruct one shortest path from `from` toward the sources of `field`
 * (a distance field whose 0-tiles are the targets). At every step the first
 * neighbor in tie-break order with a strictly smaller distance is taken,
 * which makes the traced path deterministic. Includes `from`, ends on a target.
 * Returns null if unreachable.
 */
export function tracePath(
  from: Position,
  field: Int32Array,
  rocks: Set<number>,
  size: number,
): Position[] | null {
  let d = distAt(field, from, size)
  if (d === UNREACHED) return null
  const path: Position[] = [from]
  let cur = from
  while (d > 0) {
    let next: Position | null = null
    for (const n of neighbors(cur, size)) {
      if (rocks.has(posKey(n))) continue
      if (distAt(field, n, size) === d - 1) {
        next = n
        break
      }
    }
    if (!next) return null // should never happen on a consistent field
    path.push(next)
    cur = next
    d--
  }
  return path
}
