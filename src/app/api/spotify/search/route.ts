import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchTracks } from '@/lib/deezer'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ tracks: [] })
  }

  try {
    const tracks = await searchTracks(query)
    return NextResponse.json({ tracks })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
