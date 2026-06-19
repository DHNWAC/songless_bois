export const GENRES = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic', 'Latin'] as const
export type Genre = typeof GENRES[number]

export const CLIP_DURATIONS = [1, 2, 4, 7, 11, 16] // seconds, 6 clips

interface SpotifyToken {
  access_token: string
  expires_at: number
}

let cachedToken: SpotifyToken | null = null

export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error('Failed to get Spotify token')

  const data = await res.json() as { access_token: string; expires_in: number }

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  }

  return cachedToken.access_token
}

export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  previewUrl: string | null
}

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken()

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=8`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) throw new Error('Spotify search failed')

  const data = await res.json() as {
    tracks: {
      items: Array<{
        id: string
        name: string
        artists: Array<{ name: string }>
        preview_url: string | null
      }>
    }
  }

  return data.tracks.items.map((t) => ({
    id: t.id,
    name: t.name,
    artist: t.artists[0]?.name ?? 'Unknown',
    previewUrl: t.preview_url,
  }))
}

export async function getTrackById(trackId: string): Promise<SpotifyTrack> {
  const token = await getSpotifyToken()

  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Failed to fetch track')

  const t = await res.json() as {
    id: string
    name: string
    artists: Array<{ name: string }>
    preview_url: string | null
  }

  return {
    id: t.id,
    name: t.name,
    artist: t.artists[0]?.name ?? 'Unknown',
    previewUrl: t.preview_url,
  }
}
