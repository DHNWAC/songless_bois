import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import FishGame from '@/components/fish/FishGame'
import './fish.css'

export const metadata = { title: 'Cage the Shark — Jimsengdle' }

const ADMIN_EMAIL = 'daniel4.cordeiro@gmail.com'

function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export default async function FishPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === ADMIN_EMAIL

  const params = await searchParams
  const seed = params.seed ? parseInt(params.seed, 10) || dailySeed() : dailySeed()

  return (
    <>
      <Header />
      <main className="fish-main min-h-screen pt-20">
        <FishGame initialSeed={seed} isAdmin={isAdmin} />
      </main>
    </>
  )
}
