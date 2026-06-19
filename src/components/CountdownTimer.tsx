'use client'

import { useState, useEffect } from 'react'

function getTimeUntilMidnight() {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CountdownTimer() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(getTimeUntilMidnight())
    const interval = setInterval(() => setTime(getTimeUntilMidnight()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center">
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Next songs in</p>
      <p className="text-white font-mono text-2xl font-bold">{time ?? '--:--:--'}</p>
    </div>
  )
}
