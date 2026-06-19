'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { CLIP_DURATIONS } from '@/lib/deezer'

interface Challenge {
  id: string
  genre: string
  trackName: string
  artistName: string
  previewUrl: string // stores YouTube video ID
  spotifyTrackId: string // stores iTunes track ID for matching
}

interface SearchResult {
  id: number
  name: string
  artist: string
}

type GameStatus = 'playing' | 'won' | 'lost'

interface SongGameProps {
  challenge: Challenge
  existingResult: { guesses: string[]; solved: boolean; attemptsUsed: number } | null
  onComplete?: () => void
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

export default function SongGame({ challenge, existingResult, onComplete }: SongGameProps) {
  const [guesses, setGuesses] = useState<string[]>(existingResult?.guesses ?? [])
  const [status, setStatus] = useState<GameStatus>(() => {
    if (existingResult?.solved) return 'won'
    if (existingResult && !existingResult.solved && existingResult.attemptsUsed >= CLIP_DURATIONS.length) return 'lost'
    return 'playing'
  })
  const [clipIndex, setClipIndex] = useState(existingResult?.attemptsUsed ?? 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedTrack, setSelectedTrack] = useState<SearchResult | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)

  const playerRef = useRef<YTPlayer | null>(null)
  const playerDivRef = useRef<HTMLDivElement>(null)
  const clipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameStartRef = useRef<number | null>(null)
  const displayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clipDuration = CLIP_DURATIONS[Math.min(clipIndex, CLIP_DURATIONS.length - 1)]

