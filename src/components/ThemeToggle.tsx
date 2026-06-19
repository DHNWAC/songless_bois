'use client'

import { useState, useEffect } from 'react'

const DEFAULT = {
  accent: '#22c55e',
  hover: '#4ade80',
  glow: 'rgba(34, 197, 94, 0.15)',
  dim: 'rgba(34, 197, 94, 0.06)',
}

const KEY = 'jimsengdle-accent'

function randColors() {
  const h = Math.floor(Math.random() * 360)
  return {
    accent: `hsl(${h}, 65%, 55%)`,
    hover: `hsl(${h}, 65%, 68%)`,
    glow: `hsla(${h}, 65%, 55%, 0.15)`,
    dim: `hsla(${h}, 65%, 55%, 0.06)`,
  }
}

function applyColors(c: typeof DEFAULT) {
  const r = document.documentElement
  r.style.setProperty('--accent', c.accent)
  r.style.setProperty('--accent-hover', c.hover)
  r.style.setProperty('--accent-glow', c.glow)
  r.style.setProperty('--accent-dim', c.dim)
}

export default function ThemeToggle() {
  const [color, setColor] = useState(DEFAULT.accent)
  const [isDefault, setIsDefault] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) {
        const c = JSON.parse(saved) as typeof DEFAULT
        applyColors(c)
        setColor(c.accent)
        setIsDefault(false)
      }
    } catch {}
  }, [])

  const randomize = () => {
    const c = randColors()
    applyColors(c)
    setColor(c.accent)
    setIsDefault(false)
    localStorage.setItem(KEY, JSON.stringify(c))
  }

  const reset = () => {
    applyColors(DEFAULT)
    setColor(DEFAULT.accent)
    setIsDefault(true)
    localStorage.removeItem(KEY)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      {!isDefault && (
        <button
          onClick={reset}
          title="Reset to default green"
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white flex items-center justify-center text-base leading-none transition-all hover:scale-110 active:scale-95 shadow-lg"
        >
          ↺
        </button>
      )}
      <button
        onClick={randomize}
        title="Randomise accent colour"
        aria-label="Randomise accent colour"
        className="w-10 h-10 rounded-full border-2 border-zinc-800 hover:border-zinc-600 transition-all hover:scale-110 active:scale-95 shadow-xl"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
