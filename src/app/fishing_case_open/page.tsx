'use client'

import { useEffect, useRef, useState } from 'react'

interface Driver {
  name: string
  sprite: string
  flag: string
  origin: string
  ride: string // stereotype car, printed on the ticket
  color: string
}

const DRIVERS: Driver[] = [
  { name: 'Kirby',  sprite: '👲', flag: '🇨🇳', origin: 'Guangzhou', ride: 'BYD Seal',        color: '#d4453a' },
  { name: 'Daniel', sprite: '🧔🏽‍♂️', flag: '🇮🇳', origin: 'Mumbai',    ride: 'Tata Nano',       color: '#e08a1e' },
  { name: 'Omer',   sprite: '🧔🏽', flag: '🇵🇰', origin: 'Lahore',    ride: 'Suzuki Mehran',   color: '#1f8a4c' },
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
    '━━ FISHING TRIP · DRIVER DRAW ━━',
    winner ? `${winner.flag}  ${winner.name.toUpperCase()} drives. (${winner.ride})` : '',
    'odds were 1 in 3. no appeals.',
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

  const ambientColor = winner?.color ?? '#3a6f4f'

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 2.5rem)',
        paddingTop: 'max(env(safe-area-inset-top), 2.5rem)',
        background: '#0c0f0d',
      }}
    >
      {/* Murky water depth + paper grain, no neon blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% -10%, #16201b 0%, #0c0f0d 55%, #070908 100%)' }} />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div className="absolute inset-x-0 bottom-0 h-24 opacity-30" style={{ background: 'linear-gradient(to top, #0a1310, transparent)' }} />
      </div>

      {flash && (
        <div className="screen-flash fixed inset-0 z-40 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${winner?.color}aa, transparent 70%)` }} />
      )}

      {/* The ticket */}
      <div
        className="w-full max-w-md flex flex-col relative z-10 fade-up"
        style={{
          background: 'linear-gradient(180deg, #f4efe2 0%, #ece4d2 100%)',
          color: '#1c2220',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.8), 0 2px 0 rgba(255,255,255,0.4) inset',
          // torn-ticket perforated top & bottom edges
          clipPath: 'polygon(0% 6px, 3% 0, 6% 6px, 9% 0, 12% 6px, 15% 0, 18% 6px, 21% 0, 24% 6px, 27% 0, 30% 6px, 33% 0, 36% 6px, 39% 0, 42% 6px, 45% 0, 48% 6px, 51% 0, 54% 6px, 57% 0, 60% 6px, 63% 0, 66% 6px, 69% 0, 72% 6px, 75% 0, 78% 6px, 81% 0, 84% 6px, 87% 0, 90% 6px, 93% 0, 96% 6px, 99% 0, 100% 6px, 100% calc(100% - 6px), 97% 100%, 94% calc(100% - 6px), 91% 100%, 88% calc(100% - 6px), 85% 100%, 82% calc(100% - 6px), 79% 100%, 76% calc(100% - 6px), 73% 100%, 70% calc(100% - 6px), 67% 100%, 64% calc(100% - 6px), 61% 100%, 58% calc(100% - 6px), 55% 100%, 52% calc(100% - 6px), 49% 100%, 46% calc(100% - 6px), 43% 100%, 40% calc(100% - 6px), 37% 100%, 34% calc(100% - 6px), 31% 100%, 28% calc(100% - 6px), 25% 100%, 22% calc(100% - 6px), 19% 100%, 16% calc(100% - 6px), 13% 100%, 10% calc(100% - 6px), 7% 100%, 4% calc(100% - 6px), 1% 100%, 0 calc(100% - 6px))',
        }}
      >
        <div className="px-6 pt-7 pb-6 flex flex-col gap-5 font-mono">
          {/* Masthead */}
          <header className="text-center">
            <p className="text-[10px] tracking-[0.45em] text-[#7a6a4d] font-bold">BAIT &amp; TACKLE CO.</p>
            <h1 className="text-2xl font-black tracking-tight leading-none mt-1" style={{ fontFamily: 'Georgia, serif' }}>
              Who&apos;s Driving?
            </h1>
            <p className="text-[11px] text-[#5c5240] mt-1.5">designated-driver draw · 1 in 3 · binding</p>
            <div className="mt-3 border-t border-dashed border-[#b8ac90]" />
          </header>

          {/* Roster */}
          <div className="grid grid-cols-3 gap-px bg-[#cabf9f] border border-[#cabf9f]">
            {DRIVERS.map((d) => {
              const isWinner = winner?.name === d.name
              const dimmed = winner && !isWinner
              return (
                <div
                  key={d.name}
                  className="flex flex-col items-center gap-1 py-3 px-1 transition-all duration-500 relative"
                  style={{
                    background: isWinner ? d.color : '#f4efe2',
                    color: isWinner ? '#fff' : '#1c2220',
                    opacity: dimmed ? 0.45 : 1,
                  }}
                >
                  <span className="text-2xl leading-none grayscale-[0.15]">{d.sprite}</span>
                  <span className="text-[11px] font-bold tracking-wide uppercase">{d.name}</span>
                  <span className="text-[8px] tracking-widest" style={{ color: isWinner ? '#ffffffcc' : '#8a7c5e' }}>{d.flag} {d.origin}</span>
                  {isWinner && <span className="absolute -top-px -right-px text-[7px] font-black bg-[#1c2220] text-[#f4efe2] px-1 py-0.5 tracking-widest">DRIVES</span>}
                </div>
              )
            })}
          </div>

          {/* ── Idle: stamped "PULL TAB" prompt ── */}
          {phase === 'idle' && strip.length === 0 && (
            <div className="relative h-28 flex items-center justify-center">
              <div
                className="case-float border-[3px] border-[#1c2220] px-6 py-3 -rotate-3"
                style={{ boxShadow: '4px 4px 0 #1c222033' }}
              >
                <p className="text-[10px] tracking-[0.3em] text-[#5c5240] font-bold text-center">PULL TAB TO</p>
                <p className="text-xl font-black tracking-tight text-center" style={{ fontFamily: 'Georgia, serif' }}>DRAW LOTS</p>
              </div>
            </div>
          )}

        {/* ── Reel (during/after spinning): looks like a paper draw strip ── */}
        {(phase !== 'idle' || strip.length > 0) && (
          <div className="relative">
            <div
              ref={containerRef}
              className={`w-full overflow-hidden border-y-2 border-[#1c2220] ${shaking ? 'case-shake' : ''}`}
              style={{ height: 104, background: '#e3dac3' }}
            >
              {/* edge fades to paper */}
              <div className="absolute left-0 top-0 bottom-0 w-14 z-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, #e3dac3, transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-14 z-20 pointer-events-none" style={{ background: 'linear-gradient(270deg, #e3dac3, transparent)' }} />

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
                      className="shrink-0 w-20 h-[78px] flex flex-col items-center justify-center gap-0.5 relative border-2 border-[#1c2220]"
                      style={{ background: '#f4efe2', boxShadow: '2px 2px 0 #1c222022' }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: d.color }} />
                      <span className="text-2xl leading-none mt-1 grayscale-[0.15]">{d.sprite}</span>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-[#1c2220]">{d.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#8a7c5e] font-mono text-sm">drawing…</p>
                </div>
              )}
            </div>
            {/* hand-pointer at the cut line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-0.5 bg-[#1c2220]/70 pointer-events-none z-30" />
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 text-base pointer-events-none z-30 ${pointerThunk ? 'pointer-thunk' : ''}`}>👇</div>
          </div>
        )}

        {/* ── Reveal stamp ── */}
        {phase === 'reveal' && winner && (
          <RevealCard winner={winner} />
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-1">
          <button
            onClick={phase === 'reveal' ? reset : spin}
            disabled={phase === 'spinning'}
            className="w-full py-3.5 font-mono font-black text-base tracking-[0.15em] uppercase transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#1c2220]"
            style={{ background: '#1c2220', color: '#f4efe2', boxShadow: phase === 'spinning' ? 'none' : '4px 4px 0 #1c222055' }}
          >
            {phase === 'idle' && 'Pull the Tab'}
            {phase === 'spinning' && (
              <span className="inline-flex items-center gap-2">
                Drawing
                <span className="inline-flex gap-0.5">
                  {[0,1,2].map(d => <span key={d} className="w-1 h-1 rounded-full bg-[#f4efe2]/80 animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />)}
                </span>
              </span>
            )}
            {phase === 'reveal' && 'Draw Again'}
          </button>
          {phase === 'reveal' && winner && (
            <button
              onClick={handleShare}
              className="w-full py-2.5 font-mono font-bold text-xs tracking-[0.2em] uppercase text-[#5c5240] border-2 border-dashed border-[#b8ac90] hover:text-[#1c2220] hover:border-[#1c2220] transition-all"
            >
              {copied ? '✓ Copied to clipboard' : 'Tear off receipt'}
            </button>
          )}
          <p className="text-center text-[9px] font-mono text-[#9a8d6e] tracking-[0.25em] pt-1">NO REFUNDS · NO APPEALS · KEEP TICKET</p>
        </div>
        </div>
      </div>
    </main>
  )
}

// ── Reveal card with halo, particles, confetti ──
function RevealCard({ winner }: { winner: Driver }) {
  const [confetti] = useState(() => makeConfetti(40, [winner.color, '#1c2220', '#7a6a4d']))

  return (
    <div className="reveal-pop relative overflow-hidden border-2 border-[#1c2220] px-5 py-4" style={{ background: '#f4efe2' }}>
      {/* paper confetti burst, no glow */}
      {confetti.length > 0 && (
        <div className="absolute top-1/2 left-1/2 pointer-events-none">
          {confetti.map((c) => (
            <span
              key={c.key}
              className="confetti absolute"
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

      <div className="relative z-10 flex items-center gap-4 font-mono">
        {/* ink stamp */}
        <div
          className="shrink-0 w-16 h-16 border-[3px] flex items-center justify-center text-3xl -rotate-6"
          style={{ borderColor: winner.color, color: winner.color, boxShadow: `0 0 0 3px ${winner.color}22 inset` }}
        >
          {winner.sprite}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#7a6a4d]">— driver drawn —</p>
          <p className="font-black text-3xl leading-none tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#1c2220' }}>{winner.name}</p>
          <p className="text-[11px] mt-1.5 text-[#5c5240]">
            {winner.flag} drives the <span className="font-bold text-[#1c2220]">{winner.ride}</span>. fuel&apos;s on him.
          </p>
        </div>
      </div>
    </div>
  )
}
