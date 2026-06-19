'use client'

export default function AdminResetButton() {
  const handleReset = async () => {
    await fetch('/api/admin/reset-today', { method: 'POST' })
    window.location.href = '/play'
  }

  return (
    <button
      onClick={handleReset}
      className="text-xs text-zinc-500 hover:text-red-400 transition-colors border border-zinc-800 hover:border-red-900 rounded px-2 py-1"
      title="Reset today's results"
    >
      🔄 Reset
    </button>
  )
}
