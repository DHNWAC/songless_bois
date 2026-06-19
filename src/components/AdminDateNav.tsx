'use client'

import { useRouter } from 'next/navigation'

interface AdminDateNavProps {
  currentDate: string
  today: string
}

function offsetDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function AdminDateNav({ currentDate, today }: AdminDateNavProps) {
  const router = useRouter()
  const isToday = currentDate === today

  const go = (date: string) => {
    if (date === today) {
      router.push('/play')
    } else {
      router.push(`/play?date=${date}`)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => go(offsetDate(currentDate, -1))}
        className="px-2 py-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
        title="Previous day"
      >
        ←
      </button>

      <span className="text-xs text-zinc-500 font-mono min-w-[90px] text-center">
        {isToday ? 'today' : currentDate}
      </span>

      <button
        onClick={() => go(offsetDate(currentDate, 1))}
        className="px-2 py-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
        title="Next day"
      >
        →
      </button>

      <button
        onClick={() => go(today)}
        disabled={isToday}
        className="px-2 py-1 text-xs border rounded transition-colors disabled:opacity-0 disabled:pointer-events-none text-zinc-500 hover:text-white border-zinc-800 hover:border-zinc-600"
        title="Back to today"
      >
        today
      </button>
    </div>
  )
}
