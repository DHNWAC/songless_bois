'use client'

import { PUZZLES } from '@/lib/omerdle/puzzles'

interface PuzzleSelectorProps {
  selectedId: number
  dailyId: number
  onSelect: (id: number) => void
}

/** Dev/testing helper: jump to any puzzle. The daily one is marked. */
export default function PuzzleSelector({ selectedId, dailyId, onSelect }: PuzzleSelectorProps) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(Number(e.target.value))}
      aria-label="Select puzzle"
      className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-orange-500"
    >
      {PUZZLES.map((p) => (
        <option key={p.id} value={p.id}>
          #{p.id} {p.startWord.toUpperCase()} ({p.difficulty}){p.id === dailyId ? ' — today' : ''}
        </option>
      ))}
    </select>
  )
}
