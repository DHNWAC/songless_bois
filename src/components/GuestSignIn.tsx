'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function GuestSignIn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGuest = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInAnonymously()
    if (!error) {
      router.push('/')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGuest}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold py-3.5 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Entering...' : '👤 Continue as Guest'}
    </button>
  )
}
