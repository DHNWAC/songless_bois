'use client'

import { useEffect, useRef, useState } from 'react'

interface Driver {
  name: string
  sprite: string // emoji / flag sprite
  color: string
  rank: number // visual flair tier; all equal odds
}

const DRIVERS: Driver[] = [
  { name: 'Kirby',  sprite: '👲🥢', color: '#eb4b4b', rank: 2 }, // Chinese
  { name: 'Daniel', sprite: '🧔🏽‍♂️🛕', color: '#e4ae39', rank: 2 }, // Indian
  { name: 'Omer',   sprite: '🧔🏽🕌', color: '#4caf50', rank: 2 }, // Pakistani
]

// Equal 1/3 odds for who drives.
function rollDriver(): Driver {
  return DRIVERS[Math.floor(Math.random() * DRIVERS.length)]
}

const STRIP_SIZE = 60
const WINNER_POS = 6
const ITEM_W = 80 // matches strip card `w-20` (80px) — must stay in sync for centering
const ITEM_GAP = 8

function buildStrip(winner: Driver) {
  const strip = Array.from({ length: STRIP_SIZE }, () => rollDriver())
  strip[STRIP_SIZE - WINNER_POS] = winner
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

// Big cinematic reveal for the chosen driver
function playReveal(ctx: AudioContext) {
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

// Pre-spin tension buildup
function playTensionBuild(ctx: AudioContext) {
  const drone = ctx.createOscillator(); const dg = ctx.createGain()
  drone.connect(dg); dg.connect(ctx.destination)
  drone.type = 'sine'
  drone.frequency.setValueAtTime(70, ctx.currentTime)
  drone.frequency.linearRampToValueAtTime(120, ctx.currentTime + 3.5)
  dg.gain.setValueAtTime(0, ctx.currentTime)
  dg.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.5)
  dg.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3.2)
  dg.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.8)
  drone.start(); drone.stop(ctx.currentTime + 3.8)

  const sweep = ctx.createOscillator(); const swg = ctx.createGain()
  sweep.connect(swg); swg.connect(ctx.destination)
  sweep.type = 'sawtooth'
  sweep.frequency.setValueAtTime(120, ctx.currentTime + 3.0)
  sweep.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 3.9)
  swg.gain.setValueAtTime(0, ctx.currentTime + 3.0)
  swg.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 3.3)
  swg.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.9)
  sweep.start(ctx.currentTime + 3.0); sweep.stop(ctx.currentTime + 3.9)
}

function makeParticles(count: number, color: string) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.random() - 0.5) * 1.4
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

