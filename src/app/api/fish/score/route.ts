import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { seed, score, moves, time_ms } = await req.json() as {
    seed: number; score: number; moves: number; time_ms: number
  }

  if (!seed || score == null || moves == null || time_ms == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Upsert — only replace if new score is better
  const { data: existing } = await supabase
    .from('fish_scores')
    .select('score')
    .eq('user_id', user.id)
    .eq('seed', seed)
    .maybeSingle()

  if (existing && existing.score >= score) {
    return NextResponse.json({ saved: false, reason: 'not_better' })
  }

  const { error } = await supabase
    .from('fish_scores')
    .upsert({ user_id: user.id, seed, score, moves, time_ms }, { onConflict: 'user_id,seed' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: true })
}
