'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  loadCaseState,
  saveCaseState,
  loadGameContributions,
  contributionsToMultiplier,
  type GameContribution,
} from '@/lib/daily'

interface Rarity {
  name: string
  color: string
  bg: string
  baseWeight: number
  rank: number // 0 = common … 4 = best
}

const BASE_RARITIES: Rarity[] = [
  { name: 'Mil-Spec',   color: '#4b69ff', bg: '#4b69ff22', baseWeight: 79.92327, rank: 0 },
  { name: 'Restricted', color: '#8847ff', bg: '#8847ff22', baseWeight: 15.98465, rank: 1 },
  { name: 'Classified', color: '#d32ce6', bg: '#d32ce622', baseWeight: 3.18939,  rank: 2 },
  { name: 'Covert',     color: '#eb4b4b', bg: '#eb4b4b22', baseWeight: 0.63939,  rank: 3 },
  { name: 'Special',    color: '#e4ae39', bg: '#e4ae3922', baseWeight: 0.26558,  rank: 4 },
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
const ITEM_W = 80 // matches strip card `w-20` (80px) — must stay in sync for centering
const ITEM_GAP = 8

function buildStrip(winner: Rarity, multiplier: number) {
  const strip = Array.from({ length: STRIP_SIZE }, () => rollRarity(multiplier))
  strip[STRIP_SIZE - WINNER_POS] = { ...winner, weight: 0, chance: 0 }
  return strip
}

// Tiny synth sounds via Web Audio
function playTick(ctx: AudioContext, pitch = 1) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.frequency.value = (440 + Math.random() * 200) * pitch
  g.gain.setValueAtTime(0.08, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
  o.start(); o.stop(ctx.currentTime + 0.05)
}

// Rank 0-1: simple two-note chime
function playRevealCommon(ctx: AudioContext, color: string) {
  const freqs: Record<string, number[]> = {
    '#4b69ff': [330, 440],
    '#8847ff': [370, 494],
  }
  const notes = freqs[color] ?? [330, 440]
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    const t = ctx.currentTime + i * 0.14
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.18, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
    o.start(t); o.stop(t + 0.45)
  })
}

// Rank 2 (Classified/purple): eerie rising chord + shimmer
function playRevealClassified(ctx: AudioContext) {
  const chordFreqs = [415, 523, 622, 830]
  chordFreqs.forEach((freq, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = i % 2 === 0 ? 'sine' : 'triangle'
    o.frequency.setValueAtTime(freq * 0.85, ctx.currentTime)
    o.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 0.3)
    const t = ctx.currentTime + i * 0.07
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.14, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
    o.start(t); o.stop(t + 0.9)
  })
  // shimmer layer
  const shimmer = ctx.createOscillator(); const sg = ctx.createGain()
  shimmer.connect(sg); sg.connect(ctx.destination)
  shimmer.type = 'sine'; shimmer.frequency.value = 1244
  sg.gain.setValueAtTime(0, ctx.currentTime + 0.25)
  sg.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.35)
  sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
  shimmer.start(ctx.currentTime + 0.25); shimmer.stop(ctx.currentTime + 1.2)
}

// Rank 3 (Covert/red): big cinematic impact + rising arp
function playRevealCovert(ctx: AudioContext) {
  // sub boom
  const sub = ctx.createOscillator(); const sg = ctx.createGain()
  sub.connect(sg); sg.connect(ctx.destination)
  sub.type = 'sine'; sub.frequency.setValueAtTime(55, ctx.currentTime)
  sub.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.6)
  sg.gain.setValueAtTime(0.35, ctx.currentTime)
  sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
  sub.start(); sub.stop(ctx.currentTime + 0.6)

  // sawtooth whoosh
  const w = ctx.createOscillator(); const wg = ctx.createGain()
  w.connect(wg); wg.connect(ctx.destination)
  w.type = 'sawtooth'
  w.frequency.setValueAtTime(60, ctx.currentTime)
  w.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.55)
  wg.gain.setValueAtTime(0.0001, ctx.currentTime)
  wg.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.06)
  wg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
  w.start(); w.stop(ctx.currentTime + 0.8)

  // rising arp
  const arpFreqs = [494, 622, 740, 988, 1175]
  arpFreqs.forEach((freq, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    const t = ctx.currentTime + 0.1 + i * 0.09
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    o.start(t); o.stop(t + 0.5)
  })
}

