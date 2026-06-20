import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signInWithGoogle } from './actions/auth'
import Header from '@/components/Header'
import InAppBrowserGuard from '@/components/InAppBrowserGuard'

const GAMES = [
  {
    id: 'jimsongdle',
    name: 'Jimsongdle',
    description: 'Guess the song from a clip',
    emoji: '🎵',
    href: '/play',
    active: true,
  },
  { id: 'game2', name: 'Save the Fish', description: 'Place rocks to protect the fish from the shark', emoji: '🐟', href: '/fish', active: false },
  { id: 'game3', name: 'Game 3', description: 'Coming soon', emoji: '🎮', href: null, active: false },
  { id: 'game4', name: 'Game 4', description: 'Coming soon', emoji: '🎮', href: null, active: false },
  { id: 'game5', name: 'Game 5', description: 'Coming soon', emoji: '🎮', href: null, active: false },
]

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const params = await searchParams
  const hasError = params.error === 'auth_failed'

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <InAppBrowserGuard />
        {/* Subtle dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="w-full max-w-sm flex flex-col items-center gap-10 relative z-10">
          <div className="text-center">
            {/* Mini waveform decoration */}
            <div className="flex items-end justify-center gap-0.5 h-6 mb-5 opacity-30">
              {[3, 6, 10, 7, 12, 5, 9, 4, 8, 6, 11, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-white"
                  style={{ height: `${h * 2}px` }}
                />
              ))}
            </div>
            <h1 className="text-6xl font-black tracking-tight text-white mb-3 leading-none">
              Jimsengdle
            </h1>
            <p className="text-zinc-600 text-sm tracking-wide">Daily games with the boys</p>
          </div>

          {hasError && (
            <p className="text-red-500 text-sm text-center bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-2">
              Sign in failed. Try again.
            </p>
          )}

          <form action={signInWithGoogle} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold py-3.5 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/40"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          <div>
            <p className="text-zinc-700 text-xs uppercase tracking-[0.2em] mb-1">Today&apos;s challenges</p>
            <h2 className="text-white font-bold text-xl">Games</h2>
          </div>

          <div className="flex flex-col gap-2">
            {GAMES.map((game) =>
              game.active ? (
                <Link
                  key={game.id}
                  href={game.href!}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all hover:scale-[1.01] active:scale-[0.99] group"
                >
                  <span className="text-2xl">{game.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{game.name}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{game.description}</p>
                  </div>
                  <span className="text-zinc-700 group-hover:text-zinc-400 text-sm transition-colors">→</span>
                </Link>
              ) : (
                <div
                  key={game.id}
                  className="relative flex items-center gap-4 p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 opacity-40 cursor-not-allowed overflow-hidden"
                >
                  <span className="text-2xl grayscale">{game.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-500 font-semibold text-sm">{game.name}</p>
                    <p className="text-zinc-700 text-xs mt-0.5">{game.description}</p>
                  </div>
                  {game.href ? (
                    <span className="text-zinc-500 text-xs font-medium">Unavailable</span>
                  ) : (
                    <span className="text-zinc-700 text-xs">Soon</span>
                  )}
                  {game.href && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="absolute inset-0 opacity-10 bg-red-950" />
                      <svg className="w-16 h-16 text-red-600 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="4" y1="4" x2="20" y2="20" />
                        <line x1="20" y1="4" x2="4" y2="20" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
