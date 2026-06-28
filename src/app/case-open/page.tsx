'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  loadCaseState,
  saveCaseState,
  loadGameContributions,
  contributionsToMultiplier,
  resetCaseState,
  resetDailyState,
  resetGameContributions,
  type GameContribution,
} from '@/lib/daily'

interface Rarity {
  name: string
  color: string
  bg: string
  baseWeight: number
}

const BASE_RARITIES: Rarity[] = [
  { name: 'Mil-Spec',   color: '#4b69ff', bg: '#4b69ff22', baseWeight: 79.92327 },
  { name: 'Restricted', color: '#8847ff', bg: '#8847ff22', baseWeight: 15.98465 },
  { name: 'Classified', color: '#d32ce6', bg: '#d32ce622', baseWeight: 3.18939  },
  { name: 'Covert',     color: '#eb4b4b', bg: '#eb4b4b22', baseWeight: 0.63939  },
  { name: 'Special',    color: '#e4ae39', bg: '#e4ae3922', baseWeight: 0.26558  },
]

// Apply multiplier: boost rare tiers, rebalance so total = 100
function applyMultiplier(multiplier: number): (Rarity & { weight: number; chance: number })[] {
  // Boost index 2+ (Classified, Covert, Special) by multiplier
  const boosted = BASE_RARITIES.map((r, i) => ({
    ...r,
    weight: i >= 2 ? r.baseWeight * multiplier : r.baseWeight,
  }))
  const total = boosted.reduce((s, r) => s + r.weight, 0)
  const normalised = boosted.map((r) => ({ ...r, weight: (r.weight / total) * 100 }))
  let cum = 0
  return normalised.map((r) => { cum += r.weight; return { ...r, chance: cum } })
}

function rollRarity(multiplier: number): Rarity & { weight: number; chance: number } {
  const rarities = applyMultiplier(multiplier)
  const roll = Math.random() * 100
  for (const r of rarities) { if (roll <= r.chance) return r }
  return rarities[rarities.length - 1]
}

const STRIP_SIZE = 60
const WINNER_POS = 6
const ITEM_W = 96
const ITEM_GAP = 8

function buildStrip(winner: Rarity, multiplier: number) {
  const strip = Array.from({ length: STRIP_SIZE }, () => rollRarity(multiplier))
  strip[STRIP_SIZE - WINNER_POS] = { ...winner, weight: 0, chance: 0 }
  return strip
}

// Tiny synth sounds via Web Audio
function playTick(ctx: AudioContext) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.frequency.value = 440 + Math.random() * 200
  g.gain.setValueAtTime(0.08, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
  o.start(); o.stop(ctx.currentTime + 0.05)
}

function playReveal(ctx: AudioContext, color: string) {
  const freqs: Record<string, number[]> = {
    '#4b69ff': [330, 440],
    '#8847ff': [370, 494],
    '#d32ce6': [415, 554],
    '#eb4b4b': [494, 659],
    '#e4ae39': [523, 784, 1047],
  }
  const notes = freqs[color] ?? [440, 554]
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.value = freq
    const t = ctx.currentTime + i * 0.12
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.2, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    o.start(t); o.stop(t + 0.4)
  })
}

const TOTAL_SPINS = 3

