import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import AdminResetButton from './AdminResetButton'

const ADMIN_EMAIL = 'daniel4.cordeiro@gmail.com'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const email = user.email ?? ''
  const name = (user.user_metadata?.full_name as string | undefined) ?? email
  const isAdmin = email === ADMIN_EMAIL

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3.5 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-900">
      <Link href="/" className="text-white font-black tracking-tight text-base hover:text-zinc-300 transition-colors">
        Jimsengdle
      </Link>

      <Link href="/leaderboard" className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors">
        Leaderboard
      </Link>

      <div className="flex items-center gap-3">
        {isAdmin && <AdminResetButton />}

        <div className="text-right hidden sm:block">
          <p className="text-zinc-300 text-xs font-medium leading-none">{name}</p>
          <p className="text-zinc-700 text-xs mt-0.5">{email}</p>
        </div>

        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={32}
            height={32}
            className="rounded-full ring-1 ring-zinc-800"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center ring-1 ring-zinc-700">
            <span className="text-zinc-300 text-xs font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            title="Sign out"
            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  )
}