// Rank 4 (Special/gold): full legendary fanfare
function playRevealLegendary(ctx: AudioContext) {
  // massive sub hit
  const sub = ctx.createOscillator(); const sg = ctx.createGain()
  sub.connect(sg); sg.connect(ctx.destination)
  sub.type = 'sine'; sub.frequency.setValueAtTime(40, ctx.currentTime)
  sub.frequency.exponentialRampToValueAtTime(22, ctx.currentTime + 0.8)
  sg.gain.setValueAtTime(0.45, ctx.currentTime)
  sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
  sub.start(); sub.stop(ctx.currentTime + 0.8)

  // triumphant chord stab
  const stab = [523, 659, 784, 1047, 1319]
  stab.forEach((freq, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = i < 2 ? 'triangle' : 'sine'
    o.frequency.value = freq
    const t = ctx.currentTime + i * 0.04
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.25 - i * 0.03, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
    o.start(t); o.stop(t + 1.4)
  })

  // golden shimmer cascade
  const cascade = [1568, 1976, 2093, 2637]
  cascade.forEach((freq, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    const t = ctx.currentTime + 0.35 + i * 0.11
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.1, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
    o.start(t); o.stop(t + 0.7)
  })
}

function playReveal(ctx: AudioContext, color: string, rank: number) {
  if (rank <= 1) playRevealCommon(ctx, color)
  else if (rank === 2) playRevealClassified(ctx)
  else if (rank === 3) playRevealCovert(ctx)
  else playRevealLegendary(ctx)
}

// Pre-spin tension buildup for known high-rarity outcome
function playTensionBuild(ctx: AudioContext, rank: number) {
  const intensity = (rank - 1) / 3 // 0.33 for rank2 → 1.0 for rank4
  // low drone that swells over 3.5s
  const drone = ctx.createOscillator(); const dg = ctx.createGain()
  drone.connect(dg); dg.connect(ctx.destination)
  drone.type = 'sine'
  drone.frequency.setValueAtTime(55 + rank * 8, ctx.currentTime)
  drone.frequency.linearRampToValueAtTime(80 + rank * 15, ctx.currentTime + 3.5)
  dg.gain.setValueAtTime(0, ctx.currentTime)
  dg.gain.linearRampToValueAtTime(0.04 + intensity * 0.1, ctx.currentTime + 1.5)
  dg.gain.linearRampToValueAtTime(0.12 + intensity * 0.15, ctx.currentTime + 3.2)
  dg.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.8)
  drone.start(); drone.stop(ctx.currentTime + 3.8)

  // rising pitch sweep at the end
  const sweep = ctx.createOscillator(); const swg = ctx.createGain()
  sweep.connect(swg); swg.connect(ctx.destination)
  sweep.type = 'sawtooth'
  sweep.frequency.setValueAtTime(120, ctx.currentTime + 3.0)
  sweep.frequency.exponentialRampToValueAtTime(800 + rank * 200, ctx.currentTime + 3.9)
  swg.gain.setValueAtTime(0, ctx.currentTime + 3.0)
  swg.gain.linearRampToValueAtTime(0.06 + intensity * 0.1, ctx.currentTime + 3.3)
  swg.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.9)
  sweep.start(ctx.currentTime + 3.0); sweep.stop(ctx.currentTime + 3.9)
}

const TOTAL_SPINS = 3
// Daily spin cooldown: 3 spins per day + persisted daily state.
const COOLDOWN_ENABLED = true

// Per-rarity reveal flavour
const RARITY_FLAVOUR: Record<number, { particles: number; flash: boolean; sting: boolean; tag: string }> = {
  0: { particles: 6,  flash: false, sting: false, tag: 'Common' },
  1: { particles: 10, flash: false, sting: false, tag: 'Uncommon' },
  2: { particles: 18, flash: true,  sting: true,  tag: 'Rare' },
  3: { particles: 26, flash: true,  sting: true,  tag: 'Very Rare' },
  4: { particles: 40, flash: true,  sting: true,  tag: 'Legendary' },
}

