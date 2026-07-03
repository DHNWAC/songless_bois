# Heist — design spec

Approved 2026-07-03. Reverse-Contain daily stealth puzzle.

## Concept

You are the thief 🕵️ on a small grid with walls. Reach the vault 💰, grab the
loot, return to the exit 🚪 (your start tile) — without being seen or touched.

## Rules

- One move per turn: up/right/down/left or **wait**. Walls and board edges block movement.
- A guard's tile cannot be entered (rejected as an illegal move, not a loss).
- After the player moves, every guard advances one step along its fixed patrol
  loop. Guards are a pure function of turn number: `loop[turn % loop.length]`.
- A guard faces its direction of travel (single-tile loops are sentries with a
  fixed `facing`) and sees in a straight ray until a wall or the board edge.
- **Loss** if, after guards advance: the player is in any sight ray (`spotted`)
  or a guard steps onto the player (`caught`).
- Stepping onto the vault sets `hasLoot`. **Win**: standing on the start tile
  with the loot.

## UI

- Board renders the *next-turn* danger (guard destinations + projected sight)
  as a red wash: "don't end your move on red." Toggleable.
- Player and guards are compositor-animated overlays (same technique as
  Contain's shark).
- Input: tap an adjacent tile, keyboard arrows + space (wait), Wait button.
- Undo/Restart, daily + practice puzzle selector, share card — all mirror Contain.

## Scoring

- Score = turns taken. A BFS solver over (position × turn mod LCM(loop
  lengths) × hasLoot) computes the exact optimal per puzzle
  (`npm run solve:heist`).
- Ratings: Perfect (≤ optimal), Sharp (+1–2), Safe (+3–5), Messy (else).
- Streak/attempts/best in localStorage (`heist_progress`), AEST daily reset,
  same conventions as Contain.

## Files

Mirrors Contain exactly: `src/lib/heist/*`, `src/components/heist/*`,
`src/app/heist/page.tsx`, `scripts/solve-heist.ts`. Landing page: replaces the
🏆 placeholder slot.

## Out of scope (day one)

Fog of war, multiple loot items, guard alert/chase states, sound.
