'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { CLIP_DURATIONS, CATEGORY_REVEAL_CLIP, searchTracks, isCorrectGuess, type Song, type SearchResult } from '@/lib/songs'

type GameStatus = 'playing' | 'won' | 'lost'

export interface SongResult {
  guesses: string[]
  solved: boolean
  attemptsUsed: number
}

interface SongGameProps {
  song: Song
  index: number
  total: number
  onResult: (result: SongResult) => void
}

const EQ_BARS = 28

export default function SongGame({ song, index, total, onResult }: SongGameProps) {
  const [guesses, setGuesses] = useState<string[]>([])
  const [status, setStatus] = useState<GameStatus>('playing')
  const [clipIndex, setClipIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedTrack, setSelectedTrack] = useState<SearchResult | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [playProgress, setPlayProgress] = useState(0) // 0-1 within current clip
  const [levels, setLevels] = useState<number[]>(() => new Array(EQ_BARS).fill(0.05))
  const [energy, setEnergy] = useState(0) // 0-1 overall loudness for stage glow

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Web Audio analyser graph (built lazily on first play)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const freqDataRef = useRef<Uint8Array | null>(null)

  const clipDuration = CLIP_DURATIONS[Math.min(clipIndex, CLIP_DURATIONS.length - 1)]
  const clipDurationRef = useRef(clipDuration)
  clipDurationRef.current = clipDuration

  const graphFailedRef = useRef(false)

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current
    if (!audio || graphFailedRef.current) return
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new Ctx()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.75
        const source = ctx.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(ctx.destination)
        audioCtxRef.current = ctx
        analyserRef.current = analyser
        sourceRef.current = source
        freqDataRef.current = new Uint8Array(analyser.frequencyBinCount)
      } catch {
        // Visualizer is non-essential — fall back to plain playback if the
        // audio graph can't be built (e.g. CORS-tainted media element).
        graphFailedRef.current = true
        return
      }
    }
    void audioCtxRef.current?.resume()
  }, [])

  const resetVisuals = useCallback(() => {
    setLevels(new Array(EQ_BARS).fill(0.05))
    setEnergy(0)
  }, [])

  const stopClip = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    setIsPlaying(false)
    setIsFading(true)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    fadeTimerRef.current = setTimeout(() => {
      setIsFading(false)
      setPlayProgress(0)
      resetVisuals()
    }, 800)
  }, [resetVisuals])

  useEffect(() => () => {
    stopClip()
    void audioCtxRef.current?.close()
  }, [stopClip])

  const playClip = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isPlaying || status !== 'playing') return
    ensureGraph()
    setIsPlaying(true)
    setPlayProgress(0)
    audio.currentTime = 0
    // Resume AudioContext first (required on iOS — user gesture unlocks it once,
    // but the context starts suspended so we must resume before playing).
    const resume = audioCtxRef.current ? audioCtxRef.current.resume() : Promise.resolve()
    void resume.then(() => audio.play())

    const analyser = analyserRef.current
    const freq = freqDataRef.current

    const tick = () => {
      const elapsed = audio.currentTime
      setPlayProgress(Math.min(elapsed / clipDurationRef.current, 1))

      if (analyser && freq) {
        analyser.getByteFrequencyData(freq as Uint8Array<ArrayBuffer>)
        const bins = freq.length
        // Map FFT bins → display bars (mirror low→high for a centered look)
        const half = Math.floor(EQ_BARS / 2)
        const next = new Array(EQ_BARS).fill(0)
        let sum = 0
        for (let i = 0; i < half; i++) {
          const v = (freq[Math.min(i, bins - 1)] / 255)
          const eased = Math.pow(v, 1.4)
          next[half + i] = Math.max(0.05, eased)
          next[half - 1 - i] = Math.max(0.05, eased)
          sum += v
        }
        setLevels(next)
        setEnergy(Math.min(1, (sum / half) * 1.6))
      }

      if (elapsed >= clipDurationRef.current) { stopClip(); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [isPlaying, status, stopClip, ensureGraph])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setSelectedTrack(null)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.trim().length < 2) { setSearchResults([]); setShowDropdown(false); return }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const tracks = await searchTracks(value)
        setSearchResults(tracks)
        setShowDropdown(true)
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 300)
  }, [])

  const selectTrack = (track: SearchResult) => {
    setSelectedTrack(track)
    setQuery(`${track.name} - ${track.artist}`)
    setShowDropdown(false)
  }

  const finish = useCallback((newGuesses: string[], won: boolean) => {
    stopClip()
    setStatus(won ? 'won' : 'lost')
    setTimeout(() => onResult({ guesses: newGuesses, solved: won, attemptsUsed: newGuesses.length }), 1800)
  }, [onResult, stopClip])

  const advance = useCallback((newGuesses: string[], won: boolean) => {
    if (won || newGuesses.length >= CLIP_DURATIONS.length) {
      finish(newGuesses, won)
    } else {
      setClipIndex(newGuesses.length)
    }
  }, [finish])

  const skip = () => {
    if (status !== 'playing') return
    const newGuesses = [...guesses, '']
    setGuesses(newGuesses)
    advance(newGuesses, false)
  }

  const submitGuess = () => {
    if (!selectedTrack || status !== 'playing') return
    const correct = isCorrectGuess(selectedTrack, song)
    const label = `${selectedTrack.name} - ${selectedTrack.artist}`
    const newGuesses = [...guesses, label]
    setGuesses(newGuesses)
    setQuery(''); setSelectedTrack(null); setSearchResults([])
    advance(newGuesses, correct)
  }

  const isIdle = status === 'playing' && !isPlaying

  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-lg mx-auto relative">
      <audio ref={audioRef} src={song.previewUrl} preload="auto" crossOrigin="anonymous" />

      {/* Reactive stage glow behind everything */}
      <div className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div
          className={`w-[80vmax] h-[80vmax] rounded-full blur-[120px] ${isPlaying ? 'transition-opacity duration-300 stage-pulse' : 'transition-opacity duration-700'}`}
          style={{
            background: 'radial-gradient(circle, var(--accent), transparent 60%)',
            opacity: isPlaying ? 0.08 + energy * 0.22 : isFading ? 0.02 : 0.05,
            transform: `scale(${1 + energy * 0.15})`,
          }}
        />
      </div>

      <p className="text-zinc-700 text-xs uppercase tracking-[0.2em] self-start">
        Song {index + 1} <span className="text-zinc-800">/ {total}</span>
      </p>

      {/* Guess rows */}
      <div className="w-full flex flex-col gap-1">
        {CLIP_DURATIONS.map((dur, i) => {
          const guess = guesses[i]
          const isCorrect = status === 'won' && i === guesses.length - 1
          const isSkipped = guess === ''

          if (guess === undefined) {
            const isNext = i === guesses.length && status === 'playing'
            return (
              <div
                key={dur}
                className="w-full h-8 rounded-lg px-3 flex items-center border bg-zinc-900/20 transition-all"
                style={{
                  borderColor: isNext ? 'rgba(255,255,255,0.12)' : 'rgba(39,39,42,0.55)',
                  boxShadow: isNext ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      className="w-1 h-1 rounded-full"
                      style={{ background: isNext ? 'var(--accent)' : '#3f3f46', opacity: isNext ? 0.6 : 1 }}
                    />
                  ))}
                </div>
              </div>
            )
          }
          if (isSkipped) {
            return (
              <div key={dur} className="w-full h-8 rounded-lg px-3 flex items-center border border-zinc-800 bg-zinc-900/30 guess-enter">
                <span className="text-xs tracking-[0.18em] text-zinc-700 font-medium">SKIP</span>
              </div>
            )
          }
          if (isCorrect) {
            return (
              <div
                key={dur}
                className="correct-sweep w-full h-8 rounded-lg px-3 flex items-center gap-2 border text-sm font-medium guess-enter"
                style={{ borderColor: 'var(--accent)', boxShadow: '0 0 20px -4px var(--accent-glow)' }}
              >
                <span style={{ color: 'var(--accent)' }} className="text-sm">✓</span>
                <span className="text-white truncate">{guess}</span>
              </div>
            )
          }
          return (
            <div
              key={dur}
              className="w-full h-8 rounded-lg px-3 flex items-center gap-2 text-sm border border-red-900/30 bg-red-950/10 text-zinc-600 line-through guess-enter"
            >
              <span className="text-red-900/70 not-italic no-underline">✕</span>
              <span className="truncate">{guess}</span>
            </div>
          )
        })}
      </div>

      {/* Result banners */}
      {status === 'won' && (
        <div
          className="win-pop relative w-full text-center py-4 px-4 rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent)', boxShadow: '0 0 40px -8px var(--accent-glow)' }}
        >
          {/* floating notes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {['♪','♫','♩','♬','♪','♫'].map((n, i) => (
              <span
                key={i}
                className="note-float absolute bottom-2 text-lg"
                style={{
                  left: `${12 + i * 14}%`,
                  color: 'var(--accent)',
                  ['--n-drift' as string]: `${(i % 2 ? 1 : -1) * (10 + i * 6)}px`,
                  ['--n-rot' as string]: `${(i % 2 ? 1 : -1) * 30}deg`,
                  ['--n-delay' as string]: `${i * 0.18}s`,
                  ['--n-dur' as string]: `${2 + (i % 3) * 0.5}s`,
                }}
              >{n}</span>
            ))}
          </div>
          <p className="relative font-black text-2xl" style={{ color: 'var(--accent)' }}>Got it in {guesses.length}! 🎉</p>
          <p className="relative text-zinc-300 text-sm mt-1">{song.name} <span className="text-zinc-500">- {song.artist}</span></p>
        </div>
      )}
      {status === 'lost' && (
        <div className="loss-in w-full text-center py-4 px-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1.5">The answer was</p>
          <p className="text-white font-black text-xl leading-tight">{song.name}</p>
          <p className="text-zinc-500 text-sm mt-0.5">{song.artist}</p>
        </div>
      )}

      {/* Category reveal */}
      {clipIndex >= CATEGORY_REVEAL_CLIP && status === 'playing' && (
        <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/40 guess-enter">
          <span className="text-zinc-600 text-xs uppercase tracking-widest">Category</span>
          <span className="text-white text-xs font-semibold">{song.category}</span>
        </div>
      )}

      {/* Live equalizer visualizer */}
      <div className="w-full flex items-end justify-center gap-[2px] h-8 px-1">
        {levels.map((lvl, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full ${isPlaying ? 'transition-[height] duration-75 eq-bar' : 'transition-[height,opacity,background] duration-700'}`}
            style={{
              height: `${6 + lvl * 92}%`,
              maxWidth: 7,
              background: isPlaying
                ? `linear-gradient(to top, var(--accent), ${lvl > 0.6 ? '#fef08a' : 'var(--accent-hover)'})`
                : isFading ? `linear-gradient(to top, var(--accent), var(--accent-hover))` : '#27272a',
              boxShadow: isPlaying && lvl > 0.3 ? `0 0 8px var(--accent-glow)` : 'none',
              opacity: isPlaying ? 0.5 + lvl * 0.5 : isFading ? 0 : 0.5,
              ['--eq-dur' as string]: `${0.4 + (i % 5) * 0.08}s`,
              ['--eq-delay' as string]: `${(i % 7) * 0.04}s`,
            }}
          />
        ))}
      </div>

      {/* Progress segments */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-zinc-600 text-xs font-mono">
            {clipDuration < 1 ? `${clipDuration * 1000}ms` : `${clipDuration}s`}
          </span>
          <span className="text-zinc-700 text-xs font-mono">{guesses.length}/{CLIP_DURATIONS.length} guesses</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5">
          {CLIP_DURATIONS.map((dur, i) => {
            const isActive = i === clipIndex
            const isPast = i < clipIndex
            return (
              <div key={dur} style={{ flex: dur, position: 'relative', overflow: 'hidden' }} className="h-full rounded-full">
                <div
                  className="absolute inset-0 transition-colors duration-200"
                  style={{ backgroundColor: isPast ? '#3f3f46' : isActive ? 'rgba(255,255,255,0.12)' : 'transparent' }}
                />
                {isActive && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: isPlaying ? `${playProgress * 100}%` : '0%',
                      backgroundColor: 'var(--accent)',
                      boxShadow: '0 0 8px var(--accent-glow)',
                      transition: isPlaying ? 'none' : 'width 0.15s ease-out',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Play button with sonar rings */}
      <div className="relative flex items-center justify-center">
        {isPlaying && (
          <>
            <span className="sonar-ring absolute inset-0 rounded-full border" style={{ borderColor: 'var(--accent)' }} />
            <span className="sonar-ring absolute inset-0 rounded-full border" style={{ borderColor: 'var(--accent)', animationDelay: '0.5s' }} />
            <span className="sonar-ring absolute inset-0 rounded-full border" style={{ borderColor: 'var(--accent)', animationDelay: '1s' }} />
          </>
        )}
        <button
          onClick={playClip}
          disabled={isPlaying || status !== 'playing'}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
            isIdle ? 'play-idle hover:scale-105 active:scale-95' : 'hover:scale-105 active:scale-95 disabled:cursor-not-allowed'
          }`}
          style={{
            background: isIdle || isPlaying ? 'radial-gradient(circle at 35% 30%, var(--accent-hover), var(--accent))' : '#18181b',
            boxShadow: isIdle ? '0 0 32px var(--accent-glow)' : isPlaying ? `0 0 ${20 + energy * 40}px var(--accent-glow)` : 'none',
          }}
        >
          {isPlaying ? (
            <span className="flex gap-0.5 items-end h-6">
              {[0,1,2,3,4].map((i) => (
                <span
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: `${20 + (levels[Math.floor(EQ_BARS/2) + i] ?? 0.3) * 60}%`,
                    background: 'rgba(0,0,0,0.7)',
                    transition: 'height 0.08s ease-out',
                  }}
                />
              ))}
            </span>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="rgba(0,0,0,0.75)" className="ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Search + Skip + Submit */}
      {status === 'playing' && (
        <div className="w-full flex flex-col gap-2 relative">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search a song…"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-white placeholder-zinc-700 outline-none focus:border-zinc-600 focus:bg-zinc-900 text-sm transition-all"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              )}
            </div>
            <button
              onClick={skip}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-sm font-medium rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all whitespace-nowrap active:scale-95"
            >
              Skip
            </button>
          </div>

          <button
            onClick={submitGuess}
            disabled={!selectedTrack}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            style={selectedTrack
              ? { background: 'linear-gradient(135deg, var(--accent-hover), var(--accent))', color: 'rgba(0,0,0,0.8)', boxShadow: '0 0 20px -6px var(--accent-glow)' }
              : { backgroundColor: '#18181b', color: '#52525b', cursor: 'not-allowed' }}
          >
            Submit guess
          </button>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden z-10 shadow-2xl shadow-black/60">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  className="w-full px-3 py-2.5 text-left hover:bg-zinc-800/80 transition-colors border-b border-zinc-800/50 last:border-0 flex items-center gap-2"
                >
                  <span className="text-zinc-700 text-xs">♪</span>
                  <span className="min-w-0">
                    <span className="block text-white text-sm leading-tight truncate">{track.name}</span>
                    <span className="block text-zinc-500 text-xs mt-0.5 truncate">{track.artist}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