// Deterministic-ish particle layout generated once per reveal
function makeParticles(count: number, color: string) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.random() - 0.5) * 1.4 // radians spread
    const rise = -(120 + Math.random() * 220)
    const drift = Math.sin(angle) * (60 + Math.random() * 120)
    const size = 3 + Math.random() * 6
    return {
      key: i,
      left: `${15 + Math.random() * 70}%`,
      rise: `${rise}px`,
      drift: `${drift}px`,
      size,
      color,
      delay: `${Math.random() * 1.2}s`,
      dur: `${1.8 + Math.random() * 1.6}s`,
      scale: 0.6 + Math.random() * 0.8,
    }
  })
}

function makeConfetti(count: number, colors: string[]) {
  return Array.from({ length: count }, (_, i) => {
    const ang = Math.random() * Math.PI * 2
    const dist = 80 + Math.random() * 180
    return {
      key: i,
      cx: `${Math.cos(ang) * dist}px`,
      cy: `${Math.sin(ang) * dist - 40}px`,
      cr: `${(Math.random() - 0.5) * 720}deg`,
      color: colors[i % colors.length],
      w: 4 + Math.random() * 5,
      h: 8 + Math.random() * 8,
      dur: `${0.9 + Math.random() * 0.8}s`,
    }
  })
}

