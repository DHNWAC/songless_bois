import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'daniel4.cordeiro@gmail.com'

export async function POST() {
  // Verify identity with regular client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service role to bypass RLS for the delete
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().slice(0, 10)

  const { data: challenges } = await admin
    .from('daily_challenges')
    .select('id')
    .eq('challenge_date', today)

  const challengeIds = (challenges ?? []).map((c) => c.id)
  if (!challengeIds.length) return NextResponse.json({ success: true })

  const { error } = await admin
    .from('game_results')
    .delete()
    .eq('user_id', user.id)
    .in('challenge_id', challengeIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
