import Link from 'next/link'

const GAMES = [
  {
    id: 'jimsongdle',
    href: '/jimsongdle',
    emoji: '🎵',
    name: 'Jimsongdle',
    tagline: 'Guess the song from a clip',
    live: true,
    accentColor: '#22c55e',
  },
  {
    id: 'placeholder-3',
    href: null,
    emoji: '🧩',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'placeholder-4',
    href: null,
    emoji: '🏆',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'placeholder-5',
    href: null,
    emoji: '🎲',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'placeholder-6',
    href: null,
    emoji: '⚡',
    name: '???',
    tagline: 'Coming soon',
    live: false,
    accentColor: '#3f3f46',
  },
  {
    id: 'case-open',
    href: '/case-open',
    emoji: '📦',
    name: 'Case Open',
    tagline: 'Roll your rarity — play all games first for better odds',
    live: true,
    accentColor: '#e4ae39',
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen px-4 py-12 sm:py-20 relative overflow-hidden">
      {/* Dot grid bg */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-lg mx-auto relative z-10 flex flex-col gap-10">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-none">
          Daily Games
        </h1>

        {/* Game grid */}
        <div className="flex flex-col gap-3">
          {GAMES.map((game) => {
            const inner = (
              <div
                className={[
                  'w-full rounded-2xl border p-5 flex items-center gap-4 transition-all',
                  game.live
                    ? 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-900 active:scale-[0.98] cursor-pointer'
                    : 'border-zinc-800/60 bg-zinc-950/40 cursor-default',
                ].join(' ')}
              >
                {/* Emoji icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{
                    backgroundColor: game.live ? `${game.accentColor}18` : 'rgba(39,39,42,0.5)',
                    border: `1px solid ${game.live ? `${game.accentColor}40` : '#27272a'}`,
                  }}
                >
                  {game.emoji}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={['font-bold text-base', game.live ? 'text-white' : 'text-zinc-600'].join(' ')}>
                      {game.name}
                    </p>
                    {game.live && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: `${game.accentColor}20`, color: game.accentColor }}
                      >
                        Live
                      </span>
                    )}
                  </div>
                  <p className={['text-sm', game.live ? 'text-zinc-400' : 'text-zinc-700'].join(' ')}>
                    {game.tagline}
                  </p>
                </div>

                {/* Arrow */}
                {game.live && (
                  <span className="text-zinc-600 text-lg shrink-0">→</span>
                )}
              </div>
            )

            return game.href ? (
              <Link key={game.id} href={game.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={game.id}>{inner}</div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