export default function CaseOpenPage() {
  const [multiplier, setMultiplier] = useState(1)
  const [contributions, setContributions] = useState<Record<string, GameContribution>>({})
  const [disclaimerVisible, setDisclaimerVisible] = useState(false)
  const [spinsUsed, setSpinsUsed] = useState(0)
  const [allResults, setAllResults] = useState<(Rarity & { weight: number })[]>([])
  const [strip, setStrip] = useState<(Rarity & { weight: number; chance: number })[]>([])
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'reveal'>('idle')
  const [translateX, setTranslateX] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [flash, setFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [pointerThunk, setPointerThunk] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const contribs = loadGameContributions()
    const m = contributionsToMultiplier(contribs)
    setContributions(contribs)
    setMultiplier(m)

    let timer: ReturnType<typeof setTimeout> | null = null
    if (Object.keys(contribs).length === 0) {
      setDisclaimerVisible(true)
      timer = setTimeout(() => setDisclaimerVisible(false), 5000)
    }

    if (COOLDOWN_ENABLED) {
      const state = loadCaseState()
      if (state) {
        setSpinsUsed(state.spinsUsed)
        const restored = state.results.map((name) => {
          const r = BASE_RARITIES.find((b) => b.name === name) ?? BASE_RARITIES[0]
          return { ...r, weight: 0 }
        })
        setAllResults(restored)
      }
    }

    return () => { if (timer) clearTimeout(timer) }
  }, [])

  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  const spinWithWinner = (winner: Rarity & { weight: number; chance: number }, isDev = false) => {
    if (phase === 'spinning') return

    // For dev spins: seed the strip with high-rarity items near the winner for hype
    let newStrip: (Rarity & { weight: number; chance: number })[]
    if (isDev) {
      const highRarities = applyMultiplier(multiplier).filter((r) => r.rank >= 2)
      newStrip = Array.from({ length: STRIP_SIZE }, (_, i) => {
        const distFromWinner = Math.abs(i - (STRIP_SIZE - WINNER_POS))
        // items close to winner are high rarity for tension
        if (distFromWinner > 0 && distFromWinner <= 8) return highRarities[Math.floor(Math.random() * highRarities.length)]
        return rollRarity(multiplier)
      })
      newStrip[STRIP_SIZE - WINNER_POS] = { ...winner, weight: 0, chance: 0 }
    } else {
      newStrip = buildStrip(winner, multiplier)
    }

    setStrip(newStrip)
    setTranslateX(0)
    setAnimating(false)
    setPhase('spinning')

    const ctx = getAudioCtx()
    void ctx.resume()

    // For high-rarity dev spins, start tension build immediately
    if (isDev && winner.rank >= 2) playTensionBuild(ctx, winner.rank)

    // Higher rank = higher-pitched ticks for subliminal hype
    const tickPitch = isDev && winner.rank >= 2 ? 1 + (winner.rank - 1) * 0.3 : 1
    let tickCount = 0
    const maxTicks = 30
    tickIntervalRef.current = setInterval(() => {
      playTick(ctx, tickPitch)
      tickCount++
      if (tickCount >= maxTicks && tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current)
      }
    }, 80 + tickCount * 8)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const containerW = containerRef.current?.clientWidth ?? 320
        const centerOffset = containerW / 2
        const winnerIndex = STRIP_SIZE - WINNER_POS
        const winnerCenter = winnerIndex * (ITEM_W + ITEM_GAP) + ITEM_W / 2
        setAnimating(true)
        setTranslateX(-(winnerCenter - centerOffset))

        setTimeout(() => setShaking(true), 3300)

        setTimeout(() => {
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
          const flavour = RARITY_FLAVOUR[winner.rank]
          playReveal(ctx, winner.color, winner.rank)
          if (flavour.flash) { setFlash(true); setTimeout(() => setFlash(false), 750) }
          setPointerThunk(true); setTimeout(() => setPointerThunk(false), 420)

          if (!isDev) {
            const newResults = [...allResults, winner]
            const newSpinsUsed = spinsUsed + 1
            setAllResults(newResults)
            setSpinsUsed(newSpinsUsed)
            if (COOLDOWN_ENABLED) {
              const state = loadCaseState()
              if (state) {
                saveCaseState({
                  ...state,
                  spinsUsed: newSpinsUsed,
                  results: newResults.map((r) => r.name),
                })
              }
            }
          }

          setPhase('reveal')
          setAnimating(false)
          setShaking(false)
        }, 4200)
      })
    })
  }

  const spin = () => {
    if (COOLDOWN_ENABLED && spinsUsed >= TOTAL_SPINS) return
    spinWithWinner(rollRarity(multiplier))
  }

  const nextSpin = () => setPhase('idle')

  const boostedRarities = applyMultiplier(multiplier)
  const url = typeof window !== 'undefined' ? window.location.origin : ''
  const rarityEmoji: Record<string, string> = {
    'Mil-Spec': '🔵', 'Restricted': '🟣', 'Classified': '🟪',
    'Covert': '🔴', 'Special': '🟡',
  }
  const shareText = [
    `Case Open - ${multiplier.toFixed(2)}x multiplier`,
    `Results: ${allResults.map((r) => rarityEmoji[r.name] ?? '⬜').join(' ')}`,
    allResults.map((r) => r.name).join(', '),
    '',
    'https://jimsengdle.vercel.app/',
  ].join('\n')

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { prompt('Copy results:', shareText) }
  }

  const currentResult = allResults[allResults.length - 1]
  const bestRank = allResults.reduce((m, r) => Math.max(m, r.rank), -1)
  const ambientColor = bestRank >= 0 ? BASE_RARITIES[bestRank].color : '#e4ae39'
  const allDone = COOLDOWN_ENABLED && spinsUsed >= TOTAL_SPINS

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-3 py-8 relative overflow-hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)', paddingTop: 'max(env(safe-area-inset-top), 2rem)' }}>
      {/* ── Atmospheric reactive background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="aurora absolute top-1/2 left-1/2 w-[120vmax] h-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-[0.18]"
          style={{ background: `radial-gradient(circle at 40% 40%, ${ambientColor}, transparent 60%)` }}
        />
        <div
          className="aurora absolute top-1/3 left-1/4 w-[80vmax] h-[80vmax] rounded-full blur-[110px] opacity-[0.12]"
          style={{ background: `radial-gradient(circle, #4b69ff, transparent 65%)`, animationDelay: '-8s', animationDuration: '32s' }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Screen flash on rare reveal */}
      {flash && (
        <div className="screen-flash fixed inset-0 z-40 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${currentResult?.color}cc, transparent 70%)` }} />
      )}

      <div className="w-full max-w-lg flex flex-col gap-6 relative z-10">
        {/* Disclaimer - only shown if no games played yet, auto-dismisses after 5s */}
        {disclaimerVisible && (
          <div className="fade-up rounded-2xl border border-zinc-800/60 bg-zinc-950/60 px-4 py-3 flex items-start gap-3">
            <span className="text-lg mt-0.5">💡</span>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Play all the games first before opening your case. Your odds get better the better you do.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between fade-up">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <h1 className="text-white font-black text-2xl tracking-tight">Case Open</h1>
            </div>
            <button
              onClick={() => setShowBreakdown((v) => !v)}
              className="text-zinc-500 text-xs tabular-nums hover:text-zinc-300 transition-colors text-left mt-0.5"
            >
              <span className="font-mono font-bold" style={{ color: ambientColor }}>{multiplier.toFixed(2)}x</span> multiplier{COOLDOWN_ENABLED ? ` · ${TOTAL_SPINS - spinsUsed} spins left` : ''} · <span className="underline underline-offset-2">how?</span>
            </button>
          </div>
          <Link href="/" className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors">← All games</Link>
        </div>

        {/* Multiplier breakdown */}
        {showBreakdown && (
          <div className="reveal-pop rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-2xl shadow-black/40">
            <p className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">How your multiplier is calculated</p>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Play games each day to boost your case open odds. Each game contributes a bonus based on how well you perform.
              The final multiplier is <span className="text-zinc-400 font-mono">1 + sum of all bonuses</span>.
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-zinc-500">Base</span>
                </div>
                <span className="text-zinc-500 tabular-nums font-mono text-xs">+1.00x always</span>
              </div>

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
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${c.pct * 100}%`, background: 'linear-gradient(90deg,#e4ae39,#f5d572)' }}
                        />
                      </div>
                      <span className="text-zinc-600 text-xs tabular-nums shrink-0">
                        {c.score}/{c.maxScore} · max +{c.maxBoost.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between text-sm opacity-40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full border border-zinc-700" />
                  <span className="text-zinc-600 text-xs italic">More games coming soon…</span>
                </div>
                <span className="text-zinc-700 tabular-nums font-mono text-xs">+?.??x</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-400 text-xs font-semibold">Total multiplier</span>
              <span className="text-white font-black tabular-nums text-lg">{multiplier.toFixed(2)}x</span>
            </div>
          </div>
        )}

        {/* Spin counter dots */}
        {COOLDOWN_ENABLED && (
        <div className="flex gap-2 fade-up" style={{ animationDelay: '60ms' }}>
          {Array.from({ length: TOTAL_SPINS }).map((_, i) => {
            const done = i < spinsUsed
            const r = allResults[i]
            return (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  background: done && r ? `linear-gradient(90deg,${r.color},${r.color}aa)` : '#27272a',
                  boxShadow: done && r ? `0 0 10px ${r.color}80` : 'none',
                }}
              />
            )
          })}
        </div>
        )}

        {/* ── Idle case (before spinning, no strip yet) ── */}
        {phase === 'idle' && strip.length === 0 && !allDone && (
          <div className="relative h-44 flex items-center justify-center fade-up" style={{ animationDelay: '120ms' }}>
            <div
              className="conic-spin absolute w-56 h-56 rounded-full opacity-30 blur-2xl"
              style={{ background: `conic-gradient(from 0deg, transparent, ${ambientColor}, transparent 60%)` }}
            />
            <div className="case-float relative" style={{ transformStyle: 'preserve-3d', perspective: 600 }}>
              <div
                className="shimmer relative w-32 h-24 rounded-xl border-2 overflow-hidden flex items-center justify-center"
                style={{
                  borderColor: `${ambientColor}99`,
                  background: `linear-gradient(145deg, #18181b, #0a0a0a)`,
                  boxShadow: `0 20px 50px -10px rgba(0,0,0,0.8), 0 0 40px -10px ${ambientColor}66, inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" style={{ background: `${ambientColor}55` }} />
                <div className="w-8 h-8 rounded-md border-2 flex items-center justify-center" style={{ borderColor: `${ambientColor}aa` }}>
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: ambientColor }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Slider (during/after spinning) ── */}
        {(phase !== 'idle' || strip.length > 0) && !allDone && (
          <div className="relative">
            <div
              ref={containerRef}
              className={`w-full overflow-hidden rounded-2xl border bg-black/60 backdrop-blur-sm ${shaking ? 'case-shake' : ''}`}
              style={{ height: 108, borderColor: phase === 'reveal' && currentResult ? `${currentResult.color}80` : '#27272a', boxShadow: phase === 'reveal' && currentResult ? `0 0 40px -8px ${currentResult.color}66` : 'none', transition: 'border-color 0.4s, box-shadow 0.4s' }}
            >
              {/* edge fades */}
              <div className="absolute left-0 top-0 bottom-0 w-16 z-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.9), transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-16 z-20 pointer-events-none" style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.9), transparent)' }} />

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
                    <div
                      key={i}
                      className="shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border relative overflow-hidden"
                      style={{
                        background: `linear-gradient(160deg, ${r.color}26, ${r.color}08)`,
                        borderColor: r.color + '55',
                        boxShadow: `inset 0 1px 0 ${r.color}33`,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: r.color }} />
                      <div className="w-9 h-9 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${r.color}, ${r.color}99)`, boxShadow: `0 0 14px ${r.color}88` }} />
                      <p className="text-[10px] font-bold text-center leading-tight px-1" style={{ color: r.color }}>{r.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-700 text-sm">Press Open to spin</p>
                </div>
              )}
            </div>
            {/* center ticker */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-0.5 bg-white/30 pointer-events-none z-30" style={{ boxShadow: '0 0 12px rgba(255,255,255,0.5)' }} />
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 -translate-y-1/2 pointer-events-none z-30 ${pointerThunk ? 'pointer-thunk' : ''}`} style={{ background: ambientColor, boxShadow: `0 0 10px ${ambientColor}` }} />
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 translate-y-1/2 pointer-events-none z-30 ${pointerThunk ? 'pointer-thunk' : ''}`} style={{ background: ambientColor, boxShadow: `0 0 10px ${ambientColor}` }} />
          </div>
        )}

        {/* ── Dramatic reveal ── */}
        {phase === 'reveal' && currentResult && (
          <RevealCard result={currentResult} boostedWeight={boostedRarities.find(r => r.name === currentResult.name)?.weight ?? 0} />
        )}

        {/* All results so far. With cooldown off the count is unbounded, so show
            the most recent spins and let them wrap instead of squishing flex-1. */}
        {allResults.length > 0 && (
          <div className="flex gap-2 fade-up flex-wrap">
            {(COOLDOWN_ENABLED ? allResults : allResults.slice(-8)).map((r, i) => (
              <div
                key={i}
                className="rounded-xl border p-3 flex flex-col items-center gap-1.5 relative overflow-hidden"
                style={{ flex: COOLDOWN_ENABLED ? '1' : '0 0 calc(25% - 0.375rem)', borderColor: r.color + '55', background: `linear-gradient(160deg, ${r.color}1f, ${r.color}08)` }}
              >
                <div className="w-7 h-7 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${r.color}, ${r.color}99)`, boxShadow: `0 0 12px ${r.color}77` }} />
                <p className="text-[10px] font-bold text-center" style={{ color: r.color }}>{r.name}</p>
              </div>
            ))}
            {COOLDOWN_ENABLED && Array.from({ length: TOTAL_SPINS - allResults.length }).map((_, i) => (
              <div key={i} className="flex-1 rounded-xl border border-dashed border-zinc-800 p-3 flex items-center justify-center min-h-[5.25rem]">
                <p className="text-zinc-700 text-lg">?</p>
              </div>
            ))}
          </div>
        )}

        {/* Odds table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm p-4 flex flex-col gap-2.5">
          <p className="text-zinc-600 text-xs uppercase tracking-wider font-semibold mb-1">Your odds · <span style={{ color: ambientColor }}>{multiplier.toFixed(2)}x</span></p>
          {[...boostedRarities].reverse().map((r) => (
            <div key={r.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color, boxShadow: `0 0 8px ${r.color}99` }} />
                  <span className="font-semibold" style={{ color: r.color }}>{r.name}</span>
                </div>
                <span className="text-zinc-400 tabular-nums text-xs font-mono">{r.weight.toFixed(3)}%</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(r.weight, 0.5)}%`, background: `linear-gradient(90deg, ${r.color}, ${r.color}aa)` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {!allDone ? (
            <button
              onClick={phase === 'reveal' ? nextSpin : spin}
              disabled={phase === 'spinning'}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden ${phase === 'idle' ? 'cta-pulse' : ''}`}
              style={{ background: 'linear-gradient(135deg, #f5d572, #e4ae39)', color: 'rgba(0,0,0,0.85)' }}
            >
              {phase === 'idle' && (COOLDOWN_ENABLED ? `Open Case · ${TOTAL_SPINS - spinsUsed} left` : 'Open Case')}
              {phase === 'spinning' && (
                <span className="inline-flex items-center gap-2">
                  Opening
                  <span className="inline-flex gap-0.5">
                    {[0,1,2].map(d => <span key={d} className="w-1 h-1 rounded-full bg-black/70 animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />)}
                  </span>
                </span>
              )}
              {phase === 'reveal' && (!COOLDOWN_ENABLED ? 'Open again →' : spinsUsed < TOTAL_SPINS ? 'Next spin →' : 'Finish ✦')}
            </button>
          ) : (
            <button
              onClick={handleShare}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] relative overflow-hidden shimmer"
              style={{ background: 'linear-gradient(135deg, #f5d572, #e4ae39)', color: 'rgba(0,0,0,0.85)' }}
            >
              {copied ? 'Copied! ✓' : 'Share results'}
            </button>
          )}
          {/* With cooldown off there's no "finished" state, so expose Share
              alongside the open button once at least one case is opened. */}
          {!COOLDOWN_ENABLED && phase === 'reveal' && allResults.length > 0 && (
            <button
              onClick={handleShare}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-zinc-300 bg-zinc-900/60 border border-zinc-800 hover:text-white hover:border-zinc-700 transition-all"
            >
              {copied ? 'Copied! ✓' : 'Share results'}
            </button>
          )}
          <Link href="/jimsongdle" className="w-full py-3 rounded-2xl font-semibold text-sm text-zinc-500 bg-zinc-900/60 border border-zinc-800 hover:text-white hover:border-zinc-700 transition-all text-center">
            ← Back to Jimsongdle
          </Link>
        </div>
      </div>
    </main>
  )
}