  useEffect(() => {
    let destroyed = false
    loadYouTubeAPI().then(() => {
      if (destroyed || !playerDivRef.current) return
      playerRef.current = new window.YT!.Player(playerDivRef.current, {
        videoId: challenge.previewUrl,
        width: 1,
        height: 1,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, iv_load_policy: 3, modestbranding: 1 },
        events: {
          onReady: () => { if (!destroyed) setPlayerReady(true) },
        },
      })
    })
    return () => {
      destroyed = true
      if (clipTimerRef.current) clearInterval(clipTimerRef.current)
      if (displayTimerRef.current) clearInterval(displayTimerRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [challenge.previewUrl])

  const stopClip = useCallback(() => {
    if (clipTimerRef.current) { clearInterval(clipTimerRef.current); clipTimerRef.current = null }
    playerRef.current?.pauseVideo()
    playerRef.current?.seekTo(0, true)
    setIsPlaying(false)
  }, [])

  const playClip = useCallback(() => {
    if (!playerRef.current || !playerReady || isPlaying) return
    if (!gameStartRef.current) {
      gameStartRef.current = Date.now()
      displayTimerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - gameStartRef.current!)
      }, 1000)
    }
    setIsPlaying(true)
    playerRef.current.seekTo(0, true)
    playerRef.current.playVideo()

    clipTimerRef.current = setInterval(() => {
      const current = playerRef.current?.getCurrentTime() ?? 0
      if (current >= clipDuration) stopClip()
    }, 50)
  }, [playerReady, isPlaying, clipDuration, stopClip])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setSelectedTrack(null)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.trim().length < 2) { setSearchResults([]); setShowDropdown(false); return }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(value)}`)
        const data = await res.json() as { tracks?: SearchResult[] }
        setSearchResults(data.tracks ?? [])
        setShowDropdown(true)
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 300)
  }, [])

  const selectTrack = (track: SearchResult) => {
    setSelectedTrack(track)
    setQuery(`${track.name} — ${track.artist}`)
    setShowDropdown(false)
  }

  const advance = useCallback((newGuesses: string[], won: boolean) => {
    const nextIndex = newGuesses.length
    if (won) {
      if (displayTimerRef.current) { clearInterval(displayTimerRef.current); displayTimerRef.current = null }
      setStatus('won')
      saveResult(newGuesses, true, newGuesses.length)
      setTimeout(() => onComplete?.(), 2000)
    } else if (nextIndex >= CLIP_DURATIONS.length) {
      if (displayTimerRef.current) { clearInterval(displayTimerRef.current); displayTimerRef.current = null }
      setStatus('lost')
      saveResult(newGuesses, false, newGuesses.length)
      setTimeout(() => onComplete?.(), 2000)
    } else {
      setClipIndex(nextIndex)
    }
  }, [onComplete])

  const skip = () => {
    if (status !== 'playing') return
    const newGuesses = [...guesses, '']
    setGuesses(newGuesses)
    advance(newGuesses, false)
  }

  const submitGuess = async () => {
    if (!selectedTrack || status !== 'playing' || submitting) return
    setSubmitting(true)
    const isCorrect = String(selectedTrack.id) === challenge.spotifyTrackId
    const label = `${selectedTrack.name} — ${selectedTrack.artist}`
    const newGuesses = [...guesses, label]
    setGuesses(newGuesses)
    setQuery(''); setSelectedTrack(null); setSearchResults([])
    advance(newGuesses, isCorrect)
    setSubmitting(false)
  }

  const saveResult = async (g: string[], solved: boolean, attempts: number) => {
    const timeTakenMs = gameStartRef.current ? Date.now() - gameStartRef.current : undefined
    await fetch('/api/game/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: challenge.id, guesses: g, solved, attemptsUsed: attempts, timeTakenMs }),
    })
  }

  const isIdle = status === 'playing' && playerReady && !isPlaying

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {/* Hidden YouTube player — must be off-screen at real size for YT to initialize */}
      <div ref={playerDivRef} style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '320px', height: '180px' }} aria-hidden />

      {/* Guess rows */}
      <div className="w-full flex flex-col gap-1.5">
        {CLIP_DURATIONS.map((dur, i) => {
          const guess = guesses[i]
          const isCorrect = status === 'won' && i === guesses.length - 1
          const isSkipped = guess === ''

          if (guess === undefined) {
            return (
              <div key={dur} className="w-full h-11 rounded-xl px-3 flex items-center border border-zinc-800/70 bg-zinc-900/20">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((d) => <div key={d} className="w-1 h-1 rounded-full bg-zinc-800" />)}
                </div>
              </div>
            )
          }
          if (isSkipped) {
            return (
              <div key={dur} className="w-full h-11 rounded-xl px-3 flex items-center border border-zinc-800 bg-zinc-900/30 guess-enter">
                <span className="text-xs tracking-[0.18em] text-zinc-700 font-medium">SKIP</span>
              </div>
            )
          }
          if (isCorrect) {
            return (
              <div
                key={dur}
                className="w-full h-11 rounded-xl px-3 flex items-center gap-2 border text-sm font-medium guess-enter"
                style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }}
              >
                <span style={{ color: 'var(--accent)' }} className="text-xs">✓</span>
                <span className="text-white truncate">{guess}</span>
              </div>
            )
          }
          return (
            <div
              key={dur}
              className="w-full h-11 rounded-xl px-3 flex items-center text-sm border border-red-900/25 bg-red-950/8 text-zinc-600 line-through guess-enter"
            >
              <span className="truncate">{guess}</span>
            </div>
          )
        })}
      </div>

      {/* Result banner */}
      {status === 'won' && (
        <div
          className="w-full text-center py-3 px-4 rounded-xl border"
          style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent)' }}
        >
          <p className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Got it in {guesses.length}!</p>
          <p className="text-zinc-400 text-sm mt-0.5">{challenge.trackName} — {challenge.artistName}</p>
        </div>
      )}
      {status === 'lost' && (
        <div className="w-full text-center py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">The answer was</p>
          <p className="text-white font-bold text-lg leading-tight">{challenge.trackName}</p>
          <p className="text-zinc-500 text-sm">{challenge.artistName}</p>
        </div>
      )}

      {/* Progress + timer row */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-600 text-xs font-mono">
            {clipDuration < 1 ? `${clipDuration * 1000}ms` : `${clipDuration}s`}
          </span>
          {gameStartRef.current !== null && status === 'playing' && (
            <span className="text-zinc-700 text-xs font-mono tabular-nums">
              {String(Math.floor(elapsedMs / 60000)).padStart(2, '0')}:{String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0')}
            </span>
          )}
        </div>
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5">
          {CLIP_DURATIONS.map((dur, i) => (
            <div
              key={dur}
              style={{
                flex: dur,
                backgroundColor:
                  i < clipIndex ? '#3f3f46'
                  : i === clipIndex ? 'var(--accent)'
                  : 'transparent',
              }}
              className="h-full rounded-full transition-colors"
            />
          ))}
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={playClip}
        disabled={isPlaying || !playerReady || status !== 'playing'}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 mt-1 ${
          isIdle ? 'play-idle hover:scale-105 active:scale-95' : 'hover:scale-105 active:scale-95 disabled:cursor-not-allowed'
        }`}
        style={{
          backgroundColor: isIdle || isPlaying ? 'var(--accent)' : '#18181b',
          boxShadow: isIdle ? '0 0 28px var(--accent-glow)' : 'none',
        }}
      >
        {!playerReady ? (
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
        ) : isPlaying ? (
          <span className="flex gap-0.5 items-end h-5">
            {[4, 7, 5, 8, 4].map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full animate-pulse"
                style={{ height: `${h * 2}px`, animationDelay: `${i * 80}ms`, backgroundColor: 'rgba(0,0,0,0.65)' }}
              />
            ))}
          </span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(0,0,0,0.7)" className="ml-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

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
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-white placeholder-zinc-700 outline-none focus:border-zinc-600 text-sm transition-colors"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              )}
            </div>
            <button
              onClick={skip}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-sm font-medium rounded-xl border border-zinc-800 transition-colors whitespace-nowrap"
            >
              Skip
            </button>
          </div>

          <button
            onClick={submitGuess}
            disabled={!selectedTrack || submitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={selectedTrack ? {
              backgroundColor: 'var(--accent)',
              color: 'rgba(0,0,0,0.75)',
            } : {
              backgroundColor: '#18181b',
              color: '#52525b',
              cursor: 'not-allowed',
            }}
          >
            Submit
          </button>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-12 w-[calc(100%-5.5rem)] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-10 shadow-2xl shadow-black/60">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  className="w-full px-3 py-2.5 text-left hover:bg-zinc-800/80 transition-colors border-b border-zinc-800/50 last:border-0"
                >
                  <p className="text-white text-sm leading-tight">{track.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{track.artist}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
