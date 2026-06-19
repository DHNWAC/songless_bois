import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ResultSchema = z.object({
  challengeId: z.string().uuid(),
  guesses: z.array(z.string()).max(6),
  solved: z.boolean(),
  attemptsUsed: z.number().int().min(0).max(6),
  timeTakenMs: z.number().int().min(0).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = ResultSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { challengeId, guesses, solved, attemptsUsed, timeTakenMs } = parsed.data

  const { error } = await supabase.from('game_results').upsert({
    user_id: user.id,
    challenge_id: challengeId,
    guesses,
    solved,
    attempts_used: attemptsUsed,
    time_taken_ms: timeTakenMs ?? null,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,challenge_id' })

  if (error) {
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
