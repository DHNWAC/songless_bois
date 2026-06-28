'use client'

import { useEffect, useState } from 'react'
import { getDayNumber, loadDailyState, resetDailyState, resetCaseState, resetGameContributions, SONGS_PER_DAY } from '@/lib/daily'
import { getDayPoolEntries, SONG_POOL } from '@/lib/songs'

interface AdminPanelProps {
  onClose: () => void
}

const TOTAL_DAYS = Math.floor(SONG_POOL.length / SONGS_PER_DAY)

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [dayNumber, setDayNumber] = useState(1)
  const [state, setState] = useState({ songsCompleted: 0, done: false, date: '' })
  const [resetDone, setResetDone] = useState(false)
  const [lookupInput, setLookupInput] = useState('')
  const [lookupDay, setLookupDay] = useState<number | null>(null)

  useEffect(() => {
    const today = getDayNumber()
    setDayNumber(today)
    setState(loadDailyState())
    setLookupDay(today)
    setLookupInput(String(today))
  }, [])

  const handleReset = () => {
    resetDailyState()
    resetCaseState()
    resetGameContributions()
    setState(loadDailyState())
    setResetDone(true)
    setTimeout(() => setResetDone(false), 2000)
  }

  const handleLookup = () => {
    const n = parseInt(lookupInput, 10)
    if (!isNaN(n) && n >= 1 && n <= TOTAL_DAYS) setLookupDay(n)
  }

  const lookupEntries = lookupDay !== null ? getDayPoolEntries(lookupDay) : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Admin</p>
            <p className="text-white font-black text-lg">Jimsongdle #{dayNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-white text-xl leading-none transition-colors"
            aria-label="Close admin panel"
          >
            ✕
          </button>
        </div>

        {/* Current state */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-1">Today</p>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Songs played</span>
            <span className="text-white font-semibold">{state.songsCompleted} / {SONGS_PER_DAY}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Status</span>
            <span className="font-semibold" style={{ color: state.done ? 'var(--accent)' : '#a1a1aa' }}>
              {state.done ? 'Complete' : 'In progress'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">AEST date</span>
            <span className="text-white font-mono text-xs">{state.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Total days available</span>
            <span className="text-white font-semibold">{TOTAL_DAYS}</span>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-2xl font-semibold text-sm border border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300 transition-all active:scale-[0.98]"
        >
          {resetDone ? 'Reset! Reload to play again ✓' : "Reset today's progress"}
        </button>

        {/* Day lookup */}
        <div className="flex flex-col gap-3">
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Song lookup</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={TOTAL_DAYS}
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLookup() }}
              placeholder={`Day 1–${TOTAL_DAYS}`}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-zinc-500 tabular-nums"
            />
            <button
              onClick={handleLookup}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ backgroundColor: 'var(--accent)', color: 'rgba(0,0,0,0.75)' }}
            >
              Go
            </button>
          </div>

          {lookupDay !== null && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
              <p className="text-zinc-400 text-xs font-semibold mb-1">
                Day #{lookupDay}
                {lookupDay === dayNumber && <span className="text-zinc-600 ml-1">— today</span>}
                {lookupDay < dayNumber && <span className="text-zinc-600 ml-1">— past</span>}
                {lookupDay > dayNumber && <span className="text-zinc-600 ml-1">— upcoming</span>}
              </p>
              <ol className="flex flex-col gap-2">
                {lookupEntries.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-zinc-600 tabular-nums shrink-0">{i + 1}.</span>
                    <span className="text-zinc-300">{q}</span>
                  </li>
                ))}
              </ol>
              <p className="text-zinc-700 text-xs mt-1">iTunes search queries — track resolved at game time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
