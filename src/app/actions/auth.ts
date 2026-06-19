'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXTAUTH_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/?error=auth_failed')
  }

  redirect(data.url)
}
