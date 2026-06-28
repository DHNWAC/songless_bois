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

export default function SongGame({ song, index, total, onResult }: SongGameProps) {
  const [guesses, setGuesses] = useState<string[]>([])
  const [status, setStatus] = useState<GameStatus>('playing')
  const [clipIndex, setClipIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedTrack, setSelectedTrack] = useState<SearchResult | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [playProgress, setPlayProgress] = useState(0) // 0-1 within current clip

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clipDuration = CLIP_DURATIONS[Math.min(clipIndex, CLIP_DURATIONS.length - 1)]
  const clipDurationRef = useRef(clipDuration)
  clipDurationRef.current = clipDuration

  const stopClip = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    setIsPlaying(false)
    setPlayProgress(0)
  }, [])

  useEffect(() => () => stopClip(), [stopClip])

  const playClip = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isPlaying || status !== 'playing') return
    setIsPlaying(true)
    setPlayProgress(0)
    audio.currentTime = 0
    void audio.play()

    const tick = () => {
      const elapsed = audio.currentTime
      setPlayProgress(Math.min(elapsed / clipDurationRef.current, 1))
      if (elapsed >= clipDurationRef.current) { stopClip(); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [isPlaying, status, stopClip])

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
    setQuery(`${track.name} — ${track.artist}`)
    setShowDropdown(false)
  }

  const finish = useCallback((newGuesses: string[], won: boolean) => {
    stopClip()
    setStatus(won ? 'won' : 'lost')
    setTimeout(() => onResult({ guesses: newGuesses, solved: won, attemptsUsed: newGuesses.length }), 1600)
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
    const label = `${selectedTrack.name} — ${selectedTrack.artist}`
    const newGuesses = [...guesses, label]
    setGuesses(newGuesses)
    setQuery(''); setSelectedTrack(null); setSearchResults([])
    advance(newGuesses, correct)
  }

  const isIdle = status === 'playing' && !isPlaying

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full max-w-lg mx-auto">
      <audio ref={audioRef} src={song.previewUrl} preload="auto" />

      <p className="text-zinc-700 text-xs uppercase tracking-[0.2em] self-start">
        Song {index + 1} <span className="text-zinc-800">/ {total}</span>
      </p>

      {/* Guess rows */}
      <div className="w-full flex flex-col gap-1.5">
        {CLIP_DURATIONS.map((dur, i) => {
          const guess = guesses[i]
          const isCorrect = status === 'won' && i === guesses.length - 1
          const isSkipped = guess === ''

          if (guess === undefined) {
            return (
              <div key={dur} className="w-full h-9 sm:h-11 rounded-xl px-3 flex items-center border border-zinc-800/70 bg-zinc-900/20">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((d) => <div key={d} className="w-1 h-1 rounded-full bg-zinc-800" />)}
                </div>
              </div>
            )
          }
          if (isSkipped) {
            return (
              <div key={dur} className="w-full h-9 sm:h-11 rounded-xl px-3 flex items-center border border-zinc-800 bg-zinc-900/30 guess-enter">
                <span className="text-xs tracking-[0.18em] text-zinc-700 font-medium">SKIP</span>
              </div>
            )
          }
          if (isCorrect) {
            return (
              <div
                key={dur}
                className="w-full h-9 sm:h-11 rounded-xl px-3 flex items-center gap-2 border text-sm font-medium guess-enter"
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
              className="w-full h-9 sm:h-11 rounded-xl px-3 flex items-center text-sm border border-red-900/25 bg-red-950/8 text-zinc-600 line-through guess-enter"
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
          <p className="text-zinc-400 text-sm mt-0.5">{song.name} — {song.artist}</p>
        </div>
      )}
      {status === 'lost' && (
        <div className="w-full text-center py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">The answer was</p>
          <p className="text-white font-bold text-lg leading-tight">{song.name}</p>
          <p className="text-zinc-500 text-sm">{song.artist}</p>
        </div>
      )}

      {/* Category reveal */}
      {clipIndex >= CATEGORY_REVEAL_CLIP && status === 'playing' && (
        <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <span className="text-zinc-600 text-xs uppercase tracking-widest">Category</span>
          <span className="text-white text-xs font-semibold">{song.category}</span>
        </div>
      )}

      {/* Progress row */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-600 text-xs font-mono">
            {clipDuration < 1 ? `${clipDuration * 1000}ms` : `${clipDuration}s`}
          </span>
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
                      transition: isPlaying ? 'none' : 'width 0.15s ease-out',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={playClip}
        disabled={isPlaying || status !== 'playing'}
        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
          isIdle ? 'play-idle hover:scale-105 active:scale-95' : 'hover:scale-105 active:scale-95 disabled:cursor-not-allowed'
        }`}
        style={{
          backgroundColor: isIdle || isPlaying ? 'var(--accent)' : '#18181b',
          boxShadow: isIdle ? '0 0 28px var(--accent-glow)' : 'none',
        }}
      >
        {isPlaying ? (
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
            disabled={!selectedTrack}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={selectedTrack
              ? { backgroundColor: 'var(--accent)', color: 'rgba(0,0,0,0.75)' }
              : { backgroundColor: '#18181b', color: '#52525b', cursor: 'not-allowed' }}
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