export default function FishingCaseOpenPage() {
  const [winner, setWinner] = useState<Driver | null>(null)
  const [strip, setStrip] = useState<Driver[]>([])
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'reveal'>('idle')
  const [translateX, setTranslateX] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [flash, setFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pointerThunk, setPointerThunk] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (tickIntervalRef.current) clearInterval(tickIntervalRef.current) }
  }, [])

  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  const spin = () => {
    if (phase === 'spinning') return
    const chosen = rollDriver()
    const newStrip = buildStrip(chosen)

    setStrip(newStrip)
    setWinner(null)
    setTranslateX(0)
    setAnimating(false)
    setPhase('spinning')

    const ctx = getAudioCtx()
    void ctx.resume()
    playTensionBuild(ctx)

    let tickCount = 0
    const maxTicks = 30
    tickIntervalRef.current = setInterval(() => {
      playTick(ctx)
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
          playReveal(ctx)
          setFlash(true); setTimeout(() => setFlash(false), 750)
          setPointerThunk(true); setTimeout(() => setPointerThunk(false), 420)
          setWinner(chosen)
          setPhase('reveal')
          setAnimating(false)
          setShaking(false)
        }, 4200)
      })
    })
  }

  const reset = () => {
    setPhase('idle')
    setStrip([])
    setWinner(null)
  }

  const shareText = [
    '🎣 Fishing Trip Driver Roll',
    winner ? `${winner.sprite} ${winner.name} is driving!` : '',
    '',
    'https://jimsengdle.vercel.app/',
  ].join('\n')

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { prompt('Copy result:', shareText) }
  }

  const ambientColor = winner?.color ?? '#4caf50'

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
          style={{ background: `radial-gradient(circle, #2196f3, transparent 65%)`, animationDelay: '-8s', animationDuration: '32s' }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Screen flash on reveal */}
      {flash && (
        <div className="screen-flash fixed inset-0 z-40 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${winner?.color}cc, transparent 70%)` }} />
      )}

      <div className="w-full max-w-lg flex flex-col gap-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between fade-up">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎣</span>
              <h1 className="text-white font-black text-2xl tracking-tight">Fishing Driver</h1>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">Spin to decide who drives · 1-in-3 each</p>
          </div>
        </div>

        {/* Contestants */}
        <div className="flex gap-2 fade-up" style={{ animationDelay: '60ms' }}>
          {DRIVERS.map((d) => {
            const isWinner = winner?.name === d.name
            return (
              <div
                key={d.name}
                className="flex-1 rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all duration-500"
                style={{
                  borderColor: isWinner ? d.color : d.color + '40',
                  background: `linear-gradient(160deg, ${d.color}${isWinner ? '33' : '14'}, ${d.color}08)`,
                  boxShadow: isWinner ? `0 0 24px -4px ${d.color}aa` : 'none',
                  opacity: winner && !isWinner ? 0.4 : 1,
                }}
              >
                <span className="text-2xl leading-none">{d.sprite}</span>
                <p className="text-xs font-bold" style={{ color: d.color }}>{d.name}</p>
              </div>
            )
          })}
        </div>

        {/* ── Idle case (before spinning, no strip yet) ── */}
        {phase === 'idle' && strip.length === 0 && (
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
                <span className="text-3xl">🚗</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Slider (during/after spinning) ── */}
        {(phase !== 'idle' || strip.length > 0) && (
          <div className="relative">
            <div
              ref={containerRef}
              className={`w-full overflow-hidden rounded-2xl border bg-black/60 backdrop-blur-sm ${shaking ? 'case-shake' : ''}`}
              style={{ height: 108, borderColor: phase === 'reveal' && winner ? `${winner.color}80` : '#27272a', boxShadow: phase === 'reveal' && winner ? `0 0 40px -8px ${winner.color}66` : 'none', transition: 'border-color 0.4s, box-shadow 0.4s' }}
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
                  {strip.map((d, i) => (
                    <div
                      key={i}
                      className="shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border relative overflow-hidden"
                      style={{
                        background: `linear-gradient(160deg, ${d.color}26, ${d.color}08)`,
                        borderColor: d.color + '55',
                        boxShadow: `inset 0 1px 0 ${d.color}33`,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: d.color }} />
                      <span className="text-2xl leading-none">{d.sprite}</span>
                      <p className="text-[10px] font-bold text-center leading-tight px-1" style={{ color: d.color }}>{d.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-700 text-sm">Press Spin to roll</p>
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
        {phase === 'reveal' && winner && (
          <RevealCard winner={winner} />
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={phase === 'reveal' ? reset : spin}
            disabled={phase === 'spinning'}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden ${phase === 'idle' ? 'cta-pulse' : ''}`}
            style={{ background: 'linear-gradient(135deg, #4caf50, #2e7d32)', color: 'rgba(255,255,255,0.95)' }}
          >
            {phase === 'idle' && 'Spin the Driver'}
            {phase === 'spinning' && (
              <span className="inline-flex items-center gap-2">
                Rolling
                <span className="inline-flex gap-0.5">
                  {[0,1,2].map(d => <span key={d} className="w-1 h-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />)}
                </span>
              </span>
            )}
            {phase === 'reveal' && 'Spin again →'}
          </button>
          {phase === 'reveal' && winner && (
            <button
              onClick={handleShare}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-zinc-300 bg-zinc-900/60 border border-zinc-800 hover:text-white hover:border-zinc-700 transition-all"
            >
              {copied ? 'Copied! ✓' : 'Share result'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

// ── Reveal card with halo, particles, confetti ──
function RevealCard({ winner }: { winner: Driver }) {
  const [particles] = useState(() => makeParticles(26, winner.color))
  const [confetti] = useState(() => makeConfetti(36, [winner.color, '#ffffff', '#f5d572']))

  return (
    <div className="reveal-pop relative rounded-2xl border p-5 overflow-hidden" style={{ borderColor: winner.color + '80', background: `linear-gradient(160deg, ${winner.color}26, ${winner.color}0a)`, boxShadow: `0 0 50px -10px ${winner.color}88, inset 0 1px 0 ${winner.color}33` }}>
      {/* conic light sweep */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="conic-spin w-[140%] h-[300%] opacity-20" style={{ background: `conic-gradient(from 0deg, transparent, ${winner.color}, transparent 25%, transparent, ${winner.color}, transparent 75%)` }} />
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

      {/* confetti burst */}
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
          <div className="halo-pulse absolute inset-0 rounded-full blur-md" style={{ background: winner.color, transform: 'scale(1.4)' }} />
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${winner.color}, ${winner.color}cc)`, boxShadow: `0 0 24px ${winner.color}` }}>
            {winner.sprite}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5" style={{ color: `${winner.color}cc` }}>Designated Driver</p>
          <p className="font-black text-2xl leading-none text-glow" style={{ color: winner.color }}>{winner.name}</p>
          <p className="text-zinc-400 text-xs mt-1.5">is driving to the fishing trip 🎣</p>
        </div>
      </div>
    </div>
  )
}