// ── Reveal card with halo, particles, confetti ──
function RevealCard({ result, boostedWeight }: { result: Rarity & { weight: number }; boostedWeight: number }) {
  const flavour = RARITY_FLAVOUR[result.rank]
  const [particles] = useState(() => makeParticles(flavour.particles, result.color))
  const [confetti] = useState(() => result.rank >= 3 ? makeConfetti(36, [result.color, '#ffffff', '#f5d572']) : [])

  return (
    <div className="reveal-pop relative rounded-2xl border p-5 overflow-hidden" style={{ borderColor: result.color + '80', background: `linear-gradient(160deg, ${result.color}26, ${result.color}0a)`, boxShadow: `0 0 50px -10px ${result.color}88, inset 0 1px 0 ${result.color}33` }}>
      {/* conic light sweep */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="conic-spin w-[140%] h-[300%] opacity-20" style={{ background: `conic-gradient(from 0deg, transparent, ${result.color}, transparent 25%, transparent, ${result.color}, transparent 75%)` }} />
      </div>

      {/* rising particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.key}
            className="particle absolute bottom-0 rounded-full"
            style={{
              left: p.left,
              width: p.size, height: p.size,
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              ['--rise' as string]: p.rise,
              ['--drift' as string]: p.drift,
              ['--p-delay' as string]: p.delay,
              ['--p-dur' as string]: p.dur,
              ['--p-scale' as string]: p.scale,
            }}
          />
        ))}
      </div>

      {/* confetti burst for top tiers */}
      {confetti.length > 0 && (
        <div className="absolute top-1/2 left-1/2 pointer-events-none">
          {confetti.map((c) => (
            <span
              key={c.key}
              className="confetti absolute rounded-sm"
              style={{
                width: c.w, height: c.h, background: c.color,
                ['--cx' as string]: c.cx,
                ['--cy' as string]: c.cy,
                ['--cr' as string]: c.cr,
                ['--c-dur' as string]: c.dur,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="halo-pulse absolute inset-0 rounded-full blur-md" style={{ background: result.color, transform: 'scale(1.4)' }} />
          <div className="relative w-14 h-14 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${result.color}, ${result.color}cc)`, boxShadow: `0 0 24px ${result.color}` }} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5" style={{ color: `${result.color}cc` }}>{flavour.tag}</p>
          <p className="font-black text-2xl leading-none text-glow" style={{ color: result.color }}>{result.name}</p>
          <p className="text-zinc-400 text-xs mt-1.5 font-mono">
            {result.baseWeight.toFixed(4)}% base → <span className="text-white font-bold">{boostedWeight.toFixed(3)}%</span> boosted
          </p>
        </div>
      </div>
    </div>
  )
}
