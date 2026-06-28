'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import AdminPanel from '@/components/AdminPanel'

const GAMES = [
  {
    id: 'jimsongdle',
    href: '/jimsongdle',
    emoji: '🎵',
    name: 'Jimsongdle',
    tagline: 'Guess the song from a clip',
    live: true,
    accentColor: '#22c55e',
  },
  {
    id: 'placeholder-3',
    href: null,
    emoji: '🧩',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'placeholder-4',
    href: null,
    emoji: '🏆',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'placeholder-5',
    href: null,
    emoji: '🎲',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'placeholder-6',
    href: null,
    emoji: '⚡',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'case-open',
    href: '/case-open',
    emoji: '📦',
    name: 'Case Open',
    tagline: 'Roll your rarity - play all games first for better odds',
    live: true,
    accentColor: '#e4ae39',
    finale: true,
  },
]

export default function LandingPage() {
  const [topCogVisible, setTopCogVisible] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const cogTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBottomCog = () => {
    setTopCogVisible(true)
    if (cogTimer.current) clearTimeout(cogTimer.current)
    cogTimer.current = setTimeout(() => setTopCogVisible(false), 5000)
  }

  const handleTopCog = () => {
    setTopCogVisible(false)
    if (cogTimer.current) clearTimeout(cogTimer.current)
    setPin(''); setPinError(false); setPinOpen(true)
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:py-20 relative overflow-hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 3rem)', paddingTop: 'max(env(safe-area-inset-top), 3rem)' }}>
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora absolute -top-1/4 left-1/2 w-[90vmax] h-[90vmax] -translate-x-1/2 rounded-full blur-[120px] opacity-[0.10]" style={{ background: 'radial-gradient(circle, #22c55e, transparent 60%)' }} />
        <div className="aurora absolute top-1/2 -right-1/4 w-[70vmax] h-[70vmax] rounded-full blur-[120px] opacity-[0.08]" style={{ background: 'radial-gradient(circle, #e4ae39, transparent 60%)', animationDelay: '-12s', animationDuration: '30s' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="max-w-lg mx-auto relative z-10 flex flex-col gap-10">
        {/* Hero */}
        <div className="fade-up">
          <div className="flex items-end gap-0.5 h-6 mb-5 opacity-40">
            {[3, 7, 11, 6, 13, 5, 9, 4, 10, 6, 12, 4, 8].map((h, i) => (
              <div key={i} className="w-1 rounded-full bg-white" style={{ height: `${h * 2}px` }} />
            ))}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[0.95]">
            Jimsengdle
          </h1>
        </div>

        {/* Game grid */}
        <div className="flex flex-col gap-3">
          {GAMES.map((game, idx) => {
            const isFinale = 'finale' in game && game.finale
            const inner = (
              <div
                className={[
                  'group w-full rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 relative overflow-hidden',
                  game.live
                    ? 'border-zinc-700/80 bg-zinc-900/50 backdrop-blur-sm hover:border-zinc-500 hover:bg-zinc-900/80 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer'
                    : 'border-zinc-800/50 bg-zinc-950/30 cursor-default',
                  isFinale ? 'shimmer' : '',
                ].join(' ')}
                style={game.live ? { boxShadow: `0 0 0 0 ${game.accentColor}00` } : undefined}
              >
                {/* hover glow wash */}
                {game.live && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(120% 100% at 0% 50%, ${game.accentColor}14, transparent 55%)` }}
                  />
                )}

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110 relative z-10"
                  style={{
                    backgroundColor: game.live ? `${game.accentColor}18` : 'rgba(39,39,42,0.5)',
                    border: `1px solid ${game.live ? `${game.accentColor}40` : '#27272a'}`,
                    boxShadow: game.live ? `0 0 20px -6px ${game.accentColor}66` : 'none',
                  }}
                >
                  {game.emoji}
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={['font-bold text-base', game.live ? 'text-white' : 'text-zinc-600'].join(' ')}>
                      {game.name}
                    </p>
                    {isFinale ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${game.accentColor}20`, color: game.accentColor }}>
                        Finale
                      </span>
                    ) : game.live ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: `${game.accentColor}20`, color: game.accentColor }}>
                        <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: game.accentColor }} />
                        Live
                      </span>
                    ) : null}
                  </div>
                  <p className={['text-sm mt-0.5', game.live ? 'text-zinc-400' : 'text-zinc-700'].join(' ')}>
                    {game.tagline}
                  </p>
                </div>

                {game.live && (
                  <span className="text-zinc-600 text-lg shrink-0 relative z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-zinc-300">→</span>
                )}
              </div>
            )

            return (
              <div key={game.id} className="fade-up" style={{ animationDelay: `${idx * 60 + 80}ms` }}>
                {game.href ? (
                  <Link href={game.href} className="block">{inner}</Link>
                ) : (
                  inner
                )}
              </div>
            )
          })}
        </div>

      </div>

      <button onClick={handleBottomCog} className="fixed right-4 text-zinc-500 hover:text-zinc-300 transition-colors z-20" style={{ fontSize: 18, lineHeight: 1, opacity: 0.6, bottom: 'max(env(safe-area-inset-bottom), 1rem)', right: 'max(env(safe-area-inset-right), 1rem)' }} aria-hidden="true" tabIndex={-1}>⚙</button>
      {topCogVisible && (
        <button onClick={handleTopCog} className="fixed text-zinc-400 hover:text-white transition-colors z-20" style={{ fontSize: 18, lineHeight: 1, opacity: 0.7, top: 'max(env(safe-area-inset-top), 1rem)', right: 'max(env(safe-area-inset-right), 1rem)' }} aria-hidden="true" tabIndex={-1}>⚙</button>
      )}

      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 items-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Admin access</p>
            <p className="text-white font-black text-lg">Enter PIN</p>
            <div className="flex gap-3">
              {[0,1,2,3].map((i) => (
                <div key={i} className="w-10 h-12 rounded-xl border flex items-center justify-center text-xl font-black" style={{ borderColor: pinError ? '#7f1d1d' : pin.length > i ? 'var(--accent)' : '#3f3f46', backgroundColor: pinError ? 'rgba(127,29,29,0.2)' : pin.length > i ? 'var(--accent-dim)' : 'transparent', color: pinError ? '#f87171' : 'white' }}>
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>
            {pinError && <p className="text-red-400 text-xs">Wrong PIN</p>}
            <div className="grid grid-cols-3 gap-2 w-full">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
                <button key={k} disabled={k === ''} onClick={() => {
                  if (k === '⌫') { setPin((p) => p.slice(0, -1)); setPinError(false); return }
                  if (k === '') return
                  const next = pin + k
                  setPin(next)
                  if (next.length === 4) {
                    if (next === '6767') { setPinOpen(false); setAdminOpen(true) }
                    else { setPinError(true); setTimeout(() => { setPin(''); setPinError(false) }, 800) }
                  }
                }} className="py-3.5 rounded-2xl text-white font-bold text-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-0">
                  {k}
                </button>
              ))}
            </div>
            <button onClick={() => setPinOpen(false)} className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </main>
  )
}
