'use client'

import { useState } from 'react'
import Image from 'next/image'

interface GenreEntry {
  genre: string
  solved: boolean
  attemptsUsed: number
  timeTakenMs: number | null
}

interface TodayEntry {
  userId: string
  name: string
  avatarUrl: string | null
  score: number
  maxScore: number
  genres: GenreEntry[]
  totalTimeMs: number
}

interface AllTimeEntry {
  userId: string
  name: string
  avatarUrl: string | null
  totalScore: number
  totalGames: number
  winRate: number
  avgTimeMs: number | null
  streak: number
  daysPlayed: number
}

interface LeaderboardViewProps {
  todayEntries: TodayEntry[]
  allTimeEntries: AllTimeEntry[]
  dayNumber: number
  currentUserId: string
}

const MEDALS = ['🥇', '🥈', '🥉']

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <Image src={url} alt={name} width={36} height={36} className="rounded-full flex-shrink-0" />
  }
  return (
    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-sm font-semibold">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

function formatTime(ms: number): string {
  if (ms === 0) return '--'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return m > 0 ? `${m}m ${rem}s` : `${s}s`
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-zinc-800 rounded-lg px-3 py-2 min-w-[56px]">
      <span className="text-white font-bold text-sm leading-none">{value}</span>
      <span className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wide">{label}</span>
    </div>
  )
}

export default function LeaderboardView({
  todayEntries,
  allTimeEntries,
  dayNumber,
  currentUserId,
}: LeaderboardViewProps) {
  const [tab, setTab] = useState<'today' | 'alltime'>('today')

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div>
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Day {dayNumber}</p>
        <h1 className="text-white font-black text-2xl tracking-tight">Leaderboard</h1>
        <p className="text-zinc-500 text-xs mt-0.5">Jimsongdle</p>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        {(['today', 'alltime'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t === 'today' ? "Today" : 'All-time'}
          </button>
        ))}
      </div>

      {tab === 'today' ? (
        todayEntries.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-12">No scores yet today.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {todayEntries.map((entry, i) => (
              <div
                key={entry.userId}
                className={`flex flex-col gap-3 p-4 rounded-xl border ${
                  entry.userId === currentUserId
                    ? 'border-zinc-500 bg-zinc-800/60'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center flex-shrink-0">
                    {MEDALS[i] ?? <span className="text-zinc-500 text-sm font-bold">{i + 1}</span>}
                  </span>
                  <Avatar url={entry.avatarUrl} name={entry.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{entry.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {entry.totalTimeMs > 0 ? `⏱ ${formatTime(entry.totalTimeMs)}` : 'In progress'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-xl leading-none">{entry.score}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">/{entry.maxScore}</p>
                  </div>
                </div>

                {/* Genre breakdown */}
                <div className="flex gap-2 pl-9">
                  {entry.genres.map((g) => (
                    <div
                      key={g.genre}
                      className={`flex-1 rounded-lg p-2 border text-center ${
                        g.solved
                          ? 'border-green-800 bg-green-900/20'
                          : 'border-zinc-800 bg-zinc-800/40'
                      }`}
                    >
                      <p className={`text-xs font-medium ${g.solved ? 'text-green-400' : 'text-zinc-500'}`}>
                        {g.genre.slice(0, 3)}
                      </p>
                      <p className="text-zinc-400 text-[10px] mt-0.5">
                        {g.solved ? `clip ${g.attemptsUsed}` : '✗'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        allTimeEntries.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-12">No scores yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {allTimeEntries.map((entry, i) => (
              <div
                key={entry.userId}
                className={`flex flex-col gap-3 p-4 rounded-xl border ${
                  entry.userId === currentUserId
                    ? 'border-zinc-500 bg-zinc-800/60'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center flex-shrink-0">
                    {MEDALS[i] ?? <span className="text-zinc-500 text-sm font-bold">{i + 1}</span>}
                  </span>
                  <Avatar url={entry.avatarUrl} name={entry.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{entry.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{entry.daysPlayed} days played</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-xl leading-none">{entry.totalScore}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">pts</p>
                  </div>
                </div>

                {/* Stat chips */}
                <div className="flex gap-2 pl-9">
                  <StatChip label="Win %" value={`${entry.winRate}%`} />
                  <StatChip label="Avg time" value={entry.avgTimeMs ? formatTime(entry.avgTimeMs) : '--'} />
                  <StatChip label="Streak" value={entry.streak > 0 ? `🔥${entry.streak}` : '0'} />
                  <StatChip label="Games" value={String(entry.totalGames)} />
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
