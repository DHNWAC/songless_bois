'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { getDayNumber, loadDailyState, msUntilAESTMidnight, SONGS_PER_DAY } from '@/lib/daily'
import AdminPanel from '@/components/AdminPanel'

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function JimsongdlePage() {
  const [dayNumber, setDayNumber] = useState(1)
  const [songsLeft, setSongsLeft] = useState(SONGS_PER_DAY)
  const [allDone, setAllDone] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [pinOpen, setPinOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const day = getDayNumber()
    const state = loadDailyState()
    setDayNumber(day)
    setSongsLeft(Math.max(0, SONGS_PER_DAY - state.songsCompleted))
    setAllDone(state.done)
  }, [])

  useEffect(() => {
    if (!allDone) return
    const tick = () => setCountdown(formatCountdown(msUntilAESTMidnight()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [allDone])

  const handleTitleTap = () => {
    tapCount.current += 1
    if (tapTimer.current) clearTimeout(tapTimer.current)
    if (tapCount.current >= 4) {
      tapCount.current = 0
      setPin('')
      setPinError(false)
      setPinOpen(true)
      return
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 1500)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full max-w-sm flex flex-col items-center gap-10 relative z-10">
        <div className="text-center">
          <div className="flex items-end justify-center gap-0.5 h-6 mb-5 opacity-30">
            {[3, 6, 10, 7, 12, 5, 9, 4, 8, 6, 11, 4].map((h, i) => (
              <div key={i} className="w-0.5 rounded-full bg-white" style={{ height: `${h * 2}px` }} />
            ))}
          </div>
          <h1
            className="text-6xl font-black tracking-tight text-white mb-3 leading-none cursor-default select-none"
            onClick={handleTitleTap}
          >
            Jimsongdle
          </h1>
          <p className="text-zinc-500 text-sm font-semibold tracking-widest uppercase mb-1">
            #{dayNumber}
          </p>
          <p className="text-zinc-600 text-sm tracking-wide">Guess the song from a clip</p>
        </div>

        {allDone ? (
          <div className="w-full flex flex-col items-center gap-3 text-center">
            <div className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 font-semibold text-sm">
              Come back tomorrow ✓
            </div>
            <p className="text-zinc-600 text-xs">Next songs in</p>
            <p className="text-white font-black text-3xl tabular-nums tracking-tight">{countdown}</p>
            <p className="text-zinc-700 text-xs">New songs tomorrow</p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            <Link
              href="/play"
              className="w-full text-center bg-white hover:bg-zinc-100 text-zinc-900 font-semibold py-3.5 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/40"
            >
              Play
            </Link>
            <p className="text-zinc-700 text-xs">
              {songsLeft} of {SONGS_PER_DAY} songs remaining today
            </p>
          </div>
        )}

        <Link href="/" className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors">
          ← All games
        </Link>
      </div>

      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 items-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Admin access</p>
            <p className="text-white font-black text-lg">Enter PIN</p>
            <div className="flex gap-3">
              {[0,1,2,3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-12 rounded-xl border flex items-center justify-center text-xl font-black"
                  style={{
                    borderColor: pinError ? '#7f1d1d' : pin.length > i ? 'var(--accent)' : '#3f3f46',
                    backgroundColor: pinError ? 'rgba(127,29,29,0.2)' : pin.length > i ? 'var(--accent-dim)' : 'transparent',
                    color: pinError ? '#f87171' : 'white',
                  }}
                >
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>
            {pinError && <p className="text-red-400 text-xs">Wrong PIN</p>}
            <div className="grid grid-cols-3 gap-2 w-full">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
                <button
                  key={k}
                  disabled={k === ''}
                  onClick={() => {
                    if (k === '⌫') { setPin((p) => p.slice(0, -1)); setPinError(false); return }
                    if (k === '') return
                    const next = pin + k
                    setPin(next)
                    if (next.length === 4) {
                      if (next === '6767') { setPinOpen(false); setAdminOpen(true) }
                      else { setPinError(true); setTimeout(() => { setPin(''); setPinError(false) }, 800) }
                    }
                  }}
                  className="py-3.5 rounded-2xl text-white font-bold text-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-0"
                >
                  {k}
                </button>
              ))}
            </div>
            <button onClick={() => setPinOpen(false)} className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </main>
  )
}