export default function CaseOpenPage() {
  const router = useRouter()
  const [multiplier, setMultiplier] = useState(1)
  const [contributions, setContributions] = useState<Record<string, GameContribution>>({})
  const [spinsUsed, setSpinsUsed] = useState(0)
  const [allResults, setAllResults] = useState<(Rarity & { weight: number })[]>([])
  const [strip, setStrip] = useState<(Rarity & { weight: number; chance: number })[]>([])
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'reveal'>('idle')
  const [translateX, setTranslateX] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const contribs = loadGameContributions()
    const m = contributionsToMultiplier(contribs)
    setContributions(contribs)
    setMultiplier(m)

    const state = loadCaseState()
    if (state) {
      setSpinsUsed(state.spinsUsed)
      const restored = state.results.map((name) => {
        const r = BASE_RARITIES.find((b) => b.name === name) ?? BASE_RARITIES[0]
        return { ...r, weight: 0 }
      })
      setAllResults(restored)
    }
  }, [])

  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  const spin = () => {
    if (phase === 'spinning' || spinsUsed >= TOTAL_SPINS) return
    const winner = rollRarity(multiplier)
    const newStrip = buildStrip(winner, multiplier)

    // Step 1: render strip at position 0 with no transition
    setStrip(newStrip)
    setTranslateX(0)
    setAnimating(false)
    setPhase('spinning')

    const ctx = getAudioCtx()

    let tickCount = 0
    const maxTicks = 30
    tickIntervalRef.current = setInterval(() => {
      playTick(ctx)
      tickCount++
      if (tickCount >= maxTicks && tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current)
      }
    }, 80 + tickCount * 8)

    // Step 2: after two frames (strip painted at 0), enable transition and set target
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const containerW = containerRef.current?.clientWidth ?? 320
        const centerOffset = containerW / 2
        const winnerIndex = STRIP_SIZE - WINNER_POS
        const winnerCenter = winnerIndex * (ITEM_W + ITEM_GAP) + ITEM_W / 2
        setAnimating(true)
        setTranslateX(-(winnerCenter - centerOffset))

        setTimeout(() => {
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
          playReveal(ctx, winner.color)
          const newResults = [...allResults, winner]
          const newSpinsUsed = spinsUsed + 1
          setAllResults(newResults)
          setSpinsUsed(newSpinsUsed)
          setPhase('reveal')
          setAnimating(false)

          const state = loadCaseState()
          if (state) {
            saveCaseState({
              ...state,
              spinsUsed: newSpinsUsed,
              results: newResults.map((r) => r.name),
            })
          }
        }, 4200)
      })
    })
  }

  const nextSpin = () => setPhase('idle')

  const handleResetAll = () => {
    resetDailyState()
    resetCaseState()
    resetGameContributions()
    setMultiplier(1)
    setContributions({})
    setSpinsUsed(0)
    setAllResults([])
    setStrip([])
    setPhase('idle')
    setTranslateX(0)
    router.push('/')
  }

  const boostedRarities = applyMultiplier(multiplier)
  const url = typeof window !== 'undefined' ? window.location.origin : ''
  const rarityEmoji: Record<string, string> = {
    'Mil-Spec': '🔵', 'Restricted': '🟣', 'Classified': '🟪',
    'Covert': '🔴', 'Special': '🟡',
  }
  const shareText = [
    `Case Open — ${multiplier.toFixed(2)}x multiplier`,
    `Results: ${allResults.map((r) => rarityEmoji[r.name] ?? '⬜').join(' ')}`,
    allResults.map((r) => r.name).join(', '),
    '',
    url,
  ].join('\n')

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { prompt('Copy results:', shareText) }
  }

  const currentResult = allResults[allResults.length - 1]

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-lg flex flex-col gap-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight">Case Open</h1>
            <button
              onClick={() => setShowBreakdown((v) => !v)}
              className="text-zinc-500 text-xs tabular-nums hover:text-zinc-300 transition-colors text-left"
            >
              {multiplier.toFixed(2)}x multiplier · {TOTAL_SPINS - spinsUsed} spins left · <span className="underline underline-offset-2">how?</span>
            </button>
          </div>
          <Link href="/" className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors">← All games</Link>
        </div>

        {/* Multiplier breakdown */}
        {showBreakdown && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">How your multiplier is calculated</p>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Play games each day to boost your case open odds. Each game contributes a bonus based on how well you perform.
              The final multiplier is <span className="text-zinc-400 font-mono">1 + sum of all bonuses</span>.
            </p>

            <div className="flex flex-col gap-2">
              {/* Base */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-zinc-500">Base</span>
                </div>
                <span className="text-zinc-500 tabular-nums font-mono text-xs">+1.00x always</span>
              </div>

              {/* Each game contribution */}
              {Object.values(contributions).length === 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 text-xs italic">No games played today yet</span>
                  <span className="text-zinc-700 tabular-nums font-mono text-xs">+0.00x</span>
                </div>
              ) : (
                Object.values(contributions).map((c) => (
                  <div key={c.gameId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e4ae39' }} />
                        <span className="text-zinc-300 font-semibold">{c.label}</span>
                      </div>
                      <span className="text-zinc-300 tabular-nums font-mono text-xs">+{c.boost.toFixed(2)}x</span>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${c.pct * 100}%`, backgroundColor: '#e4ae39' }}
                        />
                      </div>
                      <span className="text-zinc-600 text-xs tabular-nums shrink-0">
                        {c.score}/{c.maxScore} · max +{c.maxBoost.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Upcoming games hint */}
              <div className="flex items-center justify-between text-sm opacity-40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full border border-zinc-700" />
                  <span className="text-zinc-600 text-xs italic">More games coming soon…</span>
                </div>
                <span className="text-zinc-700 tabular-nums font-mono text-xs">+?.??x</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
              <span className="text-zinc-400 text-xs font-semibold">Total multiplier</span>
              <span className="text-white font-black tabular-nums">{multiplier.toFixed(2)}x</span>
            </div>
          </div>
        )}

        {/* Spin counter dots */}
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_SPINS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{ backgroundColor: i < spinsUsed ? '#e4ae39' : '#27272a' }}
            />
          ))}
        </div>

        {/* Slider */}
        <div className="relative">
          <div ref={containerRef} className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950" style={{ height: 120 }}>
            {strip.length > 0 ? (
              <div
                className="flex gap-2 items-center h-full py-3 pl-2"
                style={{
                  transform: `translateX(${translateX}px)`,
                  transition: animating ? 'transform 4s cubic-bezier(0.12, 1, 0.25, 1)' : 'none',
                  willChange: 'transform',
                }}
              >
                {strip.map((r, i) => (
                  <div key={i} className="shrink-0 w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-1 border" style={{ backgroundColor: r.bg, borderColor: r.color + '60' }}>
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: r.color }} />
                    <p className="text-[10px] font-bold text-center leading-tight px-1" style={{ color: r.color }}>{r.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-700 text-sm">{spinsUsed >= TOTAL_SPINS ? 'All spins used' : 'Press Open to spin'}</p>
              </div>
            )}
          </div>
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-0.5 bg-white/20 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/40 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/40 translate-y-1/2 pointer-events-none" />
        </div>

        {/* Reveal */}
        {phase === 'reveal' && currentResult && (
          <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ borderColor: currentResult.color + '60', backgroundColor: currentResult.bg }}>
            <div className="w-12 h-12 rounded-full shrink-0" style={{ backgroundColor: currentResult.color }} />
            <div>
              <p className="font-black text-xl" style={{ color: currentResult.color }}>{currentResult.name}</p>
              <p className="text-zinc-500 text-xs">{currentResult.baseWeight.toFixed(5)}% base · boosted to {boostedRarities.find(r => r.name === currentResult.name)?.weight.toFixed(3)}%</p>
            </div>
          </div>
        )}

        {/* All results so far */}
        {allResults.length > 0 && (
          <div className="flex gap-2">
            {allResults.map((r, i) => (
              <div key={i} className="flex-1 rounded-xl border p-3 flex flex-col items-center gap-1.5" style={{ borderColor: r.color + '50', backgroundColor: r.bg }}>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: r.color }} />
                <p className="text-[10px] font-bold text-center" style={{ color: r.color }}>{r.name}</p>
              </div>
            ))}
            {Array.from({ length: TOTAL_SPINS - allResults.length }).map((_, i) => (
              <div key={i} className="flex-1 rounded-xl border border-zinc-800 p-3 flex items-center justify-center">
                <p className="text-zinc-700 text-xs">?</p>
              </div>
            ))}
          </div>
        )}

        {/* Odds table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-1.5">
          <p className="text-zinc-600 text-xs uppercase tracking-wider font-semibold mb-1">Your odds ({multiplier.toFixed(2)}x)</p>
          {[...boostedRarities].reverse().map((r) => (
            <div key={r.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="font-semibold" style={{ color: r.color }}>{r.name}</span>
              </div>
              <span className="text-zinc-500 tabular-nums text-xs">{r.weight.toFixed(3)}%</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {spinsUsed < TOTAL_SPINS ? (
            <button
              onClick={phase === 'reveal' ? nextSpin : spin}
              disabled={phase === 'spinning'}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ backgroundColor: '#e4ae39', color: 'rgba(0,0,0,0.8)' }}
            >
              {phase === 'idle' && `Open Case (${TOTAL_SPINS - spinsUsed} left)`}
              {phase === 'spinning' && 'Opening…'}
              {phase === 'reveal' && (spinsUsed < TOTAL_SPINS ? 'Next spin →' : 'Done')}
            </button>
          ) : (
            <button
              onClick={handleShare}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#e4ae39', color: 'rgba(0,0,0,0.8)' }}
            >
              {copied ? 'Copied!' : 'Share results'}
            </button>
          )}
          <Link href="/jimsongdle" className="w-full py-3 rounded-2xl font-semibold text-sm text-zinc-500 bg-zinc-900 border border-zinc-800 hover:text-white transition-all text-center">
            ← Back to Jimsongdle
          </Link>
          <button
            onClick={handleResetAll}
            className="w-full py-2.5 rounded-2xl font-semibold text-sm border border-red-900 text-red-500 hover:bg-red-950 hover:text-red-300 transition-all active:scale-[0.98]"
          >
            🔴 Reset everything (dev)
          </button>
        </div>
      </div>
    </main>
  )
}
